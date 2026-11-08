/**
 * Catalog read layer — Stage 3: backed by Supabase.
 *
 * Every function returns a Promise and reads from the public schema via
 * the server Supabase client (anon key + user cookies → RLS enforced).
 *
 * Nothing in this module returns private data (partner contact notes,
 * fulfillment secrets, recipient details). It is the public catalog.
 */
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  City,
  Country,
  Currency,
  DeliverySettings,
  Destination,
  GiftCardDenomination,
  GiftCardDetails,
  Occasion,
  Partner,
  PartnerLocation,
  Product,
  ProductAvailability,
  ProductDetail,
  ProductImage,
  ProductSummary,
  ProductType,
  ProductVariant,
  StoreCategory,
} from "@/types/domain";

/* ---------- Helpers ---------- */

/** Map a snake_case DB row to our camelCase Currency type. */
function toCurrency(r: Record<string, unknown>): Currency {
  return {
    code: r.code as string,
    name: r.name as string,
    minorUnitExponent: r.minor_unit_exponent as number,
    symbol: (r.symbol as string) ?? undefined,
    isChargeCurrency: r.is_charge_currency as boolean,
    isFaceCurrency: r.is_face_currency as boolean,
  };
}

function toCountry(r: Record<string, unknown>): Country {
  return {
    code: r.code as string,
    name: r.name as string,
    isDestination: r.is_destination as boolean,
    isOrigin: r.is_origin as boolean,
    defaultTimezone: r.default_timezone as string,
    isActive: r.is_active as boolean,
  };
}

function toCity(r: Record<string, unknown>): City {
  return {
    id: r.id as string,
    countryCode: r.country_code as string,
    name: r.name as string,
    slug: r.slug as string,
    timezone: r.timezone as string,
    isActive: r.is_active as boolean,
    sortOrder: r.sort_order as number,
  };
}

function toDeliverySettings(r: Record<string, unknown>): DeliverySettings {
  return {
    cityId: r.city_id as string,
    minLeadDays: r.min_lead_days as number,
    maxAdvanceDays: r.max_advance_days as number,
    cutoffTime: r.cutoff_time as string,
    blackoutDates: (r.blackout_dates as string[]) ?? [],
    deliveryDays: (r.delivery_days as number[]) ?? [],
  };
}

function toCategory(r: Record<string, unknown>): Category {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: r.description as string,
    productType: r.product_type as ProductType,
    sortOrder: r.sort_order as number,
    isActive: r.is_active as boolean,
    imagePath: (r.image_path as string) ?? "",
  };
}

function toOccasion(r: Record<string, unknown>): Occasion {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: r.description as string,
    isActive: r.is_active as boolean,
    imagePath: (r.image_path as string) ?? "",
  };
}

function toPartner(r: Record<string, unknown>): Partner {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: r.description as string,
    logoPath: (r.logo_path as string) ?? "",
    storeCategory: r.store_category as StoreCategory,
    countryCode: r.country_code as string,
    status: r.status as Partner["status"],
    isDemo: r.is_demo as boolean,
    supportedFulfillmentMethods: r.supported_fulfillment_methods as Partner["supportedFulfillmentMethods"],
  };
}

function toPartnerLocation(r: Record<string, unknown>): PartnerLocation {
  return {
    id: r.id as string,
    partnerId: r.partner_id as string,
    cityId: r.city_id as string,
    label: r.label as string,
    address: (r.address as string) ?? undefined,
    isActive: r.is_active as boolean,
  };
}

function toProductImage(r: Record<string, unknown>): ProductImage {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    path: r.storage_path as string,
    alt: r.alt as string,
    sortOrder: r.sort_order as number,
  };
}

function toProductVariant(r: Record<string, unknown>): ProductVariant {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    name: r.name as string,
    sku: (r.sku as string) ?? "",
    priceMinor: r.price_minor as number,
    currency: r.currency as string,
    isDefault: r.is_default as boolean,
    isActive: r.is_active as boolean,
  };
}

function toProductAvailability(r: Record<string, unknown>): ProductAvailability {
  return {
    productId: r.product_id as string,
    cityId: r.city_id as string,
    isAvailable: r.is_available as boolean,
    leadTimeDays: (r.lead_time_days as number) ?? undefined,
  };
}

function toGiftCardDenomination(r: Record<string, unknown>): GiftCardDenomination {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    faceValueMinor: r.face_value_minor as number,
    faceCurrency: r.face_currency as string,
    chargePriceMinor: r.charge_price_minor as number,
    chargeCurrency: r.charge_currency as string,
    isActive: r.is_active as boolean,
    sortOrder: r.sort_order as number,
  };
}

function toGiftCardDetails(r: Record<string, unknown>, acceptedLocationIds: string[]): GiftCardDetails {
  return {
    productId: r.product_id as string,
    faceCurrency: r.face_currency as string,
    defaultFulfillmentMethod: r.default_fulfillment_method as GiftCardDetails["defaultFulfillmentMethod"],
    allowedFulfillmentMethods: r.allowed_fulfillment_methods as GiftCardDetails["allowedFulfillmentMethods"],
    redemptionInstructions: r.redemption_instructions as string,
    terms: r.terms as string,
    termsVersion: r.terms_version as number,
    expiryMonths: (r.expiry_months as number) ?? null,
    restrictions: r.restrictions as string,
    deliveryTimingNote: r.delivery_timing_note as string,
    acceptedLocationIds,
  };
}

/* ---------- Reference data ---------- */

export async function getCurrencies(): Promise<Currency[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("currencies").select("*");
  if (error) throw error;
  return (data ?? []).map(toCurrency);
}

export async function getCurrencyMap(): Promise<Map<string, Currency>> {
  const currencies = await getCurrencies();
  return new Map(currencies.map((c) => [c.code, c]));
}

export async function getDestinationCountries(): Promise<Country[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .eq("is_destination", true)
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map(toCountry);
}

export async function getOriginCountries(): Promise<Country[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .eq("is_origin", true)
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map(toCountry);
}

export async function getCities(countryCode?: string): Promise<City[]> {
  const supabase = await createClient();
  let query = supabase.from("cities").select("*").eq("is_active", true).order("sort_order");
  if (countryCode) query = query.eq("country_code", countryCode);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toCity);
}

export async function getDestinationBySlug(citySlug: string | undefined): Promise<Destination | null> {
  if (!citySlug) return null;
  const supabase = await createClient();
  const { data: cityRow, error: cityErr } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", citySlug)
    .eq("is_active", true)
    .maybeSingle();
  if (cityErr) throw cityErr;
  if (!cityRow) return null;

  const { data: countryRow, error: countryErr } = await supabase
    .from("countries")
    .select("*")
    .eq("code", cityRow.country_code)
    .single();
  if (countryErr) throw countryErr;

  return { country: toCountry(countryRow), city: toCity(cityRow) };
}

export async function getDeliverySettings(cityId: string): Promise<DeliverySettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_settings")
    .select("*")
    .eq("city_id", cityId)
    .maybeSingle();
  if (error) throw error;
  return data ? toDeliverySettings(data) : null;
}

export async function getCategories(type?: ProductType): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
  if (type) query = query.eq("product_type", type);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toCategory(data) : null;
}

export async function getOccasions(): Promise<Occasion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("occasions")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map(toOccasion);
}

export async function getOccasionBySlug(slug: string): Promise<Occasion | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("occasions")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toOccasion(data) : null;
}

export async function getPartners(): Promise<Partner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("partners_public").select("*");
  if (error) throw error;
  return (data ?? []).map(toPartner);
}

export async function getPartnerLocations(partnerId: string): Promise<PartnerLocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_locations")
    .select("*")
    .eq("partner_id", partnerId)
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map(toPartnerLocation);
}

/* ---------- Products ---------- */

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export interface ListProductsParams {
  type: ProductType;
  cityId?: string;
  categorySlug?: string;
  occasionSlug?: string;
  storeCategory?: StoreCategory;
  minMinor?: number;
  maxMinor?: number;
  query?: string;
  sort?: SortKey;
  featuredOnly?: boolean;
  limit?: number;
}

export async function listProducts(params: ListProductsParams): Promise<ProductSummary[]> {
  const supabase = await createClient();

  // Build the base product query
  let query = supabase
    .from("products")
    .select(`
      *,
      categories!inner ( slug, name ),
      product_images ( id, storage_path, alt, sort_order ),
      product_variants ( price_minor, is_active ),
      gift_card_products ( gift_card_denominations ( charge_price_minor, charge_currency, is_active ) ),
      partners ( name, store_category )
    `)
    .eq("status", "active")
    .eq("product_type", params.type);

  if (params.featuredOnly) query = query.eq("is_featured", true);

  // Category filter via the joined categories table
  if (params.categorySlug) query = query.eq("categories.slug", params.categorySlug);

  // Text search
  if (params.query?.trim()) {
    const q = params.query.trim();
    query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
  }

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows) return [];

  // Filter by city availability if a destination is chosen
  let filteredRows = rows;
  if (params.cityId) {
    const { data: availRows } = await supabase
      .from("product_availability")
      .select("product_id")
      .eq("city_id", params.cityId)
      .eq("is_available", true);
    const availableIds = new Set((availRows ?? []).map((a: Record<string, unknown>) => a.product_id));
    filteredRows = filteredRows.filter((r: Record<string, unknown>) => availableIds.has(r.id));
  }

  // Filter by occasion (join table)
  if (params.occasionSlug) {
    const { data: occRow } = await supabase
      .from("occasions")
      .select("id")
      .eq("slug", params.occasionSlug)
      .maybeSingle();
    if (occRow) {
      const { data: poRows } = await supabase
        .from("product_occasions")
        .select("product_id")
        .eq("occasion_id", occRow.id);
      const poIds = new Set((poRows ?? []).map((r: Record<string, unknown>) => r.product_id));
      filteredRows = filteredRows.filter((r: Record<string, unknown>) => poIds.has(r.id));
    } else {
      return [];
    }
  }

  // Filter by store category via joined partner
  if (params.storeCategory) {
    filteredRows = filteredRows.filter((r: Record<string, unknown>) => {
      const partner = r.partners as Record<string, unknown> | null;
      return partner?.store_category === params.storeCategory;
    });
  }

  // Map to summaries
  let summaries: ProductSummary[] = filteredRows.map((r: Record<string, unknown>) => {
    const cat = r.categories as Record<string, unknown>;
    const images = (r.product_images as Record<string, unknown>[]) ?? [];
    const partner = r.partners as Record<string, unknown> | null;
    const sortedImages = images.sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.sort_order as number) - (b.sort_order as number)
    );
    const firstImage = sortedImages[0] ?? null;

    let fromMinor = r.base_price_minor as number;
    let currency = r.currency as string;

    if (r.product_type === "gift_card") {
      const gcp = r.gift_card_products as Record<string, unknown> | null;
      const dens = ((gcp?.gift_card_denominations as Record<string, unknown>[]) ?? []).filter(
        (d: Record<string, unknown>) => d.is_active
      );
      if (dens.length) {
        const cheapest = dens.reduce((a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a.charge_price_minor as number) <= (b.charge_price_minor as number) ? a : b
        );
        fromMinor = cheapest.charge_price_minor as number;
        currency = cheapest.charge_currency as string;
      }
    } else {
      const vars = ((r.product_variants as Record<string, unknown>[]) ?? []).filter(
        (v: Record<string, unknown>) => v.is_active
      );
      if (vars.length) fromMinor = Math.min(...vars.map((v: Record<string, unknown>) => v.price_minor as number));
    }

    return {
      id: r.id as string,
      slug: r.slug as string,
      productType: r.product_type as ProductType,
      name: r.name as string,
      shortDescription: r.short_description as string,
      categorySlug: cat.slug as string,
      categoryName: cat.name as string,
      isFeatured: r.is_featured as boolean,
      isDemo: r.is_demo as boolean,
      fromPrice: { amountMinor: fromMinor, currency },
      image: firstImage
        ? {
            id: firstImage.id as string,
            productId: r.id as string,
            path: firstImage.storage_path as string,
            alt: firstImage.alt as string,
            sortOrder: firstImage.sort_order as number,
          }
        : null,
      partnerName: (partner?.name as string) ?? null,
      storeCategory: (partner?.store_category as StoreCategory) ?? null,
    };
  });

  // Price range filter (applied after computing fromPrice)
  if (params.minMinor !== undefined) summaries = summaries.filter((s) => s.fromPrice.amountMinor >= params.minMinor!);
  if (params.maxMinor !== undefined) summaries = summaries.filter((s) => s.fromPrice.amountMinor <= params.maxMinor!);

  // Sort
  switch (params.sort ?? "featured") {
    case "price-asc":
      summaries.sort((a, b) => a.fromPrice.amountMinor - b.fromPrice.amountMinor);
      break;
    case "price-desc":
      summaries.sort((a, b) => b.fromPrice.amountMinor - a.fromPrice.amountMinor);
      break;
    case "name":
      summaries.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      summaries.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));
  }

  return params.limit ? summaries.slice(0, params.limit) : summaries;
}

export async function getProductBySlug(slug: string, type?: ProductType): Promise<ProductDetail | null> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active");
  if (type) query = query.eq("product_type", type);

  const { data: p, error } = await query.maybeSingle();
  if (error) throw error;
  if (!p) return null;

  // Fetch all relations in parallel
  const [catRes, imagesRes, variantsRes, availRes, occasionsRes, partnerRes, gcRes] = await Promise.all([
    supabase.from("categories").select("*").eq("id", p.category_id).single(),
    supabase.from("product_images").select("*").eq("product_id", p.id).order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", p.id).eq("is_active", true),
    supabase.from("product_availability").select("*").eq("product_id", p.id),
    supabase.from("product_occasions").select("occasion_id").eq("product_id", p.id),
    p.partner_id
      ? supabase.from("partners_public").select("*").eq("id", p.partner_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("gift_card_products").select("*").eq("product_id", p.id).maybeSingle(),
  ]);

  // Fetch full occasion objects
  const occasionIds = (occasionsRes.data ?? []).map((r: Record<string, unknown>) => r.occasion_id as string);
  let occasions: Occasion[] = [];
  if (occasionIds.length) {
    const { data: occData } = await supabase.from("occasions").select("*").in("id", occasionIds);
    occasions = (occData ?? []).map(toOccasion);
  }

  // Gift card details + denominations + accepted locations
  let giftCard: ProductDetail["giftCard"] = null;
  if (gcRes.data) {
    const [denomRes, locRes] = await Promise.all([
      supabase
        .from("gift_card_denominations")
        .select("*")
        .eq("product_id", p.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("gift_card_accepted_locations")
        .select("location_id")
        .eq("product_id", p.id),
    ]);

    const acceptedLocationIds = (locRes.data ?? []).map((r: Record<string, unknown>) => r.location_id as string);
    giftCard = {
      ...toGiftCardDetails(gcRes.data, acceptedLocationIds),
      denominations: (denomRes.data ?? []).map(toGiftCardDenomination),
    };
  }

  const category = toCategory(catRes.data!);

  return {
    id: p.id as string,
    slug: p.slug as string,
    productType: p.product_type as ProductType,
    categoryId: p.category_id as string,
    partnerId: (p.partner_id as string) ?? null,
    name: p.name as string,
    shortDescription: p.short_description as string,
    description: p.description as string,
    status: p.status as Product["status"],
    isFeatured: p.is_featured as boolean,
    isDemo: p.is_demo as boolean,
    basePriceMinor: p.base_price_minor as number,
    currency: p.currency as string,
    occasionIds: occasionIds,
    category,
    images: (imagesRes.data ?? []).map(toProductImage),
    variants: (variantsRes.data ?? []).map(toProductVariant),
    availability: (availRes.data ?? []).map(toProductAvailability),
    occasions,
    partner: partnerRes.data ? toPartner(partnerRes.data) : null,
    giftCard,
  };
}

export async function getProductDestinations(productId: string): Promise<Destination[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_availability")
    .select("city_id")
    .eq("product_id", productId)
    .eq("is_available", true);
  if (error) throw error;

  const cityIds = (data ?? []).map((r: Record<string, unknown>) => r.city_id as string);
  if (!cityIds.length) return [];

  const { data: cityRows } = await supabase
    .from("cities")
    .select("*")
    .in("id", cityIds)
    .eq("is_active", true);

  const { data: countryRows } = await supabase
    .from("countries")
    .select("*");

  const countryMap = new Map((countryRows ?? []).map((c: Record<string, unknown>) => [c.code as string, toCountry(c)]));

  return (cityRows ?? [])
    .map(toCity)
    .map((city) => ({
      city,
      country: countryMap.get(city.countryCode)!,
    }))
    .filter((d) => d.country);
}

export async function getAllProductSlugs(type: ProductType): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("status", "active")
    .eq("product_type", type);
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => r.slug as string);
}
