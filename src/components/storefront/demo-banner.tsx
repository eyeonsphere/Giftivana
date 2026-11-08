import { t } from "@/lib/i18n";

/**
 * Non-dismissable notice shown on every storefront page until the business
 * clears the launch requirements in docs/STAGE-1-PLAN.md §7. Stage 5 moves
 * the on/off switch into an admin setting.
 */
export function DemoBanner() {
  return (
    <div role="note" className="bg-green-900 text-ivory">
      <p className="ev-container py-2 text-center text-xs sm:text-sm">{t("demo.banner")}</p>
    </div>
  );
}
