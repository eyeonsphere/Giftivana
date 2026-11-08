import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { Currency, ProductSummary } from "@/types/domain";

export function ProductCard({ product, currencies }: { product: ProductSummary; currencies: Map<string, Currency> }) {
  const href = product.productType === "gift_card" ? `/gift-cards/${product.slug}` : `/gifts/${product.slug}`;
  const isCard = product.productType === "gift_card";

  return (
    <article className="group relative flex flex-col rounded-card border border-line bg-paper p-3 transition-shadow hover:shadow-card focus-within:shadow-card">
      <div className={`relative overflow-hidden rounded-[14px] bg-ivory-deep ${isCard ? "aspect-[8/5]" : "aspect-[4/3]"}`}>
        {product.image ? (
          <Image
            src={product.image.path}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">No image</div>
        )}
        {product.isDemo && (
          <Badge tone="gold" className="absolute left-2 top-2">
            {isCard ? t("demo.partnerBadge") : t("demo.productBadge")}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <p className="text-xs text-ink-muted">{isCard ? product.partnerName : product.categoryName}</p>
        <h3 className="mt-0.5 font-sans text-[15px] font-semibold leading-snug text-ink sm:text-base">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.shortDescription}</p>
        <p className="mt-auto pt-3 text-[15px] text-ink">
          <span className="text-ink-muted">{t("catalog.from")} </span>
          <span className="font-semibold">{formatMoney(product.fromPrice, currencies)}</span>
        </p>
      </div>
    </article>
  );
}
