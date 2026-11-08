"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signInWithPassword, signInWithOtp } from "./actions";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "password"
          ? await signInWithPassword(formData)
          : await signInWithOtp(formData);
      if (result?.error) {
        setError(result.error);
      } else if (mode === "magic") {
        setMagicSent(true);
      }
      // password success → server redirects, no client handling needed
    });
  }

  if (magicSent) {
    return (
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Check your email</h1>
        <p className="mt-3 text-sm text-ink/70">
          We sent a sign-in link to your email. Click it to continue.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink/60">
        Welcome back to Giftivana.
      </p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

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

        {mode === "password" && (
          <label className="block">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink/50 focus:outline-none focus:ring-1 focus:ring-ink/20"
              placeholder="••••••••"
            />
          </label>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-ink/90 disabled:opacity-50"
        >
          {isPending
            ? "Signing in…"
            : mode === "password"
              ? "Sign in"
              : "Send magic link"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => { setMode(mode === "password" ? "magic" : "password"); setError(null); }}
        className="mt-4 block w-full text-center text-sm text-ink/60 hover:text-ink"
      >
        {mode === "password" ? "Use a magic link instead" : "Use password instead"}
      </button>

      <p className="mt-6 text-center text-sm text-ink/60">
        Don&apos;t have an account?{" "}
        <Link href={`/sign-up?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-ink underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
