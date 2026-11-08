"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import type { CatalogFilters } from "@/lib/catalog/search-params";
import { priceBands } from "@/lib/catalog/search-params";
import { t } from "@/lib/i18n";

interface Option {
  value: string;
  label: string;
}

interface Props {
  basePath: "/gifts" | "/gift-cards";
  filters: CatalogFilters;
  categories?: Option[];
  occasions?: Option[];
  storeTypes?: Option[];
}

/**
 * Filter bar. A real <form method="get"> so it works without JavaScript;
 * with JavaScript, changing a select navigates immediately via the router.
 */
export function CatalogFilters({ basePath, filters, categories, occasions, storeTypes }: Props) {
  const id = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");

  function navigate() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      if (typeof v === "string" && v.trim()) params.set(k, v.trim());
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${basePath}?${qs}` : basePath));
  }

  return (
    <form
      ref={formRef}
      method="get"
      action={basePath}
      onSubmit={(e) => {
        e.preventDefault();
        navigate();
      }}
      className="rounded-card border border-line bg-paper p-4 sm:p-5"
      aria-busy={pending || undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <Input
          id={`${id}-q`}
          name="q"
          type="search"
          label={t("catalog.search")}
          placeholder={t("catalog.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {categories && (
          <Select id={`${id}-category`} name="category" label={t("catalog.category")} defaultValue={filters.category ?? ""} onChange={navigate}>
            <option value="">{t("catalog.anyCategory")}</option>
            {categories.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
        {storeTypes && (
          <Select id={`${id}-store`} name="store" label={t("giftCards.storeType")} defaultValue={filters.store ?? ""} onChange={navigate}>
            <option value="">{t("giftCards.anyStoreType")}</option>
            {storeTypes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
        {occasions && (
          <Select id={`${id}-occasion`} name="occasion" label={t("catalog.occasion")} defaultValue={filters.occasion ?? ""} onChange={navigate}>
            <option value="">{t("catalog.anyOccasion")}</option>
            {occasions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
        <Select id={`${id}-price`} name="price" label={t("catalog.price")} defaultValue={filters.price ?? ""} onChange={navigate}>
          <option value="">{t("catalog.anyPrice")}</option>
          {priceBands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </Select>
        <Select id={`${id}-sort`} name="sort" label={t("catalog.sort")} defaultValue={filters.sort ?? "featured"} onChange={navigate}>
          <option value="featured">{t("catalog.sortFeatured")}</option>
          <option value="price-asc">{t("catalog.sortPriceAsc")}</option>
          <option value="price-desc">{t("catalog.sortPriceDesc")}</option>
          <option value="name">{t("catalog.sortName")}</option>
        </Select>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          {t("catalog.apply")}
        </Button>
        <ButtonLink href={basePath} size="sm" variant="ghost">
          {t("catalog.clear")}
        </ButtonLink>
      </div>
    </form>
  );
}
