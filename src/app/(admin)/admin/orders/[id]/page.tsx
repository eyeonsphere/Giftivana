import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/helpers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderActions } from "@/components/admin/order-actions";
import { SupportNotes } from "@/components/admin/support-notes";

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    partially_fulfilled: "bg-purple-100 text-purple-800",
    fulfilled: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
    refunded: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function itemFulfillmentBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    issued: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const admin = createAdminClient();

  // Fetch order with city
  const { data: order } = await admin
    .from("orders")
    .select("*, cities!destination_city_id(name)")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  // Fetch related data in parallel
  const [itemsRes, recipientRes, historyRes, notesRes, paymentsRes] = await Promise.all([
    admin.from("order_items").select("*").eq("order_id", id).order("created_at"),
    admin.from("order_recipients").select("*").eq("order_id", id).maybeSingle(),
    admin.from("order_status_history").select("*, profiles:actor_id(full_name)").eq("order_id", id).order("created_at", { ascending: false }),
    admin.from("order_support_notes").select("*, profiles:author_id(full_name)").eq("order_id", id).order("created_at", { ascending: false }),
    admin.from("payments").select("*").eq("order_id", id).order("created_at"),
  ]);

  const items = itemsRes.data ?? [];
  const recipient = recipientRes.data;
  const history = historyRes.data ?? [];
  const notes = notesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const city = order.cities as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-700">&larr; Orders</Link>
          <h1 className="mt-1 text-2xl font-bold">{order.order_number}</h1>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge(order.status)}
        </div>
      </div>

      {/* Actions */}
      <OrderActions orderId={id} status={order.status} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order info */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-900">Order details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Destination</dt>
              <dd>{(city?.name as string) ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Delivery date</dt>
              <dd>{new Date(order.delivery_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Placed</dt>
              <dd>{new Date(order.placed_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
            </div>
            {order.gift_message && (
              <div className="border-t pt-2 mt-2">
                <dt className="text-gray-500 mb-1">Gift message</dt>
                <dd className="italic text-gray-700">&ldquo;{order.gift_message}&rdquo;</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Sender + Recipient */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-900">People</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-xs font-medium uppercase text-gray-400 mb-1">Sender</h3>
              <p>{order.sender_name}</p>
              <p className="text-gray-500">{order.sender_email}</p>
              {order.sender_phone && <p className="text-gray-500">{order.sender_phone}</p>}
            </div>
            {recipient && (
              <div className="border-t pt-3">
                <h3 className="text-xs font-medium uppercase text-gray-400 mb-1">Recipient</h3>
                <p>{recipient.name}</p>
                <p className="text-gray-500">{recipient.phone}</p>
                {recipient.email && <p className="text-gray-500">{recipient.email}</p>}
                {recipient.address_line1 && <p className="text-gray-500">{recipient.address_line1}</p>}
                {recipient.address_line2 && <p className="text-gray-500">{recipient.address_line2}</p>}
                {recipient.landmark && <p className="text-gray-500">Landmark: {recipient.landmark}</p>}
                {recipient.notes && <p className="text-gray-500 italic">Notes: {recipient.notes}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Items</h2>
        <table className="w-full text-sm">
          <thead className="border-b text-xs uppercase text-gray-400">
            <tr>
              <th className="pb-2 text-left">Product</th>
              <th className="pb-2 text-left">Type</th>
              <th className="pb-2 text-center">Qty</th>
              <th className="pb-2 text-right">Unit</th>
              <th className="pb-2 text-right">Line total</th>
              <th className="pb-2 text-left">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item: Record<string, unknown>) => {
              const snap = item.snapshot as Record<string, unknown>;
              return (
                <tr key={item.id as string}>
                  <td className="py-2.5">
                    <p className="font-medium">{snap.name as string}</p>
                    {snap.variantName ? <p className="text-xs text-gray-500">{snap.variantName as string}</p> : null}
                    {snap.faceValueMinor != null && (
                      <p className="text-xs text-gray-500">Face: {((snap.faceValueMinor as number) / (snap.faceCurrency === "USD" ? 100 : 1)).toLocaleString()} {snap.faceCurrency as string}</p>
                    )}
                    {(item.gift_message as string) && (
                      <p className="text-xs text-gray-400 italic mt-0.5">&ldquo;{item.gift_message as string}&rdquo;</p>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs ${item.product_type === "gift_card" ? "text-purple-600" : "text-gray-500"}`}>
                      {(item.product_type as string).replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 text-center">{item.quantity as number}</td>
                  <td className="py-2.5 text-right font-mono text-gray-600">
                    {((item.unit_price_minor as number) / 100).toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    {((item.line_total_minor as number) / 100).toFixed(2)} {item.currency as string}
                  </td>
                  <td className="py-2.5">
                    {itemFulfillmentBadge(item.fulfillment_status as string)}
                    {item.product_type === "gift_card" && item.fulfillment_status === "pending" && (
                      <Link href={`/admin/gift-cards/${item.id}`} className="ml-2 text-xs text-blue-600 hover:underline">
                        Issue
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 border-t pt-3 space-y-1 text-sm text-right">
          <p className="text-gray-500">Subtotal: <span className="font-mono">{(order.subtotal_minor / 100).toFixed(2)} {order.currency}</span></p>
          {order.delivery_fee_minor > 0 && (
            <p className="text-gray-500">Delivery: <span className="font-mono">{(order.delivery_fee_minor / 100).toFixed(2)} {order.currency}</span></p>
          )}
          <p className="font-semibold text-gray-900">Total: <span className="font-mono">{(order.total_minor / 100).toFixed(2)} {order.currency}</span></p>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Payments</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">No payments recorded.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase text-gray-400">
              <tr>
                <th className="pb-2 text-left">Provider</th>
                <th className="pb-2 text-left">Mode</th>
                <th className="pb-2 text-left">Status</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-left">Reference</th>
                <th className="pb-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p: Record<string, unknown>) => (
                <tr key={p.id as string}>
                  <td className="py-2">{p.provider as string}</td>
                  <td className="py-2 text-gray-500">{p.mode as string}</td>
                  <td className="py-2">{statusBadge(p.status as string)}</td>
                  <td className="py-2 text-right font-mono">{((p.amount_minor as number) / 100).toFixed(2)} {p.currency as string}</td>
                  <td className="py-2 text-gray-500 text-xs">{(p.provider_reference as string) ?? "—"}</td>
                  <td className="py-2 text-gray-500 text-xs">{new Date(p.created_at as string).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status history */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Status history</h2>
        <ol className="space-y-3">
          {history.map((h: Record<string, unknown>) => {
            const profile = h.profiles as Record<string, unknown> | null;
            return (
              <li key={h.id as string} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                <div>
                  <p>
                    {h.from_status ? <>{statusBadge(h.from_status as string)} &rarr; </> : null}
                    {statusBadge(h.to_status as string)}
                    {profile?.full_name ? <span className="ml-2 text-gray-400">by {profile.full_name as string}</span> : null}
                  </p>
                  {h.note ? <p className="text-gray-500 mt-0.5">{h.note as string}</p> : null}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.created_at as string).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Support notes */}
      <SupportNotes orderId={id} notes={notes} />
    </div>
  );
}
