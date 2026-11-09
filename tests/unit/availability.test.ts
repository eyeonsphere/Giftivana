import { describe, expect, it } from "vitest";
import { cityIdsFor, isAvailableIn, leadTimeFor } from "@/lib/catalog/availability";

const rows = [
  { productId: "p1", cityId: "damascus", isAvailable: true, leadTimeDays: 2 },
  { productId: "p1", cityId: "baghdad", isAvailable: false },
  { productId: "p2", cityId: "baghdad", isAvailable: true },
];

describe("availability rules", () => {
  it("requires an explicit available row", () => {
    expect(isAvailableIn(rows, "p1", "damascus")).toBe(true);
    expect(isAvailableIn(rows, "p1", "baghdad")).toBe(false);
    expect(isAvailableIn(rows, "p1", "aleppo")).toBe(false);
    expect(isAvailableIn(rows, "p9", "damascus")).toBe(false);
  });

  it("lists only available cities", () => {
    expect(cityIdsFor(rows, "p1")).toEqual(["damascus"]);
  });

  it("returns lead time only for available rows", () => {
    expect(leadTimeFor(rows, "p1", "damascus")).toBe(2);
    expect(leadTimeFor(rows, "p1", "baghdad")).toBeUndefined();
  });
});

// The catalog integration tests (listProducts, getCities) that ran against
// demo.ts in Stage 2 have been removed — queries.ts now reads from Supabase,
// which requires a running database. These will be replaced by integration
// tests or Playwright e2e tests that run against the dev server.
