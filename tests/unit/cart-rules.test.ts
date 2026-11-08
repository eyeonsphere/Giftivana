import { describe, expect, it } from "vitest";
import { addLine, containsDigital, containsPhysical, displaySubtotalMinor, lineCount, removeLine, setQuantity } from "@/lib/cart/rules";
import { MAX_QUANTITY, type CartLine, type CartState } from "@/lib/cart/types";

const line = (over: Partial<CartLine>): CartLine => ({
  key: "p1:base",
  productId: "p1",
  slug: "p1",
  productType: "physical",
  name: "Gift",
  imagePath: null,
  variantId: null,
  variantName: null,
  denominationId: null,
  faceValueLabel: null,
  unitPriceMinor: 1000,
  currency: "USD",
  quantity: 1,
  giftMessage: "",
  cityId: "damascus",
  ...over,
});

const empty: CartState = { lines: [], cityId: null };

describe("cart rules", () => {
  it("adds and merges lines", () => {
    const a = addLine(empty, line({}));
    expect(a.ok && a.state.lines).toHaveLength(1);
    const b = addLine(a.ok ? a.state : empty, line({ quantity: 2 }));
    expect(b.ok && b.state.lines[0].quantity).toBe(3);
  });

  it("caps quantity", () => {
    const a = addLine(empty, line({ quantity: 99 }));
    expect(a.ok && a.state.lines[0].quantity).toBe(MAX_QUANTITY);
  });

  it("rejects a line for a different destination", () => {
    const a = addLine(empty, line({}));
    const b = addLine(a.ok ? a.state : empty, line({ key: "p2", productId: "p2", cityId: "baghdad" }));
    expect(b.ok).toBe(false);
    expect(!b.ok && b.reason).toBe("different_destination");
  });

  it("clears destination when the last line is removed", () => {
    const a = addLine(empty, line({}));
    const s = removeLine(a.ok ? a.state : empty, "p1:base");
    expect(s).toEqual(empty);
  });

  it("removes a line when quantity set to zero", () => {
    const a = addLine(empty, line({}));
    expect(setQuantity(a.ok ? a.state : empty, "p1:base", 0).lines).toHaveLength(0);
  });

  it("detects mixed physical/digital carts and computes display subtotal", () => {
    let s = addLine(empty, line({ quantity: 2 }));
    s = addLine(s.ok ? s.state : empty, line({ key: "gc", productId: "gc", productType: "gift_card", unitPriceMinor: 2500 }));
    const state = s.ok ? s.state : empty;
    expect(containsPhysical(state) && containsDigital(state)).toBe(true);
    expect(lineCount(state)).toBe(3);
    expect(displaySubtotalMinor(state)).toEqual({ amountMinor: 4500, currency: "USD" });
  });
});
