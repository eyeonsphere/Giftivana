"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";

export async function markPaymentReceived(orderId: string, note?: string) {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  // Use the database function
  const { error } = await admin.rpc("mark_payment_received", {
    p_order_id: orderId,
    p_note: note ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["processing", "cancelled"],
  processing: ["partially_fulfilled", "fulfilled", "cancelled"],
  partially_fulfilled: ["fulfilled", "cancelled"],
};

export async function updateOrderStatus(orderId: string, newStatus: string, note?: string) {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  // Fetch current status
  const { data: order } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Order not found" };

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return { ok: false, error: `Cannot transition from ${order.status} to ${newStatus}` };
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await admin.from("order_status_history").insert({
    order_id: orderId,
    from_status: order.status,
    to_status: newStatus,
    actor_id: user.id,
    note: note ?? `Status changed to ${newStatus.replace(/_/g, " ")}`,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function cancelOrder(orderId: string, note?: string) {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "cancelled" || order.status === "refunded") {
    return { ok: false, error: "Order is already cancelled or refunded" };
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await admin.from("order_status_history").insert({
    order_id: orderId,
    from_status: order.status,
    to_status: "cancelled",
    actor_id: user.id,
    note: note ?? "Order cancelled by staff",
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function addSupportNote(orderId: string, body: string) {
  const { user } = await requireStaff();
  if (!body.trim()) return { ok: false, error: "Note cannot be empty" };

  const admin = createAdminClient();
  const { error } = await admin.from("order_support_notes").insert({
    order_id: orderId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
