/**
 * Order confirmation / detail page.
 *
 * Accessible by:
 * - Logged-in user who owns the order
 * - Guest with the correct access token (?t=<token>)
 * - Staff/admin (any order)
 */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrencies } from "@/lib/catalog/queries";
import { formatMoney } from "@/lib/money";
import { notFound } from "next/navigation";
import type { Money } from "@/types/domain";
import { PageShell } from "@/components/storefront/page-shell";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t: token } = await searchParams;

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the order
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  // Check access: owner, guest token, or staff
  let hasAccess = false;
  if (user) {
    if (order.user_id === user.id) hasAccess = true;
    // Check staff
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "staff" || profile?.role === "admin") hasAccess = true;
  }
  if (!hasAccess && token && order.guest_access_token_hash) {
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    if (hash === order.guest_access_token_hash) hasAccess = true;
  }

  if (!hasAccess) notFound();

  // Fetch order items
  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at");

  // Fetch recipient
  const { data: recipient } = await admin
    .from("order_recipients")
    .select("*")
    .eq("order_id", order.id)
    .maybeSingle();

  // Fetch city name
  const { data: city } = await admin
    .from("cities")
    .select("name")
    .eq("id", order.destination_city_id)
    .maybeSingle();

  const currencies = await getCurrencies();
  const fmt = (m: Money) => formatMoney(m, currencies);

  const isConfirmed = order.status === "confirmed" || order.status === "processing" || order.status === "fulfilled";
  const isPending = order.status === "pending_payment";

  return (
    <PageShell
      title="Order confirmation"
      intro={isConfirmed ? "Your order is confirmed." : isPending ? "Your order is placed — payment pending." : `Order status: ${order.status}`}
    >
      <div className="max-w-2xl space-y-8">
        {/* Order header */}
        <div className="rounded-card border border-sand bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Order number</p>
              <p className="font-display text-xl font-semibold">{order.order_number}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-sm font-medium ${
              isConfirmed ? "bg-green-100 text-green-800" :
              isPending ? "bg-amber-100 text-amber-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {isConfirmed ? "Confirmed" : isPending ? "Payment pending" : order.status}
            </div>
          </div>

          {isPending && (
            <p className="mt-4 text-sm text-ink/70">
              We&apos;ve received your order. Once payment is confirmed, we&apos;ll start preparing your gift for delivery.
            </p>
          )}
        </div>

        {/* Delivery details */}
        <div className="rounded-card border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Delivery details</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-ink/60">Destination</dt>
            <dd>{city?.name ?? "—"}</dd>
            <dt className="text-ink/60">Delivery date</dt>
            <dd>{new Date(order.delivery_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</dd>
            {recipient && (
              <>
                <dt className="text-ink/60">Recipient</dt>
                <dd>{recipient.name}</dd>
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
            {(items ?? []).map((item: Record<string, unknown>) => {
              const snap = item.snapshot as Record<string, unknown>;
              return (
                <li key={item.id as string} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{snap.name as string}</p>
                    {snap.variantName ? <p className="text-ink/60">{snap.variantName as string}</p> : null}
                    {snap.faceValueMinor != null && (
                      <p className="text-ink/60">
                        Face value: {fmt({ amountMinor: snap.faceValueMinor as number, currency: snap.faceCurrency as string })}
                      </p>
                    )}
                    <p className="text-ink/60">Qty: {item.quantity as number}</p>
                    {(item.gift_message as string) && (
                      <p className="text-ink/50 italic mt-1">&ldquo;{item.gift_message as string}&rdquo;</p>
                    )}
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    {fmt({ amountMinor: item.line_total_minor as number, currency: item.currency as string })}
                  </p>
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

        {/* Sender info */}
        <div className="rounded-card border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Sender</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-ink/60">Name</dt>
            <dd>{order.sender_name}</dd>
            <dt className="text-ink/60">Email</dt>
            <dd>{order.sender_email}</dd>
          </dl>
        </div>

        <p className="text-center text-sm text-ink/50">
          Save this page — you can return to it anytime to check your order status.
        </p>
      </div>
    </PageShell>
  );
}
