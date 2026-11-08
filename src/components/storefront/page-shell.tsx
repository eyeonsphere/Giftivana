import type { ReactNode } from "react";
import { Section } from "@/components/storefront/section";
import { Notice } from "@/components/ui/notice";
import { t } from "@/lib/i18n";

/** Layout for text pages (About, FAQ, legal). `draft` adds the review notice. */
export function PageShell({ title, intro, draft, children }: { title: string; intro?: string; draft?: boolean; children: ReactNode }) {
  return (
    <Section>
      <div className="ev-prose">
        <h1>{title}</h1>
        {intro && <p className="mt-3 text-lg text-ink-soft">{intro}</p>}
        {draft && (
          <Notice tone="warn" className="mt-6">
            {t("common.draft")}
          </Notice>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </Section>
  );
}
