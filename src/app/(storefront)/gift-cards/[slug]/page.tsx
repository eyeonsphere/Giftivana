import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { Section } from "@/components/storefront/section";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { isAvailableIn } from "@/lib/catalog/availability";
import { getProductMetaBySlug, getAllProductSlugs, getCities, getCurrencies, getPartnerLocations, getProductBySlug, getProductDestinations } from "@/lib/catalog/queries";
import { getCurrentDestination } from "@/lib/destination/server";
import { t } from "@/lib/i18n";
import type { GiftCardFulfillmentMethod, ProductDetail } from "@/types/domain";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllProductSlugs("gift_card")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  "use cache";
  const { slug } = await params;
  const meta = await getProductMetaBySlug(slug);
  return meta ? { title: meta.name, description: meta.shortDescription } : { title: t("common.notFoundTitle") };
}

const methodLabel: Record<GiftCardFulfillmentMethod, string> = {
  digital_code: "giftCards.fulfillmentDigital",
  physical_card: "giftCards.fulfillmentPhysical",
  manual: "giftCards.fulfillmentManual",
};

async function PurchasePanel({ product }: { product: ProductDetail }) {
  const [destination, currencies] = await Promise.all([getCurrentDestination(), getCurrencies()]);
  const availableHere = destination ? isAvailableIn(product.availability, product.id, destination.city.id) : false;
  return (
    <>
      <AddToCartForm
        product={product}
        currencies={currencies.map((c) => [c.code, c])}
        destination={destination ? { cityId: destination.city.id, cityName: destination.city.name } : null}
        availableHere={availableHere}
      />
      <p className="mt-4 text-sm text-ink-muted">{t("giftCards.recipientNote")}</p>
    </>
  );
}

export default async function GiftCardPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "gift_card");
  if (!product || !product.giftCard || !product.partner) notFound();

  const gc = product.giftCard;
  const [destinations, locations, cities] = await Promise.all([getProductDestinations(product.id), getPartnerLocations(product.partner.id), getCities()]);
  const acceptedLocations = locations.filter((l) => gc.acceptedLocationIds.includes(l.id));
  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? "";
  const image = product.images[0];

  return (
    <Section>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-muted">
        <Link href="/gift-cards" className="hover:text-green-800 hover:underline">
          {t("giftCards.backToCards")}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <figure className="relative aspect-[8/5] overflow-hidden rounded-card bg-ivory-deep">
            {image && <Image src={image.path} alt={image.alt} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />}
            {product.partner.isDemo && (
              <Badge tone="gold" className="absolute left-3 top-3">
                {t("demo.partnerBadge")}
              </Badge>
            )}
          </figure>

          <div className="ev-prose mt-8">
            <h2 className="font-sans text-lg">{product.partner.name}</h2>
            <p>{product.partner.description}</p>
            <p>{product.description}</p>
          </div>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-sans text-base font-semibold">{t("giftCards.fulfillment")}</dt>
              <dd className="mt-2 space-y-1 text-sm text-ink-soft">
                {gc.allowedFulfillmentMethods.map((m) => (
                  <p key={m} className={m === gc.defaultFulfillmentMethod ? "font-medium text-ink" : ""}>
                    {t(methodLabel[m])}
                    {m === gc.defaultFulfillmentMethod && gc.allowedFulfillmentMethods.length > 1 && <span className="text-ink-muted"> (default)</span>}
                  </p>
                ))}
                {gc.defaultFulfillmentMethod === "manual" && <p className="mt-2 text-ink-muted">{t("giftCards.fulfillmentManualHint")}</p>}
              </dd>
            </div>
            <div>
              <dt className="font-sans text-base font-semibold">{t("giftCards.timing")}</dt>
              <dd className="mt-2 text-sm text-ink-soft">{gc.deliveryTimingNote}</dd>
            </div>
            <div>
              <dt className="font-sans text-base font-semibold">{t("giftCards.redemption")}</dt>
              <dd className="mt-2 text-sm text-ink-soft">{gc.redemptionInstructions}</dd>
            </div>
            <div>
              <dt className="font-sans text-base font-semibold">{t("giftCards.expiry")}</dt>
              <dd className="mt-2 text-sm text-ink-soft">
                {gc.expiryMonths ? t("giftCards.expiresAfter", { months: gc.expiryMonths }) : t("giftCards.noExpiry")}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-sans text-base font-semibold">{t("giftCards.restrictions")}</dt>
              <dd className="mt-2 text-sm text-ink-soft">{gc.restrictions}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-sans text-base font-semibold">{t("giftCards.acceptedAt")}</dt>
              <dd className="mt-2">
                <ul className="flex flex-wrap gap-2">
                  {acceptedLocations.map((l) => (
                    <li key={l.id}>
                      <Badge tone="green">
                        {l.label} · {cityName(l.cityId)}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-muted">
                  {t("product.availableIn")}: {destinations.map((d) => `${d.city.name}, ${d.country.name}`).join("; ")}
                </p>
              </dd>
            </div>
          </dl>

          <details className="mt-8 rounded-card border border-line bg-paper p-5">
            <summary className="cursor-pointer font-sans font-semibold">{t("giftCards.terms")}</summary>
            <p className="mt-3 text-sm text-ink-soft">{gc.terms}</p>
            <p className="mt-2 text-xs text-ink-muted">Version {gc.termsVersion}</p>
          </details>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm text-ink-muted">{t("giftCards.title")}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-ink-soft">{product.shortDescription}</p>
          {product.partner.isDemo && (
            <Notice tone="warn" className="mt-4">
              {product.partner.name} is a fictional placeholder. No store accepts this card. Real partners are added through the admin dashboard once agreements
              exist.
            </Notice>
          )}
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-80" />}>
              <PurchasePanel product={product} />
            </Suspense>
          </div>
        </div>
      </div>
    </Section>
  );
}
