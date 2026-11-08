/**
 * Server-only auth helpers.
 *
 * These read the Supabase session from cookies and the user's role from
 * the profiles table. Every protected Server Component, Server Action and
 * Route Handler should call one of the require* functions at the top.
 */
import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type UserRole = "customer" | "staff" | "admin";

export interface AuthSession {
  user: User;
  role: UserRole;
}

/**
 * Return the current Supabase user, or null if not signed in.
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const role = await getUserRole(user.id);
  return { user, role };
}

/**
 * Return the current user or redirect to /sign-in.
 * Pass `redirectTo` to land the user back where they were after sign-in.
 */
export async function requireUser(redirectTo?: string): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    const params = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/sign-in${params}`);
  }
  return session;
}

/**
 * Return the current user if they are staff or admin. Throws a 403-style
 * error if not authorised (caught by error.tsx).
 */
export async function requireStaff(): Promise<AuthSession> {
  const session = await requireUser();
  if (session.role !== "staff" && session.role !== "admin") {
    throw new Error("Forbidden: staff access required");
  }
  return session;
}

/**
 * Return the current user if they are an admin. Throws if not.
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireUser();
  if (session.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return session;
}

/**
 * Read the user's role from the profiles table. Falls back to 'customer'
 * if no profile row exists (e.g. the trigger hasn't fired yet).
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as UserRole) ?? "customer";
}
