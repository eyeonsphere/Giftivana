"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import * as rules from "./rules";
import { CART_STORAGE_KEY, type CartLine, type CartState } from "./types";

/**
 * Cart store: a tiny external store backed by localStorage, exposed through
 * useSyncExternalStore so server render and first client render agree (empty),
 * and the real cart appears after hydration without an effect-driven setState.
 */

const EMPTY: CartState = { lines: [], cityId: null };
let cache: CartState | null = null;
const listeners = new Set<() => void>();

function read(): CartState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartState) : null;
    cache = parsed && Array.isArray(parsed.lines) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: CartState) {
  cache = next;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — cart lives in memory for this page */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => EMPTY;
const hydratedClient = () => true;
const hydratedServer = () => false;

interface CartContextValue {
  state: CartState;
  hydrated: boolean;
  add: (line: CartLine) => rules.AddResult;
  replaceWith: (line: CartLine) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, read, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribe, hydratedClient, hydratedServer);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      hydrated,
      add: (line) => {
        const result = rules.addLine(read(), line);
        if (result.ok) write(result.state);
        return result;
      },
      replaceWith: (line) => write(rules.replaceCart(line)),
      remove: (key) => write(rules.removeLine(read(), key)),
      setQuantity: (key, q) => write(rules.setQuantity(read(), key, q)),
      clear: () => write(EMPTY),
      count: rules.lineCount(state),
    }),
    [state, hydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Safe default when rendered outside CartProvider (e.g. _not-found, admin). */
const EMPTY_CART: CartContextValue = {
  state: { lines: [], cityId: null },
  hydrated: false,
  add: () => ({ ok: true, state: { lines: [], cityId: null } }),
  replaceWith: () => {},
  remove: () => {},
  setQuantity: () => {},
  clear: () => {},
  count: 0,
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  return ctx ?? EMPTY_CART;
}
