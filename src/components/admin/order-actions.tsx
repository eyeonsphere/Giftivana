"use client";

import { useState, useTransition } from "react";
import { markPaymentReceived, updateOrderStatus, cancelOrder } from "@/app/(admin)/admin/orders/[id]/actions";

const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  confirmed: [
    { value: "processing", label: "Processing" },
  ],
  processing: [
    { value: "fulfilled", label: "Fulfilled" },
    { value: "partially_fulfilled", label: "Partially fulfilled" },
  ],
  partially_fulfilled: [
    { value: "fulfilled", label: "Fulfilled" },
  ],
};

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState("");

  const nextStatuses = NEXT_STATUSES[status] ?? [];
  const canMarkPaid = status === "pending_payment";
  const canCancel = !["cancelled", "refunded", "fulfilled"].includes(status);

  function handleAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      setMessage({
        ok: result.ok,
        text: result.ok ? "Done" : result.error ?? "Failed",
      });
      setNote("");
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {canMarkPaid && (
          <button
            disabled={isPending}
            onClick={() => handleAction(() => markPaymentReceived(orderId, note || undefined))}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Mark payment received
          </button>
        )}

        {nextStatuses.map((s) => (
          <button
            key={s.value}
            disabled={isPending}
            onClick={() => handleAction(() => updateOrderStatus(orderId, s.value, note || undefined))}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Move to {s.label}
          </button>
        ))}

        {canCancel && (
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm("Cancel this order? This cannot be undone.")) {
                handleAction(() => cancelOrder(orderId, note || "Cancelled by staff"));
              }
            }}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel order
          </button>
        )}

        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="ml-auto rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {message && (
        <p className={`mt-2 text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
