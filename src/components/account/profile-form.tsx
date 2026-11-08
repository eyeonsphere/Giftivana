"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/(storefront)/account/actions";

export function ProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm text-ink/60 mb-1">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName}
          className="w-full rounded-lg border border-sand bg-ivory px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm text-ink/60 mb-1">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          className="w-full rounded-lg border border-sand bg-ivory px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700">Profile updated.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
