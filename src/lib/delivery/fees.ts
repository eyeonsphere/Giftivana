/**
 * Delivery fee lookup — reads the default delivery zone for a city and
 * returns the applicable fee based on product types in the order.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface DeliveryFeeResult {
  feeMinor: number;
  currency: string;
  zoneId: string;
  zoneName: string;
}

/**
 * Look up the delivery fee for a city based on what the cart contains.
 *
 * Rules:
 * - Find the default delivery zone for the city.
 * - Find delivery_fees rows whose `applies_to` array overlaps with
 *   the product types in the order.
 * - If `containsPhysical` is true, the fee for "physical" applies.
 * - Gift cards alone may have no fee (or a separate fee row).
 * - Returns null if no zone or no matching fee is found (digital-only
 *   orders with no fee configured).
 */
export async function getDeliveryFee(
  cityId: string,
  containsPhysical: boolean,
  containsDigital: boolean,
): Promise<DeliveryFeeResult | null> {
  const supabase = await createClient();

  // 1. Find the default delivery zone for this city.
  const { data: zone, error: zoneErr } = await supabase
    .from("delivery_zones")
    .select("id, name")
    .eq("city_id", cityId)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();

  if (zoneErr) throw zoneErr;
  if (!zone) return null;

  // 2. Fetch all active fee rows for this zone.
  const { data: fees, error: feeErr } = await supabase
    .from("delivery_fees")
    .select("fee_minor, currency, applies_to")
    .eq("zone_id", zone.id)
    .eq("is_active", true);

  if (feeErr) throw feeErr;
  if (!fees || fees.length === 0) return null;

  // 3. Find the matching fee. Prefer the fee that covers physical if
  //    the cart has physical items, since physical delivery is the
  //    more expensive leg.
  const types: string[] = [];
  if (containsPhysical) types.push("physical");
  if (containsDigital) types.push("gift_card");

  // Find the first fee whose applies_to overlaps with the cart's types.
  // If a cart has both physical and digital, the physical fee wins
  // (physical delivery subsumes the digital delivery).
  const matchedFee = containsPhysical
    ? fees.find((f: Record<string, unknown>) =>
        (f.applies_to as string[]).includes("physical"),
      )
    : fees.find((f: Record<string, unknown>) =>
        (f.applies_to as string[]).some((t: string) => types.includes(t)),
      );

  if (!matchedFee) return null;

  return {
    feeMinor: matchedFee.fee_minor as number,
    currency: matchedFee.currency as string,
    zoneId: zone.id as string,
    zoneName: zone.name as string,
  };
}
