import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageShell title="Contact" intro="Questions about an order, a destination, or becoming a partner store.">
      <p>A contact form and support inbox are set up in a later build stage. Until then, this page is a placeholder.</p>
      <h2>Order questions</h2>
      <p>Have your order reference ready (it starts with EV-). You'll find it on your confirmation page and in your account.</p>
      <h2>Partner stores and florists</h2>
      <p>If you run a shop, bakery or florist in a city we serve and want to be listed, we'd like to hear from you.</p>
    </PageShell>
  );
}
