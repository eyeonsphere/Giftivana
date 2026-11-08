"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { setDestination } from "@/lib/destination/actions";
import { t } from "@/lib/i18n";
import type { City, Country } from "@/types/domain";

interface Props {
  countries: Country[];
  cities: City[];
  initialCountry?: string;
  initialCity?: string;
  redirectTo?: string;
  compact?: boolean;
}

function SubmitButton({ compact, disabled }: { compact?: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={compact ? "md" : "lg"} loading={pending} disabled={disabled} className={compact ? "" : "w-full sm:w-auto"}>
      {t("destination.set")}
    </Button>
  );
}

/**
 * Country → city picker. Submits to a Server Action that validates the city
 * against the catalog and stores it in an httpOnly cookie.
 * Works without JavaScript (plain form POST); with JS it shows pending state.
 */
export function DestinationForm({ countries, cities, initialCountry, initialCity, redirectTo, compact }: Props) {
  const id = useId();
  const [country, setCountry] = useState(initialCountry ?? countries[0]?.code ?? "");
  const [city, setCity] = useState(initialCity ?? "");

  const cityOptions = cities.filter((c) => c.countryCode === country);
  const resolvedCity = cityOptions.some((c) => c.slug === city) ? city : (cityOptions[0]?.slug ?? "");

  return (
    <form
      action={setDestination}
      className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}
    >
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/gifts"} />
      <Select id={`${id}-country`} label={t("destination.country")} name="country" value={country} onChange={(e) => setCountry(e.target.value)}>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        id={`${id}-city`}
        label={t("destination.city")}
        name="city"
        value={resolvedCity}
        onChange={(e) => setCity(e.target.value)}
        disabled={cityOptions.length === 0}
      >
        {cityOptions.length === 0 && <option value="">{t("destination.choose")}</option>}
        {cityOptions.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>
      <div className={compact ? "" : "sm:col-span-2"}>
        <SubmitButton compact={compact} disabled={!resolvedCity} />
      </div>
    </form>
  );
}
