"use client";

import { useState, useTransition } from "react";
import { revealGiftCard, type RevealResult } from "@/app/(storefront)/account/orders/[id]/actions";

export function GiftCardRevealButton({ orderItemId }: { orderItemId: string }) {
  const [result, setResult] = useState<RevealResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReveal() {
    startTransition(async () => {
      const res = await revealGiftCard(orderItemId);
      setResult(res);
    });
  }

  if (result?.code) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-medium text-green-800 mb-2">Gift card code</p>
        <p className="font-mono text-lg font-bold tracking-wider text-green-900">
          {result.code}
        </p>
        {result.pin && (
          <p className="mt-1 text-green-700">
            PIN: <span className="font-mono font-bold">{result.pin}</span>
          </p>
        )}
        {result.issued_at && (
          <p className="mt-2 text-xs text-green-600">
            Issued {new Date(result.issued_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleReveal}
        disabled={pending}
        className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-ivory transition-opacity disabled:opacity-50"
      >
        {pending ? "Revealing..." : "Reveal gift card code"}
      </button>
      {result?.error && (
        <p className="mt-1 text-xs text-red-600">{result.error}</p>
      )}
    </div>
  );
}
