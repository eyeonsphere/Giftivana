"use server";

import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";

const GIFT_CARD_KEY =
  process.env.GIFT_CARD_ENCRYPTION_KEY ?? "demo-key-not-for-production";

export interface RevealResult {
  code?: string;
  pin?: string;
  serial_last4?: string;
  issued_at?: string;
  error?: string;
}

export async function revealGiftCard(
  orderItemId: string,
): Promise<RevealResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reveal_gift_card", {
    p_order_item_id: orderItemId,
    p_key: GIFT_CARD_KEY,
    p_token: null,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { error: "No gift card data found for this item." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    code: row.code ?? undefined,
    pin: row.pin ?? undefined,
    serial_last4: row.serial_last4 ?? undefined,
    issued_at: row.issued_at ?? undefined,
  };
}
