import type { ProductType } from "@/types/domain";

/**
 * A cart line as stored in the browser. This is the customer's INTENT plus a
 * display snapshot. It is never trusted by the server: at checkout (Stage 4)
 * the server re-fetches products, variants, denominations and availability
 * and recomputes every price and total.
 */
export interface CartLine {
  key: string; // productId + variantId/denominationId
  productId: string;
  slug: string;
  productType: ProductType;
  name: string;
  imagePath: string | null;
  variantId: string | null;
  variantName: string | null;
  denominationId: string | null;
  faceValueLabel: string | null; // e.g. "250,000 SYP" — display only
  unitPriceMinor: number; // display only; re-priced server-side
  currency: string;
  quantity: number;
  giftMessage: string;
  cityId: string; // the destination this line was added for
}

export interface CartState {
  lines: CartLine[];
  cityId: string | null; // one destination per cart (MVP rule)
}

export const CART_STORAGE_KEY = "giftivana.cart.v1";
export const MAX_QUANTITY = 10;
export const MAX_GIFT_MESSAGE = 300;
