"use client";

import { useEffect } from "react";
import { Section } from "@/components/storefront/section";
import { Button, ButtonLink } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Stage 6 wires this to error reporting. Never log request bodies or PII here.
    console.error(error);
  }, [error]);

  return (
    <Section>
      <div className="mx-auto max-w-lg text-center" role="alert">
        <h1>{t("common.errorTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("common.errorBody")}</p>
        {error.digest && <p className="mt-2 text-xs text-ink-muted">Reference: {error.digest}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>{t("common.tryAgain")}</Button>
          <ButtonLink href="/" variant="secondary">
            {t("common.goHome")}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
