import { describe, expect, it } from "vitest";
import { cityIdsFor, isAvailableIn, leadTimeFor } from "@/lib/catalog/availability";
import { listProducts } from "@/lib/catalog/queries";

const rows = [
  { productId: "p1", cityId: "damascus", isAvailable: true, leadTimeDays: 2 },
  { productId: "p1", cityId: "baghdad", isAvailable: false },
  { productId: "p2", cityId: "baghdad", isAvailable: true },
];

describe("availability rules", () => {
  it("requires an explicit available row", () => {
    expect(isAvailableIn(rows, "p1", "damascus")).toBe(true);
    expect(isAvailableIn(rows, "p1", "baghdad")).toBe(false); // row exists but false
    expect(isAvailableIn(rows, "p1", "aleppo")).toBe(false); // no row at all
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

describe("destination-based catalog (demo data)", () => {
  it("filters physical gifts by city", async () => {
    const damascus = await listProducts({ type: "physical", cityId: "city_damascus" });
    const baghdad = await listProducts({ type: "physical", cityId: "city_baghdad" });
    expect(damascus.some((p) => p.slug === "white-rose-arrangement")).toBe(true);
    expect(baghdad.some((p) => p.slug === "white-rose-arrangement")).toBe(false);
    expect(baghdad.some((p) => p.slug === "sunflower-bunch")).toBe(true);
  });

  it("never shows a gift card outside its partner's city", async () => {
    const baghdadCards = await listProducts({ type: "gift_card", cityId: "city_baghdad" });
    expect(baghdadCards.map((c) => c.slug)).toEqual(["demo-department-store-iraq-gift-card"]);
  });

  it("returns nothing for an unknown city", async () => {
    expect(await listProducts({ type: "physical", cityId: "city_nowhere" })).toHaveLength(0);
  });

  it("uses the cheapest denomination's charge price as the 'from' price", async () => {
    const [card] = await listProducts({ type: "gift_card", cityId: "city_baghdad" });
    expect(card.fromPrice).toEqual({ amountMinor: 5000, currency: "USD" });
  });

  it("applies price bands, search and sort", async () => {
    const cheap = await listProducts({ type: "physical", cityId: "city_damascus", maxMinor: 2499 });
    expect(cheap.every((p) => p.fromPrice.amountMinor <= 2499)).toBe(true);
    const search = await listProducts({ type: "physical", query: "olive" });
    expect(search.map((p) => p.slug)).toEqual(["small-olive-tree"]);
    const sorted = await listProducts({ type: "physical", sort: "price-desc" });
    expect(sorted[0].fromPrice.amountMinor).toBeGreaterThanOrEqual(sorted[1].fromPrice.amountMinor);
  });
});

describe("Syrian demo cities", () => {
  it("lists six Syrian cities and keeps Baghdad", async () => {
    const { getCities } = await import("@/lib/catalog/queries");
    const sy = await getCities("SY");
    expect(sy.map((c) => c.name)).toEqual(["Damascus", "Aleppo", "Homs", "Hama", "Latakia", "Tartus"]);
    expect((await getCities("IQ")).map((c) => c.slug)).toEqual(["baghdad"]);
  });

  it("makes Damascus physical gifts available in other Syrian cities, but not gift cards", async () => {
    const aleppo = await listProducts({ type: "physical", cityId: "city_aleppo" });
    expect(aleppo.some((p) => p.slug === "soft-peony-bouquet")).toBe(true);
    expect(await listProducts({ type: "gift_card", cityId: "city_aleppo" })).toHaveLength(0);
  });
});
