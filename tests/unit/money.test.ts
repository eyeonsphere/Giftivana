import { describe, expect, it } from "vitest";
import { currencies } from "@/data/demo";
import { CurrencyMismatchError, add, formatMoney, multiply, sum, toMinor } from "@/lib/money";

describe("money", () => {
  it("adds amounts in the same currency", () => {
    expect(add({ amountMinor: 100, currency: "USD" }, { amountMinor: 250, currency: "USD" })).toEqual({ amountMinor: 350, currency: "USD" });
  });

  it("refuses to add different currencies", () => {
    expect(() => add({ amountMinor: 1, currency: "USD" }, { amountMinor: 1, currency: "SYP" })).toThrow(CurrencyMismatchError);
  });

  it("rejects non-integer minor units", () => {
    expect(() => multiply({ amountMinor: 10.5, currency: "USD" }, 2)).toThrow(TypeError);
  });

  it("sums a list", () => {
    expect(
      sum(
        [
          { amountMinor: 1, currency: "USD" },
          { amountMinor: 2, currency: "USD" },
        ],
        "USD",
      ).amountMinor,
    ).toBe(3);
  });

  it("formats zero-decimal currencies without fraction digits", () => {
    expect(formatMoney({ amountMinor: 250000, currency: "SYP" }, currencies)).toMatch(/250,000/);
    expect(formatMoney({ amountMinor: 250000, currency: "SYP" }, currencies)).not.toMatch(/\.00/);
    expect(formatMoney({ amountMinor: 2500, currency: "USD" }, currencies)).toBe("$25.00");
  });

  it("converts major strings to minor units exactly", () => {
    expect(toMinor("12.5", 2)).toBe(1250);
    expect(toMinor("12", 2)).toBe(1200);
    expect(toMinor("250000", 0)).toBe(250000);
    expect(() => toMinor("abc", 2)).toThrow();
  });
});
