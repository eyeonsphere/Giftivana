import { DestinationForm } from "@/components/storefront/destination-form";
import { getCities, getDestinationCountries } from "@/lib/catalog/queries";
import { t } from "@/lib/i18n";

/** Shown on catalog pages when no destination has been chosen yet. */
export async function DestinationGate({ redirectTo }: { redirectTo: string }) {
  const [countries, cities] = await Promise.all([getDestinationCountries(), getCities()]);
  return (
    <div className="ev-tag mx-auto max-w-xl p-6 sm:p-8">
      <h2 className="pe-8 font-display text-2xl">{t("catalog.noDestinationTitle")}</h2>
      <p className="mt-2 text-ink-soft">{t("catalog.noDestinationBody")}</p>
      <div className="mt-5">
        <DestinationForm countries={countries} cities={cities} redirectTo={redirectTo} />
      </div>
      <p className="mt-4 text-xs text-ink-muted">{t("demo.destinationNote")}</p>
    </div>
  );
}
