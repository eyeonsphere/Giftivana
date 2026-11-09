"use client";

import { useState, useTransition } from "react";
import { addSupportNote } from "@/app/(admin)/admin/orders/[id]/actions";


export function SupportNotes({ orderId, notes }: { orderId: string; notes: Record<string, unknown>[] }) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      setError(null);
      const result = await addSupportNote(orderId, body);
      if (result.ok) {
        setBody("");
      } else {
        setError(result.error ?? "Failed to add note");
      }
    });
  }

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-gray-900">Support notes</h2>

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">No notes yet.</p>
      ) : (
        <ol className="space-y-3">
          {notes.map((n: Record<string, unknown>) => {
            const profile = n.profiles as Record<string, unknown> | null;
            return (
              <li key={n.id as string} className="border-l-2 border-gray-200 pl-3 text-sm">
                <p className="text-gray-700">{n.body as string}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {profile?.full_name ? `${profile.full_name as string} · ` : ""}
                  {new Date(n.created_at as string).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
