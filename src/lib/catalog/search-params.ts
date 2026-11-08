import { z } from "zod";
import type { SortKey } from "./queries";

/**
 * Parse and sanitise catalog query strings. Everything from the URL is
 * untrusted; unknown values fall back to defaults instead of erroring.
 */

export const sortKeys = ["featured", "price-asc", "price-desc", "name"] as const satisfies readonly SortKey[];

export const priceBands = [
  { id: "under-25", label: "Under $25", min: undefined, max: 2499 },
  { id: "25-50", label: "$25 – $50", min: 2500, max: 5000 },
  { id: "50-100", label: "$50 – $100", min: 5001, max: 10000 },
  { id: "over-100", label: "Over $100", min: 10001, max: undefined },
] as const;

const schema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(64).optional(),
  occasion: z.string().trim().max(64).optional(),
  price: z.enum(priceBands.map((b) => b.id) as [string, ...string[]]).optional(),
  store: z.enum(["supermarket", "department", "grocery", "other"]).optional(),
  sort: z.enum(sortKeys).optional(),
});

export type CatalogFilters = z.infer<typeof schema>;

type Raw = Record<string, string | string[] | undefined>;

export function parseCatalogFilters(raw: Raw): CatalogFilters {
  const single = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const result = schema.safeParse(single);
  return result.success ? result.data : {};
}

export function priceRange(bandId?: string): { minMinor?: number; maxMinor?: number } {
  const band = priceBands.find((b) => b.id === bandId);
  return band ? { minMinor: band.min, maxMinor: band.max } : {};
}

export function hasActiveFilters(f: CatalogFilters): boolean {
  return Boolean(f.q || f.category || f.occasion || f.price || f.store);
}
