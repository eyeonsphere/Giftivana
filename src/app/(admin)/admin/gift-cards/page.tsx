import { requireAdmin } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { connection } from "next/server";


const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  issued: "bg-green-100 text-green-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default async function GiftCardsPage() {
  await connection();
  await requireAdmin();
  const supabase = createAdminClient();

  // Pending fulfillment items
  const { data: pendingItems } = await supabase
    .from("order_items")
    .select(`
      id, order_id, quantity, fulfillment_status, fulfillment_method, snapshot, created_at,
      orders!inner ( order_number, sender_name, status )
    `)
    .eq("product_type", "gift_card")
    .eq("fulfillment_status", "pending")
    .order("created_at", { ascending: true });

  // Recently issued items
  const { data: issuedItems } = await supabase
    .from("order_items")
    .select(`
      id, order_id, quantity, fulfillment_status, fulfillment_method, snapshot, created_at,
      orders!inner ( order_number, sender_name, status )
    `)
    .eq("product_type", "gift_card")
    .eq("fulfillment_status", "issued")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gift card fulfillment</h1>
        <p className="mt-1 text-sm text-gray-500">Issue codes for gift card orders.</p>
      </div>

      {/* Pending queue */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending ({pendingItems?.length ?? 0})
        </h2>
        {!pendingItems?.length ? (
          <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
            No gift cards waiting for fulfillment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Face value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingItems.map((item: Record<string, unknown>) => {
                  const snap = item.snapshot as Record<string, unknown>;
                  const order = item.orders as Record<string, unknown>;
                  return (
                    <tr key={item.id as string} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {order.order_number as string}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {(snap.name as string) ?? "Gift card"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {snap.faceValueMinor != null
                          ? `${((snap.faceValueMinor as number) / 1).toLocaleString()} ${snap.faceCurrency as string}`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {(item.fulfillment_method as string)?.replace("_", " ") ?? "manual"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {item.quantity as number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[item.fulfillment_status as string] ?? "bg-gray-100 text-gray-800"}`}>
                          {item.fulfillment_status as string}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Link
                          href={`/admin/gift-cards/${item.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Issue code
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recently issued */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently issued</h2>
        {!issuedItems?.length ? (
          <p className="text-sm text-gray-500">No gift cards issued yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issuedItems.map((item: Record<string, unknown>) => {
                  const snap = item.snapshot as Record<string, unknown>;
                  const order = item.orders as Record<string, unknown>;
                  return (
                    <tr key={item.id as string}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {order.order_number as string}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {(snap.name as string) ?? "Gift card"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {(item.fulfillment_method as string)?.replace("_", " ") ?? "manual"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          issued
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(item.created_at as string).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
