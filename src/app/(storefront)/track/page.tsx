import { connection } from "next/server";
/**
 * Public order tracking page.
 *
 * Anyone with an order number can see coarse status. No PII, no prices,
 * no item details — just enough to know whether the order is on track.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/storefront/page-shell";


interface Props {
  searchParams: Promise<{ order?: string }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Awaiting payment", color: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  processing: { label: "Being prepared", color: "bg-indigo-100 text-indigo-800" },
  partially_fulfilled: { label: "Partially on its way", color: "bg-violet-100 text-violet-800" },
  fulfilled: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-700" },
};

export default async function TrackPage({ searchParams }: Props) {
  await connection();
  const { order: orderNumber } = await searchParams;

  let result: {
    order_number: string;
    status: string;
    city_name: string;
    delivery_date: string;
    contains_physical: boolean;
    contains_digital: boolean;
    placed_at: string;
  } | null = null;

  let searched = false;

  if (orderNumber?.trim()) {
    searched = true;
    const supabase = createAdminClient();

    const { data: row } = await supabase
      .from("orders")
      .select("order_number, status, destination_city_id, delivery_date, contains_physical, contains_digital, placed_at")
      .eq("order_number", orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (row) {
      const { data: city } = await supabase
        .from("cities")
        .select("name")
        .eq("id", row.destination_city_id)
        .maybeSingle();

      result = {
        order_number: row.order_number,
        status: row.status,
        city_name: city?.name ?? "—",
        delivery_date: row.delivery_date,
        contains_physical: row.contains_physical,
        contains_digital: row.contains_digital,
        placed_at: row.placed_at,
      };
    }
  }

  const statusInfo = result ? STATUS_LABELS[result.status] ?? { label: result.status, color: "bg-gray-100 text-gray-700" } : null;

  return (
    <PageShell title="Track your order" intro="Enter your order number to check its status.">
      <div className="mx-auto max-w-lg space-y-8">
        {/* Search form */}
        <form action="/track" className="flex gap-3">
          <input
            type="text"
            name="order"
            defaultValue={orderNumber ?? ""}
            placeholder="e.g. EV-2026-00001"
            required
            className="flex-1 rounded-card border border-sand bg-white px-4 py-3 text-sm focus:border-ink/30 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-card bg-ink px-5 py-3 text-sm font-medium text-white hover:bg-ink/90 transition-colors"
          >
            Track
          </button>
        </form>

        {/* Results */}
        {searched && !result && (
          <div className="rounded-card border border-sand bg-white p-6 text-center">
            <p className="text-ink/60">
              No order found for <strong className="text-ink">{orderNumber}</strong>.
            </p>
            <p className="mt-2 text-sm text-ink/50">
              Check the order number and try again. It&apos;s printed on your confirmation email.
            </p>
          </div>
        )}

        {result && statusInfo && (
          <div className="rounded-card border border-sand bg-white p-6 space-y-5">
            {/* Order number + status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">Order</p>
                <p className="font-display text-xl font-semibold">{result.order_number}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Details */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-t border-sand pt-4">
              <dt className="text-ink/60">Destination</dt>
              <dd>{result.city_name}</dd>

              <dt className="text-ink/60">Delivery date</dt>
              <dd>
                {new Date(result.delivery_date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>

              <dt className="text-ink/60">Contains</dt>
              <dd>
                {[
                  result.contains_physical && "Physical gifts",
                  result.contains_digital && "Gift cards",
                ]
                  .filter(Boolean)
                  .join(" + ") || "—"}
              </dd>

              <dt className="text-ink/60">Placed</dt>
              <dd>
                {new Date(result.placed_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </dl>

            <p className="text-xs text-ink/40 border-t border-sand pt-4">
              For detailed order information, sign in to your account or use the link in your confirmation email.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
