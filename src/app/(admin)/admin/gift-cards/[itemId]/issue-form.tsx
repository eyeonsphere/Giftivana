"use client";

import { useState, useTransition } from "react";
import { issueGiftCard } from "../actions";

interface Props {
  itemId: string;
  alreadyIssued: boolean;
}

export function IssueGiftCardForm({ itemId, alreadyIssued }: Props) {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<{ ok: boolean; serialLast4?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await issueGiftCard(itemId, code, pin || undefined, source || undefined);
      setResult(res);
      if (res.ok) {
        setCode("");
        setPin("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Gift card code <span className="text-red-500">*</span>
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          minLength={4}
          placeholder="Enter the code from the partner"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter the real code obtained from the partner. It will be encrypted before storage.
        </p>
      </div>

      <div>
        <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
          PIN (optional)
        </label>
        <input
          id="pin"
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="If the card has a separate PIN"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700">
          Source (optional)
        </label>
        <input
          id="source"
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder='e.g. "partner batch 2026-11"'
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {result?.ok && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">
            Gift card issued successfully. Code ending in{" "}
            <span className="font-mono font-bold">{result.serialLast4}</span>.
          </p>
        </div>
      )}

      {result?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !code.trim()}
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Issuing..."
          : alreadyIssued
            ? "Re-issue code"
            : "Issue code"}
      </button>
    </form>
  );
}
