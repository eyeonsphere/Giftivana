import { DemoBanner } from "@/components/storefront/demo-banner";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { Section } from "@/components/storefront/section";
import { ButtonLink } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <>
      <DemoBanner />
      <Header />
      <main id="main" className="flex-1">
        <Section>
          <div className="mx-auto max-w-lg text-center">
            <h1>{t("common.notFoundTitle")}</h1>
            <p className="mt-3 text-ink-soft">{t("common.notFoundBody")}</p>
            <div className="mt-8 flex justify-center gap-3">
              <ButtonLink href="/">{t("common.goHome")}</ButtonLink>
              <ButtonLink href="/gifts" variant="secondary">
                {t("nav.gifts")}
              </ButtonLink>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
