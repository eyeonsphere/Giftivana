import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentDestination } from "@/lib/destination/server";
import { getCurrencies, getDeliverySettings } from "@/lib/catalog/queries";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageShell } from "@/components/storefront/page-shell";


export const metadata = { title: "Checkout — Giftivana" };

async function CheckoutLoader() {
  const destination = await getCurrentDestination();
  if (!destination) redirect("/");

  const [settings, currencies] = await Promise.all([
    getDeliverySettings(destination.city.id),
    getCurrencies(),
  ]);

  if (!settings) redirect("/");

  // Payment providers available (determined server-side)
  const providers: { name: string; label: string; description: string }[] = [];

  if (
    process.env.PAYMENTS_DEMO_ENABLED === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    providers.push({
      name: "demo",
      label: "Demo payment",
      description:
        "Instant approval — for testing only. No real money is charged.",
    });
  }

  providers.push({
    name: "manual",
    label: "Bank transfer / manual",
    description:
      "Place your order now and pay by bank transfer. We will confirm once payment is received.",
  });

  return (
    <CheckoutForm
      destination={destination}
      deliverySettings={settings}
      currencies={currencies}
      providers={providers}
    />
  );
}

export default function CheckoutPage() {
  return (
    <PageShell title="Checkout" intro="">
      <Suspense
        fallback={
          <div className="flex justify-center py-12 text-ink/40">
            Loading checkout…
          </div>
        }
      >
        <CheckoutLoader />
      </Suspense>
    </PageShell>
  );
}
