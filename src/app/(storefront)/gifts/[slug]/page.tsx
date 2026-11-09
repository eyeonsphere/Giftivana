import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { Section } from "@/components/storefront/section";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isAvailableIn, leadTimeFor } from "@/lib/catalog/availability";
import { getCurrencies, getProductBySlug, getProductDestinations } from "@/lib/catalog/queries";
import { getCurrentDestination } from "@/lib/destination/server";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { ProductDetail } from "@/types/domain";

type Props = { params: Promise<{ slug: string }> };

));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "gift_card");
  return product ? { title: product.name, description: product.shortDescription } : { title: t("common.notFoundTitle") };
}

/** Everything that depends on the destination cookie streams in here. */
async function PurchasePanel({ product }: { product: ProductDetail }) {
  const [destination, currencies] = await Promise.all([getCurrentDestination(), getCurrencies()]);
  const availableHere = destination ? isAvailableIn(product.availability, product.id, destination.city.id) : false;
  const lead = destination ? leadTimeFor(product.availability, product.id, destination.city.id) : undefined;

  return (
    <>
      <AddToCartForm
        product={product}
        currencies={currencies.map((c) => [c.code, c])}
        destination={destination ? { cityId: destination.city.id, cityName: destination.city.name } : null}
        availableHere={availableHere}
      />
      <div className="mt-8 rounded-card bg-green-050 p-5 text-sm">
        <h2 className="font-sans text-base font-semibold">{t("product.deliveryInfo")}</h2>
        {availableHere && lead !== undefined && (
          <p className="mt-2 font-medium text-green-800">{lead <= 1 ? t("product.leadTimeOne") : t("product.leadTime", { days: lead })}</p>
        )}
        <p className="mt-2 text-ink-soft">{t("product.deliveryCopy")}</p>
        <Link href="/delivery" className="mt-2 inline-block font-medium text-green-800 underline-offset-4 hover:underline">
          {t("footer.delivery")}
        </Link>
      </div>
    </>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "physical");
  if (!product) notFound();
  const [currencies, destinations] = await Promise.all([getCurrencies(), getProductDestinations(product.id)]);

  const image = product.images[0];
  const from = product.variants.length ? Math.min(...product.variants.map((v) => v.priceMinor)) : product.basePriceMinor;

  return (
    <Section>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-muted">
        <Link href="/gifts" className="hover:text-green-800 hover:underline">
          {t("product.backToGifts")}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/gifts?category=${product.category.slug}`} className="hover:text-green-800 hover:underline">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory-deep">
            {image && <Image src={image.path} alt={image.alt} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />}
            {product.isDemo && (
              <Badge tone="gold" className="absolute left-3 top-3">
                {t("demo.productBadge")}
              </Badge>
            )}
          </figure>
          {product.isDemo && <p className="mt-2 text-xs text-ink-muted">{t("product.demoImage")}</p>}

          <div className="ev-prose mt-8">
            <h2 className="font-sans text-lg">About this gift</h2>
            <p>{product.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="font-sans text-base font-semibold">{t("product.availableIn")}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {destinations.map((d) => (
                <li key={d.city.id}>
                  <Badge tone="green">
                    {d.city.name}, {d.country.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          {product.occasions.length > 0 && (
            <div className="mt-6">
              <h2 className="font-sans text-base font-semibold">{t("catalog.occasion")}</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.occasions.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/occasions/${o.slug}`}
                      className="inline-flex rounded-pill border border-line-strong px-3 py-1 text-sm hover:border-green-500 hover:text-green-800"
                    >
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm text-ink-muted">{product.category.name}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-ink-soft">{product.shortDescription}</p>
          <p className="mt-4 text-2xl font-semibold">
            {product.variants.length > 0 && <span className="text-base font-normal text-ink-muted">{t("catalog.from")} </span>}
            {formatMoney({ amountMinor: from, currency: product.currency }, currencies)}
          </p>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-72" />}>
              <PurchasePanel product={product} />
            </Suspense>
          </div>
        </div>
      </div>
    </Section>
  );
}
