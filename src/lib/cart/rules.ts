import type { CartLine, CartState } from "./types";
import { MAX_QUANTITY } from "./types";

/**
 * Pure cart rules — no React, no storage. Reused by the server in Stage 4.
 */

export type AddResult = { ok: true; state: CartState } | { ok: false; reason: "different_destination"; currentCityId: string };

export function addLine(state: CartState, line: CartLine): AddResult {
  if (state.cityId && state.cityId !== line.cityId && state.lines.length > 0) {
    return { ok: false, reason: "different_destination", currentCityId: state.cityId };
  }
  const existing = state.lines.find((l) => l.key === line.key);
  const lines = existing
    ? state.lines.map((l) =>
        l.key === line.key ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + line.quantity), giftMessage: line.giftMessage || l.giftMessage } : l,
      )
    : [...state.lines, { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity) }];
  return { ok: true, state: { lines, cityId: line.cityId } };
}

export function removeLine(state: CartState, key: string): CartState {
  const lines = state.lines.filter((l) => l.key !== key);
  return { lines, cityId: lines.length ? state.cityId : null };
}

export function setQuantity(state: CartState, key: string, quantity: number): CartState {
  const q = Math.max(0, Math.min(MAX_QUANTITY, Math.floor(quantity)));
  if (q === 0) return removeLine(state, key);
  return { ...state, lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: q } : l)) };
}

export function replaceCart(line: CartLine): CartState {
  return { lines: [{ ...line, quantity: Math.min(MAX_QUANTITY, line.quantity) }], cityId: line.cityId };
}

export function lineCount(state: CartState): number {
  return state.lines.reduce((n, l) => n + l.quantity, 0);
}

export function containsPhysical(state: CartState): boolean {
  return state.lines.some((l) => l.productType === "physical");
}

export function containsDigital(state: CartState): boolean {
  return state.lines.some((l) => l.productType === "gift_card");
}

/** Display-only subtotal; assumes a single charge currency (enforced at checkout). */
export function displaySubtotalMinor(state: CartState): { amountMinor: number; currency: string } | null {
  if (!state.lines.length) return null;
  const currency = state.lines[0].currency;
  if (state.lines.some((l) => l.currency !== currency)) return null;
  return { amountMinor: state.lines.reduce((n, l) => n + l.unitPriceMinor * l.quantity, 0), currency };
}
