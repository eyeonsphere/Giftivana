import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";
import { getCities, getDeliverySettings, getDestinationCountries } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Delivery information" };

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function DeliveryPage() {
  const [countries, cities] = await Promise.all([getDestinationCountries(), getCities()]);
  const settings = await Promise.all(cities.map((c) => getDeliverySettings(c.id)));

  return (
    <PageShell title="Delivery information" intro="How delivery dates, timing and fees work.">
      <h2>Destinations</h2>
      <p>
        Delivery is arranged city by city with local partners. The cities below are demo destinations used during development; confirmed coverage will replace
        them.
      </p>
      <ul>
        {cities.map((city, i) => {
          const s = settings[i];
          const country = countries.find((c) => c.code === city.countryCode)?.name;
          return (
            <li key={city.id}>
              <strong>
                {city.name}, {country}
              </strong>
              {s && (
                <>
                  {" "}
                  — delivery {s.deliveryDays.map((d) => dayNames[d]).join(", ")}; order at least {s.minLeadDays} days ahead and up to {s.maxAdvanceDays} days in
                  advance; same-day cutoff {s.cutoffTime} local time.
                </>
              )}
            </li>
          );
        })}
      </ul>
      <h2>Choosing a date</h2>
      <p>
        You pick the delivery date at checkout. The calendar follows the destination city's local time and only offers dates that city can deliver on. Each gift
        may add its own lead time, shown on the product page.
      </p>
      <h2>Delivery fees</h2>
      <p>
        Fees depend on the delivery zone within the city and are shown in full before you pay. Gift cards delivered digitally or arranged by our team have no
        courier fee.
      </p>
      <h2>Gift cards</h2>
      <p>
        Store gift cards are not couriered like a bouquet. Depending on the store, the recipient gets a code, a physical card, or a voucher arranged by our
        team. The gift-card page explains which applies and how long it takes.
      </p>
      <h2>What we can't promise yet</h2>
      <p>Evernear is in development. Delivery times, coverage and fees shown here are illustrative and will be confirmed once local partners are in place.</p>
    </PageShell>
  );
}
