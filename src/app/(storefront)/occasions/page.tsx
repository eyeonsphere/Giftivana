import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/storefront/section";
import { getOccasions } from "@/lib/catalog/queries";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("occasions.title") };

export default async function OccasionsPage() {
  const occasions = await getOccasions();
  return (
    <Section>
      <SectionHeading as="h1" title={t("home.occasionsTitle")} />
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {occasions.map((o) => (
          <li key={o.id}>
            <Link
              href={`/occasions/${o.slug}`}
              className="group flex h-full flex-col rounded-card border border-line bg-paper p-3 hover:border-green-200 hover:shadow-card"
            >
              <span className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-ivory-deep">
                <Image src={o.imagePath} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
              </span>
              <span className="mt-3 px-1 font-sans text-base font-semibold text-ink group-hover:text-green-800">{o.name}</span>
              <span className="mt-1 px-1 pb-1 text-sm text-ink-soft">{o.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
