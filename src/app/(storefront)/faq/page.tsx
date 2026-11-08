import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";

export const metadata: Metadata = { title: "FAQ" };

const faqs: Array<[string, string]> = [
  [
    "Which cities can you deliver to?",
    "Only the cities listed in the destination selector. Each gift shows where it can be delivered, and you'll only see gifts available in the city you've chosen. During development the cities shown are demo destinations, not confirmed coverage.",
  ],
  [
    "Can I send gifts to two different people in one order?",
    "Not yet. Each order goes to one recipient, in one city, on one delivery date. Place a second order for another person.",
  ],
  [
    "How do store gift cards work?",
    "You buy the card here and the recipient uses it at the partner store. The card's value is shown in the store's local currency, and the amount you pay is shown separately in your currency. Depending on the store, the recipient receives a code, a physical card, or a voucher arranged by our team.",
  ],
  [
    "Does the recipient need an address for a gift card?",
    "Only if the card is delivered physically. For a digital code or a hand-arranged voucher, a phone number or email is enough. Checkout only asks for what the gift actually needs.",
  ],
  [
    "Can I choose the delivery date?",
    "Yes. At checkout you'll pick a date from the dates the destination city can deliver on. Some gifts need a day or two of notice; the product page says how much.",
  ],
  [
    "How do I pay?",
    "A payment provider hasn't been selected yet. During development there is a clearly labelled demo payment for testing, and an option for our team to confirm a payment manually. No real money moves on this site today.",
  ],
  ["How will I know the gift arrived?", "Your order page shows a timeline from order placed to delivered, with payment and delivery status shown separately."],
];

export default function FaqPage() {
  return (
    <PageShell title="Frequently asked questions">
      <div className="divide-y divide-line">
        {faqs.map(([q, a]) => (
          <details key={q} className="group py-4">
            <summary className="cursor-pointer list-none font-sans text-base font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {q}
                <span aria-hidden="true" className="text-ink-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
