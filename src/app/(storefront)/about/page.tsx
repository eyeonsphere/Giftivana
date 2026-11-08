import type { Metadata } from "next";
import { PageShell } from "@/components/storefront/page-shell";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell title="About Evernear" intro="Evernear exists for the moments you can't be in the room for.">
      <p>
        Many of us live far from the people we grew up with. Birthdays, Eid, a new baby, a hard week — these keep happening whether or not we can be there.
        Evernear is a way to show up anyway: a bouquet that arrives on the right morning, a cake with your words on it, or a store gift card so someone can
        choose what they actually need.
      </p>
      <h2>What we do</h2>
      <p>
        You pick a destination city, choose from gifts that local partners can actually make and deliver there, write a message, and tell us when it should
        arrive. We arrange the rest and keep you updated.
      </p>
      <h2>What we're careful about</h2>
      <ul>
        <li>We only show gifts that can be delivered to the city you've chosen.</li>
        <li>
          Gift cards are bought here and redeemed at the partner store. Face value is shown in the store's currency; the price you pay is shown separately, in
          yours.
        </li>
        <li>We don't invent partnerships. Stores and delivery areas appear here only once agreements are in place.</li>
      </ul>
      <h2>Where we are now</h2>
      <p>
        Evernear is in development. The stores, cities and products you see are placeholders used to build and test the experience. Nothing on this site is a
        confirmed service yet.
      </p>
    </PageShell>
  );
}
