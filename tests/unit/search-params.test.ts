import { describe, expect, it } from "vitest";
import { parseCatalogFilters, priceRange } from "@/lib/catalog/search-params";

describe("catalog search params", () => {
  it("drops unknown or invalid values instead of throwing", () => {
    expect(parseCatalogFilters({ sort: "evil", price: "nope", q: "x".repeat(200) })).toEqual({});
  });
  it("keeps valid values and takes the first of repeated params", () => {
    expect(parseCatalogFilters({ q: ["rose", "other"], sort: "name", price: "25-50" })).toEqual({ q: "rose", sort: "name", price: "25-50" });
  });
  it("maps price bands to minor-unit ranges", () => {
    expect(priceRange("25-50")).toEqual({ minMinor: 2500, maxMinor: 5000 });
    expect(priceRange(undefined)).toEqual({});
  });
});
