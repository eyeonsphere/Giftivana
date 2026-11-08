"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDestinationBySlug } from "@/lib/catalog/queries";
import { DESTINATION_COOKIE } from "./server";

const schema = z.object({
  city: z.string().min(1).max(64),
  redirectTo: z.string().max(512).optional(),
});

/** Only allow same-origin relative paths as redirect targets. */
function safePath(p: string | undefined): string {
  if (!p || !p.startsWith("/") || p.startsWith("//")) return "/gifts";
  return p;
}

export async function setDestination(formData: FormData): Promise<void> {
  const parsed = schema.safeParse({
    city: formData.get("city"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });
  if (!parsed.success) return;

  // Validate against the catalog — never store an arbitrary string.
  const destination = await getDestinationBySlug(parsed.data.city);
  if (!destination) return;

  const store = await cookies();
  store.set(DESTINATION_COOKIE, destination.city.slug, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
  });

  redirect(safePath(parsed.data.redirectTo));
}

export async function clearDestination(): Promise<void> {
  const store = await cookies();
  store.delete(DESTINATION_COOKIE);
  redirect("/");
}
