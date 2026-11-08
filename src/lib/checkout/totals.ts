/**
 * Server-side cart re-pricing.
 *
 * The client sends product/variant/denomination IDs and quantities.
 * This module fetches real prices from the database and computes the
 * authoritative totals that go into the order.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductType } from "@/types/domain";

export interface PricedLine {
  productId: string;
  variantId: string | null;
  denominationId: string | null;
  productType: ProductType;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currency: string;
  giftMessage: string;
  /** Snapshot of product/variant/denomination for the order_items row */
  snapshot: Record<string, unknown>;
  fulfillmentMethod: string | null;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
  containsPhysical: boolean;
  containsDigital: boolean;
  destinationCityId: string;
  destinationCountryCode: string;
}

export interface CartLineInput {
  productId: string;
  variantId: string | null;
  denominationId: string | null;
  quantity: number;
  giftMessage: string;
}

/**
 * Re-price the cart server-side. Throws on any validation failure
 * (missing product, unavailable in city, inactive variant, etc.).
 */
export async function priceCart(
  lines: CartLineInput[],
  cityId: string,
  deliveryFeeMinor: number,
): Promise<PricedCart> {
  const supabase = createAdminClient();

  const productIds = [...new Set(lines.map((l) => l.productId))];

  // Fetch all products in one query
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("*, categories(name, slug), partners(name, store_category)")
    .in("id", productIds)
    .eq("status", "active");
  if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);

  const productMap = new Map((products ?? []).map((p: Record<string, unknown>) => [p.id as string, p]));

  // Fetch availability for these products in this city
  const { data: availRows } = await supabase
    .from("product_availability")
    .select("product_id")
    .in("product_id", productIds)
    .eq("city_id", cityId)
    .eq("is_available", true);
  const availableIds = new Set((availRows ?? []).map((a: Record<string, unknown>) => a.product_id as string));

  // Fetch variants and denominations
  const variantIds = lines.map((l) => l.variantId).filter(Boolean) as string[];
  const denomIds = lines.map((l) => l.denominationId).filter(Boolean) as string[];

  const [variantRes, denomRes] = await Promise.all([
    variantIds.length
      ? supabase.from("product_variants").select("*").in("id", variantIds).eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
    denomIds.length
      ? supabase.from("gift_card_denominations").select("*").in("id", denomIds).eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const variantMap = new Map((variantRes.data ?? []).map((v: Record<string, unknown>) => [v.id as string, v]));
  const denomMap = new Map((denomRes.data ?? []).map((d: Record<string, unknown>) => [d.id as string, d]));

  // Fetch gift card details for gift card products
  const gcProductIds = lines
    .filter((l) => productMap.get(l.productId)?.product_type === "gift_card")
    .map((l) => l.productId);
  let gcMap = new Map<string, Record<string, unknown>>();
  if (gcProductIds.length) {
    const { data: gcRows } = await supabase
      .from("gift_card_products")
      .select("*")
      .in("product_id", gcProductIds);
    gcMap = new Map((gcRows ?? []).map((g: Record<string, unknown>) => [g.product_id as string, g]));
  }

  // Price each line
  let currency: string | null = null;
  let containsPhysical = false;
  let containsDigital = false;
  const pricedLines: PricedLine[] = [];

  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) throw new Error(`Product ${line.productId} not found or not active`);
    if (!availableIds.has(line.productId)) {
      throw new Error(`Product "${product.name}" is not available in the selected city`);
    }

    const productType = product.product_type as ProductType;
    let unitPriceMinor: number;
    let lineCurrency: string;
    let fulfillmentMethod: string | null = null;
    const snapshot: Record<string, unknown> = {
      name: product.name,
      productType,
    };

    if (productType === "gift_card") {
      // Gift card: price comes from the denomination
      if (!line.denominationId) throw new Error(`Gift card "${product.name}" requires a denomination`);
      const denom = denomMap.get(line.denominationId);
      if (!denom) throw new Error(`Denomination ${line.denominationId} not found or inactive`);
      if (denom.product_id !== line.productId) throw new Error("Denomination does not belong to this product");

      unitPriceMinor = denom.charge_price_minor as number;
      lineCurrency = denom.charge_currency as string;

      const gc = gcMap.get(line.productId);
      fulfillmentMethod = (gc?.default_fulfillment_method as string) ?? "manual";

      snapshot.faceValueMinor = denom.face_value_minor;
      snapshot.faceCurrency = denom.face_currency;
      snapshot.chargePriceMinor = denom.charge_price_minor;
      snapshot.chargeCurrency = denom.charge_currency;
      snapshot.partnerName = (product.partners as Record<string, unknown>)?.name ?? null;
      snapshot.fulfillmentMethod = fulfillmentMethod;
      snapshot.redemptionInstructions = gc?.redemption_instructions ?? "";
      snapshot.terms = gc?.terms ?? "";
      snapshot.termsVersion = gc?.terms_version ?? 1;

      containsDigital = true;
    } else {
      // Physical product: price from variant or base
      if (line.variantId) {
        const variant = variantMap.get(line.variantId);
        if (!variant) throw new Error(`Variant ${line.variantId} not found or inactive`);
        if (variant.product_id !== line.productId) throw new Error("Variant does not belong to this product");
        unitPriceMinor = variant.price_minor as number;
        lineCurrency = variant.currency as string;
        snapshot.variantName = variant.name;
      } else {
        unitPriceMinor = product.base_price_minor as number;
        lineCurrency = product.currency as string;
      }

      const img = await supabase
        .from("product_images")
        .select("storage_path")
        .eq("product_id", line.productId)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      snapshot.imagePath = img.data?.storage_path ?? null;

      containsPhysical = true;
    }

    // Enforce single currency
    if (!currency) currency = lineCurrency;
    else if (currency !== lineCurrency) {
      throw new Error(`All items must use the same charge currency (${currency}), but "${product.name}" uses ${lineCurrency}`);
    }

    pricedLines.push({
      productId: line.productId,
      variantId: line.variantId,
      denominationId: line.denominationId,
      productType,
      quantity: line.quantity,
      unitPriceMinor,
      lineTotalMinor: unitPriceMinor * line.quantity,
      currency: lineCurrency,
      giftMessage: line.giftMessage,
      snapshot,
      fulfillmentMethod,
    });
  }

  const subtotalMinor = pricedLines.reduce((sum, l) => sum + l.lineTotalMinor, 0);

  // Look up destination country
  const { data: cityRow } = await supabase
    .from("cities")
    .select("country_code")
    .eq("id", cityId)
    .single();

  return {
    lines: pricedLines,
    subtotalMinor,
    deliveryFeeMinor,
    totalMinor: subtotalMinor + deliveryFeeMinor,
    currency: currency!,
    containsPhysical,
    containsDigital,
    destinationCityId: cityId,
    destinationCountryCode: cityRow?.country_code ?? "",
  };
}
