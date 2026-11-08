import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";

export const metadata: Metadata = { title: "Terms of service" };

export default function LegalPage() {
  return (
    <PageShell title="Terms of service" draft>
      <p>{`This placeholder outlines what Evernear's terms of service will need to cover: who may place orders, how orders are accepted and when a contract is formed, pricing and currency, delivery commitments and their limits, substitutions, cancellation and refund rules, acceptable use of gift messages, limitation of liability, and governing law. These terms must be drafted and reviewed by counsel before any real transactions take place.`}</p>
    </PageShell>
  );
}
