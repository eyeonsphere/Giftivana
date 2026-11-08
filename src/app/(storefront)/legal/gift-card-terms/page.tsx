import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";

export const metadata: Metadata = { title: "Gift-card terms" };

export default function LegalPage() {
  return (
    <PageShell title="Gift-card terms" draft>
      <p>
        This placeholder outlines what gift-card terms will need to cover: that cards are issued by the partner store and subject to the store's own terms,
        Evernear's role as purchaser and arranger only, face value and the separately stated purchase price, no cash redemption or reloading, expiry, lost or
        stolen cards, how codes are delivered and who is responsible once delivered, and dispute handling. Each partner's written agreement determines the final
        terms shown for that partner's cards.
      </p>
    </PageShell>
  );
}
