"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CartProvider = dynamic(
  () => import("@/lib/cart/store").then((m) => m.CartProvider),
  { ssr: false },
);

export function LazyCartProvider({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
