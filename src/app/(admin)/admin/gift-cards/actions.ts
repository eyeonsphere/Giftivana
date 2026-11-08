"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const ENCRYPTION_KEY =
  process.env.GIFT_CARD_ENCRYPTION_KEY ?? "demo-key-not-for-production";

export interface IssueResult {
  ok: boolean;
  serialLast4?: string;
  error?: string;
}

export async function issueGiftCard(
  itemId: string,
  code: string,
  pin?: string,
  source?: string,
): Promise<IssueResult> {
  await requireAdmin();

  if (!code || code.trim().length < 4) {
    return { ok: false, error: "Code must be at least 4 characters." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("issue_gift_card", {
    p_order_item_id: itemId,
    p_code: code.trim(),
    p_pin: pin?.trim() || null,
    p_source: source?.trim() || "manual",
    p_key: ENCRYPTION_KEY,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/gift-cards");
  revalidatePath(`/admin/gift-cards/${itemId}`);

  return { ok: true, serialLast4: code.trim().slice(-4) };
}
