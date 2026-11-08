import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";

export const metadata: Metadata = { title: "Privacy policy" };

export default function LegalPage() {
  return (
    <PageShell title="Privacy policy" draft>
      <p>{`This placeholder outlines what a privacy policy for Giftivana will need to cover: what personal data is collected from senders and recipients (names, phone numbers, addresses, messages), why it is collected (to deliver gifts and gift cards), how long it is kept, who it is shared with (local delivery and partner stores, only as needed to fulfil an order), how recipients' data is protected, and how to request access or deletion. Jurisdiction-specific requirements for each country Giftivana sells from and delivers to must be reviewed by counsel.`}</p>
    </PageShell>
  );
}
