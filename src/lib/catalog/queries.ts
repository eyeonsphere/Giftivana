/**
 * Catalog read layer.
 *
 * Stage 2: backed by src/data/demo.ts (synchronous, in-memory).
 * Stage 3: the same function signatures will be implemented against Supabase
 * (async), so every function here already returns a Promise.
 *
 * Nothing in this module should ever return private data (partner contact
 * notes, fulfillment secrets, recipient details). It is the public catalog.
 */
import * as demo from "@/data/demo";
import type {
  Category,
  City,
  Country,
  Currency,
  DeliverySettings,
  Destination,
  Occasion,
  Partner,
  PartnerLocation,
  Product,
  ProductDetail,
  ProductSummary,
  ProductType,
  StoreCategory,
} from "@/types/domain";
import { cityIdsFor, isAvailableIn } from "./availability";

/* ---------- Reference data ---------- */

export async function getCurrencies(): Promise<Currency[]> {
  return demo.currencies;
}

export async function getCurrencyMap(): Promise<Map<string, Currency>> {
  return new Map(demo.currencies.map((c) => [c.code, c]));
}

export async function getDestinationCountries(): Promise<Country[]> {
  return demo.countries.filter((c) => c.isDestination && c.isActive);
}

export async function getOriginCountries(): Promise<Country[]> {
  return demo.countries.filter((c) => c.isOrigin && c.isActive);
}

export async function getCities(countryCode?: string): Promise<City[]> {
  return demo.cities.filter((c) => c.isActive && (!countryCode || c.countryCode === countryCode)).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getDestinationBySlug(citySlug: string | undefined): Promise<Destination | null> {
  if (!citySlug) return null;
  const city = demo.cities.find((c) => c.slug === citySlug && c.isActive);
  if (!city) return null;
  const country = demo.countries.find((c) => c.code === city.countryCode);
  if (!country) return null;
  return { country, city };
}

export async function getDeliverySettings(cityId: string): Promise<DeliverySettings | null> {
  return demo.deliverySettings.find((d) => d.cityId === cityId) ?? null;
}

export async function getCategories(type?: ProductType): Promise<Category[]> {
  return demo.categories.filter((c) => c.isActive && (!type || c.productType === type)).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return demo.categories.find((c) => c.slug === slug && c.isActive) ?? null;
}

export async function getOccasions(): Promise<Occasion[]> {
  return demo.occasions.filter((o) => o.isActive);
}

export async function getOccasionBySlug(slug: string): Promise<Occasion | null> {
  return demo.occasions.find((o) => o.slug === slug && o.isActive) ?? null;
}

export async function getPartners(): Promise<Partner[]> {
  return demo.partners.filter((p) => p.status === "active");
}

export async function getPartnerLocations(partnerId: string): Promise<PartnerLocation[]> {
  return demo.partnerLocations.filter((l) => l.partnerId === partnerId && l.isActive);
}

/* ---------- Products ---------- */

function toSummary(p: Product): ProductSummary {
  const category = demo.categories.find((c) => c.id === p.categoryId)!;
  const image = demo.productImages.filter((i) => i.productId === p.id).sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
  const partner = p.partnerId ? (demo.partners.find((x) => x.id === p.partnerId) ?? null) : null;

  let fromMinor = p.basePriceMinor;
  let currency = p.currency;
  if (p.productType === "gift_card") {
    const dens = demo.giftCardDenominations.filter((d) => d.productId === p.id && d.isActive);
    if (dens.length) {
      const cheapest = dens.reduce((a, b) => (a.chargePriceMinor <= b.chargePriceMinor ? a : b));
      fromMinor = cheapest.chargePriceMinor;
      currency = cheapest.chargeCurrency;
    }
  } else {
    const vars = demo.productVariants.filter((v) => v.productId === p.id && v.isActive);
    if (vars.length) fromMinor = Math.min(...vars.map((v) => v.priceMinor));
  }

  return {
    id: p.id,
    slug: p.slug,
    productType: p.productType,
    name: p.name,
    shortDescription: p.shortDescription,
    categorySlug: category.slug,
    categoryName: category.name,
    isFeatured: p.isFeatured,
    isDemo: p.isDemo,
    fromPrice: { amountMinor: fromMinor, currency },
    image,
    partnerName: partner?.name ?? null,
    storeCategory: partner?.storeCategory ?? null,
  };
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export interface ListProductsParams {
  type: ProductType;
  cityId?: string; // undefined → no destination chosen → no availability filter
  categorySlug?: string;
  occasionSlug?: string;
  storeCategory?: StoreCategory;
  minMinor?: number;
  maxMinor?: number;
  query?: string;
  sort?: SortKey;
  featuredOnly?: boolean;
  limit?: number;
}

export async function listProducts(params: ListProductsParams): Promise<ProductSummary[]> {
  const q = params.query?.trim().toLowerCase();
  const category = params.categorySlug ? demo.categories.find((c) => c.slug === params.categorySlug) : undefined;
  const occasion = params.occasionSlug ? demo.occasions.find((o) => o.slug === params.occasionSlug) : undefined;

  let rows = demo.products.filter((p) => p.status === "active" && p.productType === params.type);

  if (params.cityId) rows = rows.filter((p) => isAvailableIn(demo.productAvailability, p.id, params.cityId!));
  if (category) rows = rows.filter((p) => p.categoryId === category.id);
  if (occasion) rows = rows.filter((p) => p.occasionIds.includes(occasion.id));
  if (params.featuredOnly) rows = rows.filter((p) => p.isFeatured);
  if (params.storeCategory) {
    rows = rows.filter((p) => demo.partners.find((x) => x.id === p.partnerId)?.storeCategory === params.storeCategory);
  }
  if (q) rows = rows.filter((p) => `${p.name} ${p.shortDescription}`.toLowerCase().includes(q));

  let summaries = rows.map(toSummary);

  if (params.minMinor !== undefined) summaries = summaries.filter((s) => s.fromPrice.amountMinor >= params.minMinor!);
  if (params.maxMinor !== undefined) summaries = summaries.filter((s) => s.fromPrice.amountMinor <= params.maxMinor!);

  switch (params.sort ?? "featured") {
    case "price-asc":
      summaries.sort((a, b) => a.fromPrice.amountMinor - b.fromPrice.amountMinor);
      break;
    case "price-desc":
      summaries.sort((a, b) => b.fromPrice.amountMinor - a.fromPrice.amountMinor);
      break;
    case "name":
      summaries.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      summaries.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));
  }

  return params.limit ? summaries.slice(0, params.limit) : summaries;
}

export async function getProductBySlug(slug: string, type?: ProductType): Promise<ProductDetail | null> {
  const p = demo.products.find((x) => x.slug === slug && x.status === "active" && (!type || x.productType === type));
  if (!p) return null;

  const category = demo.categories.find((c) => c.id === p.categoryId)!;
  const gc = demo.giftCardDetails.find((g) => g.productId === p.id) ?? null;

  return {
    ...p,
    category,
    images: demo.productImages.filter((i) => i.productId === p.id).sort((a, b) => a.sortOrder - b.sortOrder),
    variants: demo.productVariants.filter((v) => v.productId === p.id && v.isActive),
    availability: demo.productAvailability.filter((a) => a.productId === p.id),
    occasions: demo.occasions.filter((o) => p.occasionIds.includes(o.id)),
    partner: p.partnerId ? (demo.partners.find((x) => x.id === p.partnerId) ?? null) : null,
    giftCard: gc
      ? {
          ...gc,
          denominations: demo.giftCardDenominations.filter((d) => d.productId === p.id && d.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
        }
      : null,
  };
}

/** Cities (with country) where a product can be delivered — for the detail page. */
export async function getProductDestinations(productId: string): Promise<Destination[]> {
  const ids = cityIdsFor(demo.productAvailability, productId);
  return ids
    .map((id) => demo.cities.find((c) => c.id === id))
    .filter((c): c is City => !!c && c.isActive)
    .map((city) => ({ city, country: demo.countries.find((k) => k.code === city.countryCode)! }));
}

export async function getAllProductSlugs(type: ProductType): Promise<string[]> {
  return demo.products.filter((p) => p.status === "active" && p.productType === type).map((p) => p.slug);
}
