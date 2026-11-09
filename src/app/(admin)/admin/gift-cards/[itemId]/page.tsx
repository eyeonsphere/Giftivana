import { requireAdmin } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { IssueGiftCardForm } from "./issue-form";

interface Props {
  params: Promise<{ itemId: string }>;
}

export default async function IssueGiftCardPage({ params }: Props) {
  await requireAdmin();
  const { itemId } = await params;
  const supabase = createAdminClient();

  // Fetch the order item with its order and product details
  const { data: item } = await supabase
    .from("order_items")
    .select(`
      id, order_id, product_id, denomination_id, product_type, quantity,
      fulfillment_status, fulfillment_method, snapshot, gift_message,
      orders ( order_number, sender_name, sender_email, destination_city_id,
               delivery_date, status,
               order_recipients ( name, phone ) ),
      gift_card_fulfillments_secure ( serial_last4, issued_at, source )
    `)
    .eq("id", itemId)
    .eq("product_type", "gift_card")
    .maybeSingle();

  if (!item) notFound();

  const snap = item.snapshot as unknown as Record<string, unknown>;
  const order = item.orders as unknown as Record<string, unknown>;
  const recipients = (order.order_recipients ?? []) as unknown as Record<string, unknown>[];
  const recipient = recipients[0] ?? null;
  const existing = (item.gift_card_fulfillments_secure ?? []) as unknown as Record<string, unknown>[];
  const alreadyIssued = existing.length > 0;

  // Fetch city name
  const { data: city } = await supabase
    .from("cities")
    .select("name")
    .eq("id", order.destination_city_id as string)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Issue gift card</h1>
        <p className="mt-1 text-sm text-gray-500">
          Order {order.order_number as string} &mdash; {(snap.name as string) ?? "Gift card"}
        </p>
      </div>

      {/* Order item details */}
      <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase text-gray-500">Item details</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-gray-500">Product</dt>
          <dd className="font-medium text-gray-900">{(snap.name as string) ?? "—"}</dd>

          {snap.faceValueMinor != null && (
            <>
              <dt className="text-gray-500">Face value</dt>
              <dd className="font-medium text-gray-900">
                {((snap.faceValueMinor as number) / 1).toLocaleString()} {snap.faceCurrency as string}
              </dd>
            </>
          )}

          {snap.chargePriceMinor != null && (
            <>
              <dt className="text-gray-500">Charge price</dt>
              <dd className="text-gray-900">
                {((snap.chargePriceMinor as number) / 100).toFixed(2)} {snap.chargeCurrency as string}
              </dd>
            </>
          )}

          <dt className="text-gray-500">Quantity</dt>
          <dd className="text-gray-900">{item.quantity}</dd>

          <dt className="text-gray-500">Fulfillment method</dt>
          <dd className="text-gray-900">
            {(item.fulfillment_method as string)?.replace("_", " ") ?? "manual"}
          </dd>

          <dt className="text-gray-500">Status</dt>
          <dd>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                item.fulfillment_status === "issued"
                  ? "bg-green-100 text-green-800"
                  : item.fulfillment_status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {item.fulfillment_status}
            </span>
          </dd>

          {snap.partnerName ? (
            <>
              <dt className="text-gray-500">Partner</dt>
              <dd className="text-gray-900">{snap.partnerName as string}</dd>
            </>) : null}
        </dl>
      </div>

      {/* Recipient & delivery */}
      <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase text-gray-500">Delivery</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-gray-500">Sender</dt>
          <dd className="text-gray-900">
            {order.sender_name as string} ({order.sender_email as string})
          </dd>
          {recipient && (
            <>
              <dt className="text-gray-500">Recipient</dt>
              <dd className="text-gray-900">
                {recipient.name as string} ({recipient.phone as string})
              </dd>
            </>
          )}
          <dt className="text-gray-500">Destination</dt>
          <dd className="text-gray-900">{city?.name ?? "—"}</dd>
          <dt className="text-gray-500">Delivery date</dt>
          <dd className="text-gray-900">{order.delivery_date as string}</dd>
        </dl>
      </div>

      {/* Already issued info */}
      {alreadyIssued && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-2">
          <h2 className="text-sm font-semibold text-green-800">Already issued</h2>
          {existing.map((gc, i) => (
            <p key={i} className="text-sm text-green-700">
              Code ending in <span className="font-mono font-bold">{gc.serial_last4 as string}</span>
              {" "}&mdash; issued {new Date(gc.issued_at as string).toLocaleString()}
              {gc.source ? ` (source: ${gc.source})` : ""}
            </p>
          ))}
          <p className="text-xs text-green-600 mt-2">
            You can re-issue to replace the existing code.
          </p>
        </div>
      )}

      {/* Issue form */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-gray-500 mb-4">
          {alreadyIssued ? "Re-issue code" : "Issue code"}
        </h2>
        <IssueGiftCardForm itemId={itemId} alreadyIssued={alreadyIssued} />
      </div>
    </div>
  );
}
