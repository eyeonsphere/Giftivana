import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/storefront/catalog-filters";
import { DestinationGate } from "@/components/storefront/destination-gate";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState, Section } from "@/components/storefront/section";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getCurrencyMap, listProducts } from "@/lib/catalog/queries";
import { hasActiveFilters, parseCatalogFilters, priceRange } from "@/lib/catalog/search-params";
import { getCurrentDestination } from "@/lib/destination/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("giftCards.title") };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const storeTypes = [
  { value: "supermarket", label: "Supermarket" },
  { value: "department", label: "Department store" },
  { value: "grocery", label: "Grocery" },
  { value: "other", label: "Other" },
];

async function Catalog({ searchParams }: Props) {
  const [raw, destination, currencies] = await Promise.all([searchParams, getCurrentDestination(), getCurrencyMap()]);
  const filters = parseCatalogFilters(raw);

  if (!destination) return <DestinationGate redirectTo="/gift-cards" />;

  const cards = await listProducts({
    type: "gift_card",
    cityId: destination.city.id,
    storeCategory: filters.store,
    query: filters.q,
    sort: filters.sort,
    ...priceRange(filters.price),
  });

  return (
    <>
      <CatalogFilters basePath="/gift-cards" filters={filters} storeTypes={storeTypes} />
      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {cards.length} {cards.length === 1 ? "gift card" : "gift cards"} · {destination.city.name}, {destination.country.name}
      </p>
      {cards.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t("giftCards.emptyTitle")} body={t("giftCards.emptyBody")}>
            {hasActiveFilters(filters) && (
              <ButtonLink href="/gift-cards" variant="secondary">
                {t("catalog.clear")}
              </ButtonLink>
            )}
            <ButtonLink href="/gifts" variant="ghost">
              {t("nav.gifts")}
            </ButtonLink>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {cards.map((p) => (
            <ProductCard key={p.id} product={p} currencies={currencies} />
          ))}
        </div>
      )}
    </>
  );
}

export default function GiftCardsPage(props: Props) {
  return (
    <Section>
      <div className="mb-6 max-w-2xl">
        <h1>{t("giftCards.title")}</h1>
        <p className="mt-2 text-ink-soft">{t("giftCards.subtitle")}</p>
      </div>
      <Notice tone="info" className="mb-8 max-w-3xl">
        {t("giftCards.difference")}
      </Notice>
      <Suspense fallback={<ProductGridSkeleton count={3} />}>
        <Catalog searchParams={props.searchParams} />
      </Suspense>
    </Section>
  );
}
