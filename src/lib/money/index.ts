import type { Currency, Money } from "@/types/domain";

/**
 * Money helpers. All arithmetic is on integer minor units.
 * Formatting needs the currency's minor-unit exponent, which comes from the
 * `currencies` table (demo data in Stage 2, Supabase in Stage 3).
 */

export class CurrencyMismatchError extends Error {
  constructor(a: string, b: string) {
    super(`Cannot combine amounts in different currencies: ${a} and ${b}`);
    this.name = "CurrencyMismatchError";
  }
}

export function assertInteger(n: number, label = "amount"): void {
  if (!Number.isInteger(n)) {
    throw new TypeError(`${label} must be an integer in minor units, got ${n}`);
  }
}

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  assertInteger(a.amountMinor);
  assertInteger(b.amountMinor);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function multiply(m: Money, qty: number): Money {
  assertInteger(m.amountMinor);
  assertInteger(qty, "quantity");
  if (qty < 0) throw new RangeError("quantity must be >= 0");
  return { amountMinor: m.amountMinor * qty, currency: m.currency };
}

export function sum(items: Money[], currency: string): Money {
  return items.reduce<Money>((acc, m) => add(acc, m), { amountMinor: 0, currency });
}

/**
 * Format minor units for display. Uses Intl when the currency is known to the
 * runtime; falls back to a manual format with the currency code suffixed.
 * `locale` defaults to en-US; Arabic formatting is a one-line change later.
 */
export function formatMoney(
  money: Money,
  currencies: Pick<Currency, "code" | "minorUnitExponent" | "symbol">[] | Map<string, Currency>,
  locale = "en-US",
): string {
  const lookup = currencies instanceof Map ? currencies.get(money.currency) : currencies.find((c) => c.code === money.currency);
  const exponent = lookup?.minorUnitExponent ?? 2;
  const major = money.amountMinor / 10 ** exponent;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currency,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(major);
  } catch {
    const fixed = major.toLocaleString(locale, {
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    });
    return `${fixed} ${money.currency}`;
  }
}

/** Convert a human-entered major amount (e.g. "12.50") to minor units safely. */
export function toMinor(major: string | number, exponent: number): number {
  const str = typeof major === "number" ? major.toFixed(exponent) : major.trim();
  if (!/^\d+(\.\d+)?$/.test(str)) throw new TypeError(`Invalid amount: ${major}`);
  const [whole, frac = ""] = str.split(".");
  const paddedFrac = (frac + "0".repeat(exponent)).slice(0, exponent);
  return Number(whole) * 10 ** exponent + (exponent > 0 ? Number(paddedFrac) : 0);
}
