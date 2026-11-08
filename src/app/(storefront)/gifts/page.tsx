import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/storefront/catalog-filters";
import { DestinationGate } from "@/components/storefront/destination-gate";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState, Section } from "@/components/storefront/section";
import { ButtonLink } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getCategories, getCurrencyMap, getOccasions, listProducts } from "@/lib/catalog/queries";
import { hasActiveFilters, parseCatalogFilters, priceRange } from "@/lib/catalog/search-params";
import { getCurrentDestination } from "@/lib/destination/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("catalog.title") };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Catalog({ searchParams }: Props) {
  const [raw, destination, currencies, categories, occasions] = await Promise.all([
    searchParams,
    getCurrentDestination(),
    getCurrencyMap(),
    getCategories("physical"),
    getOccasions(),
  ]);
  const filters = parseCatalogFilters(raw);

  if (!destination) {
    return <DestinationGate redirectTo="/gifts" />;
  }

  const products = await listProducts({
    type: "physical",
    cityId: destination.city.id,
    categorySlug: filters.category,
    occasionSlug: filters.occasion,
    query: filters.q,
    sort: filters.sort,
    ...priceRange(filters.price),
  });

  return (
    <>
      <CatalogFilters
        basePath="/gifts"
        filters={filters}
        categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
        occasions={occasions.map((o) => ({ value: o.slug, label: o.name }))}
      />
      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {products.length === 1 ? t("catalog.resultsOne") : t("catalog.results", { count: products.length })} · {destination.city.name},{" "}
        {destination.country.name}
      </p>
      {products.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t("catalog.emptyTitle")} body={t("catalog.emptyBody")}>
            {hasActiveFilters(filters) && (
              <ButtonLink href="/gifts" variant="secondary">
                {t("catalog.clear")}
              </ButtonLink>
            )}
            <ButtonLink href="/#destination" variant="ghost">
              {t("destination.change")}
            </ButtonLink>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currencies={currencies} />
          ))}
        </div>
      )}
    </>
  );
}

export default function GiftsPage(props: Props) {
  return (
    <Section>
      <div className="mb-8 max-w-2xl">
        <h1>{t("catalog.title")}</h1>
        <p className="mt-2 text-ink-soft">{t("catalog.subtitle")}</p>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <Catalog searchParams={props.searchParams} />
      </Suspense>
    </Section>
  );
}
