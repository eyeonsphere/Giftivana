/**
 * Checkout Server Actions.
 *
 * The single entry point for order creation. Validates input, re-prices the
 * cart server-side, computes delivery fees, creates the order with all related
 * rows, and processes payment — all in one server action.
 */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/checkout/schema";
import { priceCart, type CartLineInput } from "@/lib/checkout/totals";
import { getDeliveryFee } from "@/lib/delivery/fees";
import { getDeliverySettings, getDestinationBySlug } from "@/lib/catalog/queries";
import { isValidDeliveryDate } from "@/lib/delivery/dates";
import { getProvider } from "@/lib/payments/registry";
// import { containsPhysical, containsDigital } from "@/lib/cart/rules";
import crypto from "node:crypto";

export interface CheckoutResult {
  ok: boolean;
  orderNumber?: string;
  orderId?: string;
  /** For guest checkout — the token to access the order */
  accessToken?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createOrder(input: unknown): Promise<CheckoutResult> {
  // 1. Validate input
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { ok: false, error: "Validation failed", fieldErrors };
  }

  const data = parsed.data;

  // 2. Check idempotency — if an order with this key exists, return it
  const admin = createAdminClient();
  const { data: existingOrder } = await admin
    .from("orders")
    .select("id, order_number")
    .eq("idempotency_key", data.idempotencyKey)
    .maybeSingle();

  if (existingOrder) {
    return {
      ok: true,
      orderNumber: existingOrder.order_number,
      orderId: existingOrder.id,
    };
  }

  // 3. Resolve destination
  const destination = await getDestinationBySlug(data.citySlug);
  if (!destination) return { ok: false, error: "Invalid destination" };

  const cityId = destination.city.id;

  // 4. Validate delivery date
  const settings = await getDeliverySettings(cityId);
  if (!settings) return { ok: false, error: "Delivery settings not found for this city" };

  if (!isValidDeliveryDate(data.deliveryDate, settings, destination.city.timezone)) {
    return { ok: false, error: "Selected delivery date is not available" };
  }

  // 5. Compute delivery fee
  const cartLines: CartLineInput[] = data.lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    denominationId: l.denominationId,
    quantity: l.quantity,
    giftMessage: l.giftMessage,
  }));

  // We need to determine containsPhysical/containsDigital before fee lookup
  // For now, fetch products to check types
  const { data: productRows } = await admin
    .from("products")
    .select("id, product_type")
    .in("id", data.lines.map((l) => l.productId));

  const typeMap = new Map((productRows ?? []).map((p: Record<string, unknown>) => [p.id, p.product_type]));
  const hasPhysical = data.lines.some((l) => typeMap.get(l.productId) === "physical");
  const hasDigital = data.lines.some((l) => typeMap.get(l.productId) === "gift_card");

  const fee = await getDeliveryFee(cityId, hasPhysical, hasDigital);
  const deliveryFeeMinor = fee?.feeMinor ?? 0;

  // 6. Re-price cart server-side
  let priced;
  try {
    priced = await priceCart(cartLines, cityId, deliveryFeeMinor);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  // 7. Get current user (optional — guest checkout is allowed)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 8. Generate guest access token if no user
  let guestAccessToken: string | undefined;
  let guestAccessTokenHash: string | null = null;
  if (!user) {
    guestAccessToken = crypto.randomUUID();
    guestAccessTokenHash = crypto
      .createHash("sha256")
      .update(guestAccessToken)
      .digest("hex");
  }

  // 9. Look up delivery zone
  const { data: zoneRow } = await admin
    .from("delivery_zones")
    .select("id")
    .eq("city_id", cityId)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();

  // 10. Create order + items + recipient + status history in a transaction-like block
  // (Using the admin client so RLS is bypassed for the insert)
  const { data: order, error: orderErr } = await admin.from("orders").insert({
    user_id: user?.id ?? null,
    guest_email: user ? null : data.sender.email,
    guest_access_token_hash: guestAccessTokenHash,
    idempotency_key: data.idempotencyKey,
    status: "pending_payment",
    origin_country_code: null,
    destination_country_code: priced.destinationCountryCode,
    destination_city_id: cityId,
    delivery_zone_id: zoneRow?.id ?? null,
    delivery_date: data.deliveryDate,
    delivery_timezone: destination.city.timezone,
    sender_name: data.sender.name,
    sender_email: data.sender.email,
    sender_phone: data.sender.phone || null,
    gift_message: data.giftMessage,
    subtotal_minor: priced.subtotalMinor,
    delivery_fee_minor: deliveryFeeMinor,
    total_minor: priced.totalMinor,
    currency: priced.currency,
    contains_physical: priced.containsPhysical,
    contains_digital: priced.containsDigital,
  }).select("id, order_number").single();

  if (orderErr || !order) {
    return { ok: false, error: `Failed to create order: ${orderErr?.message ?? "unknown"}` };
  }

  // Insert recipient
  await admin.from("order_recipients").insert({
    order_id: order.id,
    name: data.recipient.name,
    phone: data.recipient.phone,
    email: data.recipient.email || null,
    address_line1: data.recipient.addressLine1 || null,
    address_line2: data.recipient.addressLine2 || null,
    landmark: data.recipient.landmark || null,
    city_id: cityId,
    notes: data.recipient.notes || null,
  });

  // Insert order items
  const itemInserts = priced.lines.map((line) => ({
    order_id: order.id,
    product_id: line.productId,
    variant_id: line.variantId,
    denomination_id: line.denominationId,
    product_type: line.productType,
    quantity: line.quantity,
    unit_price_minor: line.unitPriceMinor,
    line_total_minor: line.lineTotalMinor,
    currency: line.currency,
    snapshot: line.snapshot,
    fulfillment_method: line.fulfillmentMethod,
    fulfillment_status: "pending",
    gift_message: line.giftMessage,
  }));

  await admin.from("order_items").insert(itemInserts);

  // Insert initial status history
  await admin.from("order_status_history").insert({
    order_id: order.id,
    from_status: null,
    to_status: "pending_payment",
    actor_id: user?.id ?? null,
    note: "Order placed",
  });

  // 11. Process payment
  const provider = getProvider(data.paymentProvider);
  if (!provider) {
    return { ok: false, error: `Payment provider "${data.paymentProvider}" is not available` };
  }

  const paymentResult = await provider.processPayment({
    orderId: order.id,
    amountMinor: priced.totalMinor,
    currency: priced.currency,
  });

  // If demo payment succeeded, mark order as confirmed
  if (paymentResult.success && paymentResult.status === "paid") {
    await admin.from("orders").update({ status: "confirmed" }).eq("id", order.id);
    await admin.from("order_status_history").insert({
      order_id: order.id,
      from_status: "pending_payment",
      to_status: "confirmed",
      actor_id: user?.id ?? null,
      note: "Payment received (demo)",
    });
  }

  return {
    ok: true,
    orderNumber: order.order_number,
    orderId: order.id,
    accessToken: guestAccessToken,
  };
}
