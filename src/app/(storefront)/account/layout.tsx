import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/helpers";
import { Section } from "@/components/storefront/section";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <Section>
      <div className="flex flex-col gap-8 md:flex-row">
        <AccountNav />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </Section>
  );
}
