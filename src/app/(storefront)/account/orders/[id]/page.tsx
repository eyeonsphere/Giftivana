import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { getCurrencies } from "@/lib/catalog/queries";
import { formatMoney } from "@/lib/money";
import { notFound } from "next/navigation";
import type { Money } from "@/types/domain";
import Link from "next/link";
import { GiftCardRevealButton } from "@/components/account/gift-card-reveal";

const statusLabel: Record<string, { text: string; className: string }> = {
  pending_payment: { text: "Payment pending", className: "bg-amber-100 text-amber-800" },
  confirmed: { text: "Confirmed", className: "bg-green-100 text-green-800" },
  processing: { text: "Processing", className: "bg-blue-100 text-blue-800" },
  partially_fulfilled: { text: "Partially fulfilled", className: "bg-blue-100 text-blue-800" },
  fulfilled: { text: "Fulfilled", className: "bg-green-100 text-green-800" },
  cancelled: { text: "Cancelled", className: "bg-gray-100 text-gray-600" },
  refunded: { text: "Refunded", className: "bg-gray-100 text-gray-600" },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const { user: user } = await requireUser();
  const supabase = await createClient();

  // Fetch order (RLS ensures user can only see their own)
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  // Fetch related data in parallel
  const [itemsRes, recipientRes, historyRes, cityRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
    supabase.from("order_recipients").select("*").eq("order_id", id).maybeSingle(),
    supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
    supabase.from("cities").select("name").eq("id", order.destination_city_id).maybeSingle(),
  ]);

  const items = itemsRes.data ?? [];
  const recipient = recipientRes.data;
  const history = historyRes.data ?? [];
  const currencies = await getCurrencies();
  const fmt = (m: Money) => formatMoney(m, currencies);
  const st = statusLabel[order.status] ?? { text: order.status, className: "bg-gray-100 text-gray-800" };

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-ink/60 hover:text-ink mb-4 inline-block">
        &larr; Back to orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">{order.order_number}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.className}`}>
          {st.text}
        </span>
      </div>

      <div className="space-y-6">
        {/* Delivery details */}
        <div className="rounded-card border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Delivery</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-ink/60">Destination</dt>
            <dd>{cityRes.data?.name ?? "---"}</dd>
            <dt className="text-ink/60">Delivery date</dt>
            <dd>
              {new Date(order.delivery_date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
            {recipient && (
              <>
                <dt className="text-ink/60">Recipient</dt>
                <dd>{recipient.name}</dd>
                <dt className="text-ink/60">Phone</dt>
                <dd>{recipient.phone}</dd>
              </>
            )}
          </dl>
          {order.gift_message && (
            <div className="mt-4 border-t border-sand pt-4">
              <p className="text-sm text-ink/60 mb-1">Gift message</p>
              <p className="text-sm italic">&ldquo;{order.gift_message}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-card border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Items</h2>
          <ul className="divide-y divide-sand">
            {items.map((item: Record<string, unknown>) => {
              const snap = item.snapshot as Record<string, unknown>;
              const isGiftCard = item.product_type === "gift_card";
              const isFulfilled = item.fulfillment_status === "issued";

              return (
                <li key={item.id as string} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{snap.name as string}</p>
                      {snap.variantName ? (
                        <p className="text-sm text-ink/60">{snap.variantName as string}</p>
                      ) : null}
                      {snap.faceValueMinor != null && (
                        <p className="text-sm text-ink/60">
                          Face value: {fmt({ amountMinor: snap.faceValueMinor as number, currency: snap.faceCurrency as string })}
                        </p>
                      )}
                      <p className="text-sm text-ink/60">Qty: {item.quantity as number}</p>
                      {(item.gift_message as string) && (
                        <p className="text-sm text-ink/50 italic mt-1">&ldquo;{item.gift_message as string}&rdquo;</p>
                      )}
                    </div>
                    <p className="font-medium whitespace-nowrap shrink-0">
                      {fmt({ amountMinor: item.line_total_minor as number, currency: item.currency as string })}
                    </p>
                  </div>

                  {/* Gift card reveal button */}
                  {isGiftCard && isFulfilled && (
                    <div className="mt-3">
                      <GiftCardRevealButton orderItemId={item.id as string} />
                    </div>
                  )}
                  {isGiftCard && !isFulfilled && (
                    <p className="mt-2 text-xs text-ink/50">
                      Gift card code will be available here once fulfilled.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Totals */}
          <div className="border-t border-sand mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Subtotal</span>
              <span>{fmt({ amountMinor: order.subtotal_minor, currency: order.currency })}</span>
            </div>
            {order.delivery_fee_minor > 0 && (
              <div className="flex justify-between">
                <span className="text-ink/60">Delivery</span>
                <span>{fmt({ amountMinor: order.delivery_fee_minor, currency: order.currency })}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-semibold text-base pt-2 border-t border-sand">
              <span>Total</span>
              <span>{fmt({ amountMinor: order.total_minor, currency: order.currency })}</span>
            </div>
          </div>
        </div>

        {/* Status history */}
        {history.length > 0 && (
          <div className="rounded-card border border-sand bg-white p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Status history</h2>
            <ol className="relative border-s border-sand ms-3">
              {history.map((h: Record<string, unknown>) => (
                <li key={h.id as string} className="mb-4 ms-6 last:mb-0">
                  <span className="absolute -start-1.5 mt-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-sand bg-white" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {statusLabel[h.to_status as string]?.text ?? (h.to_status as string)}
                    </p>
                    <p className="text-ink/60">
                      {new Date(h.created_at as string).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    {(h.note as string) && (
                      <p className="text-ink/50 mt-0.5">{h.note as string}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
