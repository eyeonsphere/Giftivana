"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safePath(p: string | undefined): string {
  if (!p || !p.startsWith("/") || p.startsWith("//")) return "/";
  return p;
}

export async function signInWithPassword(
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = safePath(formData.get("redirectTo") as string);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signInWithOtp(
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const email = (formData.get("email") as string)?.trim();
  const redirectTo = safePath(formData.get("redirectTo") as string);

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback?redirect=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success — the calling component shows "check your email"
  return undefined;
}
