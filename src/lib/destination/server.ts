import "server-only";
import { cookies } from "next/headers";
import { getDestinationBySlug } from "@/lib/catalog/queries";
import type { Destination } from "@/types/domain";

export const DESTINATION_COOKIE = "ev_destination";

/**
 * Read the shopper's chosen destination from the cookie.
 * Reading cookies is a runtime API, so any component calling this must sit
 * inside a <Suspense> boundary (Next 16 Cache Components rule).
 */
export async function getCurrentDestination(): Promise<Destination | null> {
  const store = await cookies();
  const slug = store.get(DESTINATION_COOKIE)?.value;
  return getDestinationBySlug(slug);
}
