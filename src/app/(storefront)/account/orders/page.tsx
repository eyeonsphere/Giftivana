import Link from "next/link";
import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { getCurrencies } from "@/lib/catalog/queries";
import { formatMoney } from "@/lib/money";
import type { Money } from "@/types/domain";

const statusLabel: Record<string, { text: string; className: string }> = {
  pending_payment: { text: "Payment pending", className: "bg-amber-100 text-amber-800" },
  confirmed: { text: "Confirmed", className: "bg-green-100 text-green-800" },
  processing: { text: "Processing", className: "bg-blue-100 text-blue-800" },
  partially_fulfilled: { text: "Partially fulfilled", className: "bg-blue-100 text-blue-800" },
  fulfilled: { text: "Fulfilled", className: "bg-green-100 text-green-800" },
  cancelled: { text: "Cancelled", className: "bg-gray-100 text-gray-600" },
  refunded: { text: "Refunded", className: "bg-gray-100 text-gray-600" },
};

export default async function OrderHistoryPage() {
  const { user: user } = await requireUser();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, placed_at, total_minor, currency, destination_city_id, cities!destination_city_id(name)")
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false });

  const currencies = await getCurrencies();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Orders</h1>

      {!orders?.length ? (
        <div className="rounded-card border border-sand bg-white p-8 text-center">
          <p className="text-ink/60">You haven&apos;t placed any orders yet.</p>
          <Link href="/gifts" className="mt-4 inline-block text-sm font-medium underline underline-offset-2">
            Browse gifts
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order: Record<string, unknown>) => {
            const city = order.cities as Record<string, unknown> | null;
            const st = statusLabel[(order.status as string)] ?? {
              text: order.status as string,
              className: "bg-gray-100 text-gray-800",
            };
            const total: Money = {
              amountMinor: order.total_minor as number,
              currency: order.currency as string,
            };

            return (
              <li key={order.id as string}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="block rounded-card border border-sand bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display font-semibold">
                        {order.order_number as string}
                      </p>
                      <p className="text-sm text-ink/60 mt-0.5">
                        {new Date(order.placed_at as string).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {city ? ` · ${city.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                        {st.text}
                      </span>
                      <span className="font-medium text-sm">
                        {formatMoney(total, currencies)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
