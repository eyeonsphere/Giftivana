import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DestinationGate } from "@/components/storefront/destination-gate";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState, Section, SectionHeading } from "@/components/storefront/section";
import { ButtonLink } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getCurrencyMap, getOccasionBySlug, getOccasions, listProducts } from "@/lib/catalog/queries";
import { getCurrentDestination } from "@/lib/destination/server";
import { t } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("occasions")
    .select("slug")
    .eq("is_active", true);
  return (data ?? []).map((o: { slug: string }) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasion = await getOccasionBySlug((await params).slug);
  return { title: occasion ? occasion.name : t("common.notFoundTitle") };
}

async function OccasionProducts({ slug }: { slug: string }) {
  const [destination, currencies] = await Promise.all([getCurrentDestination(), getCurrencyMap()]);
  if (!destination) return <DestinationGate redirectTo={`/occasions/${slug}`} />;

  const [gifts, cards] = await Promise.all([
    listProducts({ type: "physical", cityId: destination.city.id, occasionSlug: slug }),
    listProducts({ type: "gift_card", cityId: destination.city.id, occasionSlug: slug }),
  ]);
  const all = [...gifts, ...cards];

  if (!all.length) {
    return (
      <EmptyState title={t("catalog.emptyTitle")} body={t("catalog.emptyBody")}>
        <ButtonLink href="/gifts" variant="secondary">
          {t("nav.gifts")}
        </ButtonLink>
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {all.map((p) => (
        <ProductCard key={p.id} product={p} currencies={currencies} />
      ))}
    </div>
  );
}

export default async function OccasionPage({ params }: Props) {
  const { slug } = await params;
  const occasion = await getOccasionBySlug(slug);
  if (!occasion) notFound();

  return (
    <Section>
      <SectionHeading as="h1" title={occasion.name} intro={occasion.description} action={{ href: "/occasions", label: t("occasions.all") }} />
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <OccasionProducts slug={slug} />
      </Suspense>
    </Section>
  );
}
