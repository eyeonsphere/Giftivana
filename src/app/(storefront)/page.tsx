import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DestinationForm } from "@/components/storefront/destination-form";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState, Section, SectionHeading } from "@/components/storefront/section";
import { ButtonLink } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getCategories, getCities, getCurrencyMap, getDestinationCountries, getOccasions, listProducts } from "@/lib/catalog/queries";
import { getCurrentDestination } from "@/lib/destination/server";
import { t, tList } from "@/lib/i18n";

/* ----- Hero: headline + the gift tag (destination picker) ----- */

async function DestinationTag() {
  const [countries, cities, destination] = await Promise.all([getDestinationCountries(), getCities(), getCurrentDestination()]);
  return (
    <div id="destination" className="ev-tag ev-rise p-6 sm:p-8">
      <h2 className="pe-8 font-display text-2xl">{t("destination.label")}</h2>
      <div className="mt-5">
        <DestinationForm
          countries={countries}
          cities={cities}
          initialCountry={destination?.country.code}
          initialCity={destination?.city.slug}
          redirectTo="/gifts"
        />
      </div>
      <p className="mt-4 text-xs text-ink-muted">{t("demo.destinationNote")}</p>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-peach-100 blur-3xl" />
      <div className="ev-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-green-700">{t("brand.tagline")}</p>
          <h1 className="mt-3">{t("home.heroTitle")}</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">{t("home.heroBody")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/gifts" size="lg">
              {t("home.heroCta")}
            </ButtonLink>
            <ButtonLink href="#how" size="lg" variant="secondary">
              {t("home.heroSecondary")}
            </ButtonLink>
          </div>
        </div>
        <Suspense fallback={<div className="ev-tag h-72 animate-pulse" />}>
          <DestinationTag />
        </Suspense>
      </div>
    </section>
  );
}

/* ----- Sections that depend on the destination cookie ----- */

async function FeaturedGifts() {
  const [destination, currencies] = await Promise.all([getCurrentDestination(), getCurrencyMap()]);
  const products = await listProducts({ type: "physical", cityId: destination?.city.id, featuredOnly: true, limit: 6 });
  if (!products.length) {
    return <EmptyState title={t("catalog.emptyTitle")} body={t("catalog.emptyBody")} />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} currencies={currencies} />
      ))}
    </div>
  );
}

async function FeaturedGiftCards() {
  const [destination, currencies] = await Promise.all([getCurrentDestination(), getCurrencyMap()]);
  const cards = await listProducts({ type: "gift_card", cityId: destination?.city.id, limit: 3 });
  if (!cards.length) {
    return <EmptyState title={t("giftCards.emptyTitle")} body={t("giftCards.emptyBody")} />;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
      {cards.map((p) => (
        <ProductCard key={p.id} product={p} currencies={currencies} />
      ))}
    </div>
  );
}

/* ----- Static sections ----- */

async function Categories() {
  const categories = await getCategories();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 lg:gap-4">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={c.productType === "gift_card" ? "/gift-cards" : `/gifts?category=${c.slug}`}
            className="group flex flex-col items-center gap-3 rounded-card border border-line bg-paper p-4 text-center hover:border-green-200 hover:bg-green-050"
          >
            <span className="relative size-16 overflow-hidden rounded-full bg-ivory-deep">
              <Image src={c.imagePath} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <span className="text-sm font-medium text-ink group-hover:text-green-800">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HowItWorks() {
  const steps = tList<{ title: string; body: string }>("home.howSteps");
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-card bg-paper p-6 ps-14">
          <span
            aria-hidden="true"
            className="absolute left-5 top-6 flex size-7 items-center justify-center rounded-full bg-green-800 font-display text-sm text-ivory"
          >
            {i + 1}
          </span>
          <h3 className="font-sans text-base font-semibold">{s.title}</h3>
          <p className="mt-1.5 text-sm text-ink-soft">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

async function Occasions() {
  const occasions = await getOccasions();
  return (
    <ul className="flex flex-wrap gap-3">
      {occasions.map((o) => (
        <li key={o.id}>
          <Link
            href={`/occasions/${o.slug}`}
            className="inline-flex items-center rounded-pill border border-line-strong bg-paper px-4 py-2 text-[15px] font-medium text-ink hover:border-green-500 hover:bg-green-050 hover:text-green-800"
          >
            {o.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section className="pt-4">
        <SectionHeading title={t("home.categoriesTitle")} />
        <Categories />
      </Section>

      <Section className="bg-paper/60">
        <SectionHeading title={t("home.featuredTitle")} action={{ href: "/gifts", label: t("home.featuredAll") }} />
        <Suspense fallback={<ProductGridSkeleton />}>
          <FeaturedGifts />
        </Suspense>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
          <div>
            <h2>{t("home.giftCardsTitle")}</h2>
            <p className="mt-3 text-ink-soft">{t("home.giftCardsBody")}</p>
            <ButtonLink href="/gift-cards" variant="secondary" className="mt-6">
              {t("home.giftCardsCta")}
            </ButtonLink>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={3} />}>
            <FeaturedGiftCards />
          </Suspense>
        </div>
      </Section>

      <Section id="how" className="bg-green-050">
        <SectionHeading title={t("home.howTitle")} />
        <HowItWorks />
      </Section>

      <Section>
        <SectionHeading title={t("home.occasionsTitle")} action={{ href: "/occasions", label: t("occasions.all") }} />
        <Occasions />
      </Section>
    </>
  );
}
