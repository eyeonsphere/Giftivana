import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

/** Simple stat card. */
function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:ring-2 hover:ring-gray-300 rounded-xl transition">
      {inner}
    </Link>
  ) : (
    inner
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  processing: "Processing",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  partially_fulfilled: "bg-purple-100 text-purple-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-red-100 text-red-800",
};

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // Fetch stats in parallel
  const [
    ordersRes,
    pendingRes,
    confirmedRes,
    processingRes,
    fulfilledRes,
    productsRes,
    revenueRes,
    recentRes,
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "fulfilled"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("orders")
      .select("total_minor, currency")
      .in("status", ["confirmed", "processing", "partially_fulfilled", "fulfilled"]),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, sender_name, total_minor, currency, placed_at",
      )
      .order("placed_at", { ascending: false })
      .limit(10),
  ]);

  const totalOrders = ordersRes.count ?? 0;
  const pendingCount = pendingRes.count ?? 0;
  const confirmedCount = confirmedRes.count ?? 0;
  const processingCount = processingRes.count ?? 0;
  const fulfilledCount = fulfilledRes.count ?? 0;
  const activeProducts = productsRes.count ?? 0;

  // Sum revenue (assumes single currency for now)
  const revenueRows = (revenueRes.data ?? []) as {
    total_minor: number;
    currency: string;
  }[];
  const totalRevenue = revenueRows.reduce((s, r) => s + r.total_minor, 0);
  const revenueCurrency = revenueRows[0]?.currency ?? "USD";
  const revenueDisplay =
    totalRevenue > 0
      ? `$${(totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : "$0.00";

  const recentOrders = (recentRes.data ?? []) as {
    id: string;
    order_number: string;
    status: string;
    sender_name: string;
    total_minor: number;
    currency: string;
    placed_at: string;
  }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Total orders" value={totalOrders} href="/admin/orders" />
        <Stat label="Pending payment" value={pendingCount} href="/admin/orders?status=pending_payment" />
        <Stat label="Confirmed" value={confirmedCount} href="/admin/orders?status=confirmed" />
        <Stat label="Fulfilled" value={fulfilledCount} href="/admin/orders?status=fulfilled" />
        <Stat label="Processing" value={processingCount} href="/admin/orders?status=processing" />
        <Stat label="Active products" value={activeProducts} href="/admin/products" />
        <Stat label="Revenue" value={revenueDisplay} />
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Sender</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.sender_name}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-900 tabular-nums">
                      ${(order.total_minor / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(order.placed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
