/**
 * Domain types for Giftivana.
 *
 * These mirror the database schema from docs/STAGE-1-PLAN.md (§5) so that
 * Stage 3 can replace the demo data source with Supabase queries without
 * changing components. Field names are camelCase here and snake_case in SQL;
 * the mapping layer (src/lib/catalog) is the only place that knows both.
 *
 * Money is ALWAYS an integer in minor units with an explicit currency code.
 */

export type ProductType = "physical" | "gift_card";
export type ProductStatus = "draft" | "active" | "archived";
export type GiftCardFulfillmentMethod = "digital_code" | "physical_card" | "manual";
export type PartnerStatus = "draft" | "active" | "suspended";
export type StoreCategory = "supermarket" | "department" | "grocery" | "other";

export interface Currency {
  code: string; // ISO 4217
  name: string;
  minorUnitExponent: number; // USD → 2, IQD/SYP → 0
  symbol?: string;
  isChargeCurrency: boolean;
  isFaceCurrency: boolean;
}

export interface Money {
  amountMinor: number;
  currency: string;
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  isDestination: boolean;
  isOrigin: boolean;
  defaultTimezone: string;
  isActive: boolean;
}

export interface City {
  id: string;
  countryCode: string;
  name: string;
  slug: string;
  timezone: string;
  isActive: boolean;
  sortOrder: number;
}

export interface DeliverySettings {
  cityId: string;
  minLeadDays: number;
  maxAdvanceDays: number;
  cutoffTime: string; // "HH:MM" local to city
  blackoutDates: string[]; // ISO dates
  deliveryDays: number[]; // 0=Sun … 6=Sat
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  productType: ProductType;
  sortOrder: number;
  isActive: boolean;
  imagePath: string;
}

export interface Occasion {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  imagePath: string;
}

export interface Partner {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoPath: string;
  storeCategory: StoreCategory;
  countryCode: string;
  status: PartnerStatus;
  isDemo: boolean;
  supportedFulfillmentMethods: GiftCardFulfillmentMethod[];
}

export interface PartnerLocation {
  id: string;
  partnerId: string;
  cityId: string;
  label: string;
  address?: string;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  path: string;
  alt: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceMinor: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface ProductAvailability {
  productId: string;
  cityId: string;
  isAvailable: boolean;
  leadTimeDays?: number;
}

export interface GiftCardDenomination {
  id: string;
  productId: string;
  faceValueMinor: number;
  faceCurrency: string;
  chargePriceMinor: number;
  chargeCurrency: string;
  isActive: boolean;
  sortOrder: number;
}

export interface GiftCardDetails {
  productId: string;
  faceCurrency: string;
  defaultFulfillmentMethod: GiftCardFulfillmentMethod;
  allowedFulfillmentMethods: GiftCardFulfillmentMethod[];
  redemptionInstructions: string;
  terms: string;
  termsVersion: number;
  expiryMonths: number | null;
  restrictions: string;
  deliveryTimingNote: string;
  acceptedLocationIds: string[];
}

export interface Product {
  id: string;
  slug: string;
  productType: ProductType;
  categoryId: string;
  partnerId: string | null;
  name: string;
  shortDescription: string;
  description: string;
  status: ProductStatus;
  isFeatured: boolean;
  isDemo: boolean;
  basePriceMinor: number;
  currency: string;
  occasionIds: string[];
}

/** A product with its relations resolved — what pages actually render. */
export interface ProductDetail extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  availability: ProductAvailability[];
  occasions: Occasion[];
  partner: Partner | null;
  giftCard: (GiftCardDetails & { denominations: GiftCardDenomination[] }) | null;
}

/** Lightweight card data for lists. */
export interface ProductSummary {
  id: string;
  slug: string;
  productType: ProductType;
  name: string;
  shortDescription: string;
  categorySlug: string;
  categoryName: string;
  isFeatured: boolean;
  isDemo: boolean;
  fromPrice: Money;
  image: ProductImage | null;
  partnerName: string | null;
  storeCategory: StoreCategory | null;
}

export interface Destination {
  country: Country;
  city: City;
}
