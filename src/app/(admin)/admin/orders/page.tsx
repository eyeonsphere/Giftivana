import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/helpers";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const;

const PAGE_SIZE = 25;

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

interface Props {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireStaff();
  const params = await searchParams;
  const admin = createAdminClient();

  const statusFilter = params.status ?? "";
  const search = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("orders")
    .select("id, order_number, sender_name, destination_city_id, delivery_date, status, total_minor, currency, placed_at, cities!destination_city_id(name)", { count: "exact" })
    .order("placed_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (search) query = query.ilike("order_number", `%${search}%`);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">{count ?? 0} total</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex gap-2" action="/admin/orders" method="GET">
          <input
            type="text"
            name="q"
            placeholder="Search order number..."
            defaultValue={search}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <button type="submit" className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <Link
              key={s.value}
              href={`/admin/orders${s.value ? `?status=${s.value}` : ""}${search ? `${s.value ? "&" : "?"}q=${search}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === s.value
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
            {(orders ?? []).map((order: Record<string, unknown>) => {
              const city = order.cities as Record<string, unknown> | null;
              return (
                <tr key={order.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                      {order.order_number as string}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.sender_name as string}</td>
                  <td className="px-4 py-3 text-gray-700">{(city?.name as string) ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date((order.delivery_date as string) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">{statusBadge(order.status as string)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">
                    {((order.total_minor as number) / 100).toFixed(2)} {order.currency as string}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(order.placed_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/orders?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&q=${search}` : ""}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/orders?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&q=${search}` : ""}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
