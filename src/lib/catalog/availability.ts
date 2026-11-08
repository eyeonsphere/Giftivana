import type { ProductAvailability } from "@/types/domain";

/**
 * Pure availability rules. No I/O, so these are easy to test and can be reused
 * server-side at checkout (Stage 4) to re-check eligibility.
 */

/** A product is purchasable for a city only with an explicit `isAvailable: true` row. */
export function isAvailableIn(rows: ProductAvailability[], productId: string, cityId: string): boolean {
  return rows.some((r) => r.productId === productId && r.cityId === cityId && r.isAvailable);
}

export function cityIdsFor(rows: ProductAvailability[], productId: string): string[] {
  return rows.filter((r) => r.productId === productId && r.isAvailable).map((r) => r.cityId);
}

export function leadTimeFor(rows: ProductAvailability[], productId: string, cityId: string): number | undefined {
  return rows.find((r) => r.productId === productId && r.cityId === cityId && r.isAvailable)?.leadTimeDays;
}
