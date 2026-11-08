"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signUp } from "./actions";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Check your email</h1>
        <p className="mt-3 text-sm text-ink/70">
          We sent a confirmation link to your email. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-xl font-semibold text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-ink/60">
        Join Giftivana to send gifts to the people you love.
      </p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <label className="block">
          <span className="text-sm font-medium text-ink">Full name</span>
          <input
            type="text"
            name="fullName"
            required
            autoComplete="name"
            className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink/50 focus:outline-none focus:ring-1 focus:ring-ink/20"
            placeholder="Your name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink/50 focus:outline-none focus:ring-1 focus:ring-ink/20"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink/50 focus:outline-none focus:ring-1 focus:ring-ink/20"
            placeholder="At least 8 characters"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-ink/90 disabled:opacity-50"
        >
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href={`/sign-in?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-ink underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
