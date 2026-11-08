"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { useCart } from "@/lib/cart/store";
import { MAX_GIFT_MESSAGE, MAX_QUANTITY, type CartLine } from "@/lib/cart/types";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { Currency, ProductDetail } from "@/types/domain";

interface Props {
  product: ProductDetail;
  currencies: [string, Currency][]; // Map is not serialisable across the RSC boundary
  destination: { cityId: string; cityName: string } | null;
  availableHere: boolean;
}

export function AddToCartForm({ product, currencies, destination, availableHere }: Props) {
  const id = useId();
  const cart = useCart();
  const currencyMap = new Map(currencies);
  const isGiftCard = product.productType === "gift_card";

  const variants = product.variants;
  const denominations = product.giftCard?.denominations ?? [];

  const [variantId, setVariantId] = useState(variants.find((v) => v.isDefault)?.id ?? variants[0]?.id ?? "");
  const [denominationId, setDenominationId] = useState(denominations[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" } | { kind: "added" } | { kind: "conflict"; line: CartLine }>({ kind: "idle" });

  const variant = variants.find((v) => v.id === variantId);
  const denomination = denominations.find((d) => d.id === denominationId);

  const unitPrice = isGiftCard
    ? denomination
      ? { amountMinor: denomination.chargePriceMinor, currency: denomination.chargeCurrency }
      : null
    : variant
      ? { amountMinor: variant.priceMinor, currency: variant.currency }
      : { amountMinor: product.basePriceMinor, currency: product.currency };

  const canSubmit = Boolean(destination && availableHere && unitPrice && (!isGiftCard || denomination) && (variants.length === 0 || variant));

  function buildLine(): CartLine | null {
    if (!destination || !unitPrice) return null;
    return {
      key: `${product.id}:${variantId || denominationId || "base"}`,
      productId: product.id,
      slug: product.slug,
      productType: product.productType,
      name: product.name,
      imagePath: product.images[0]?.path ?? null,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      denominationId: denomination?.id ?? null,
      faceValueLabel: denomination ? formatMoney({ amountMinor: denomination.faceValueMinor, currency: denomination.faceCurrency }, currencyMap) : null,
      unitPriceMinor: unitPrice.amountMinor,
      currency: unitPrice.currency,
      quantity,
      giftMessage: message.trim(),
      cityId: destination.cityId,
    };
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const line = buildLine();
    if (!line) return;
    const result = cart.add(line);
    setStatus(result.ok ? { kind: "added" } : { kind: "conflict", line });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {!destination && (
        <Notice tone="warn">
          {t("catalog.noDestinationTitle")}.{" "}
          <Link href="/#destination" className="font-medium underline">
            {t("destination.none")}
          </Link>
        </Notice>
      )}
      {destination && !availableHere && (
        <Notice tone="warn" title={t("product.notAvailableHere")}>
          {destination.cityName}.{" "}
          <Link href="/#destination" className="font-medium underline">
            {t("destination.change")}
          </Link>
        </Notice>
      )}

      {isGiftCard ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-soft">{t("giftCards.denominations")}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {denominations.map((d) => {
              const selected = d.id === denominationId;
              return (
                <label
                  key={d.id}
                  className={`flex cursor-pointer flex-col rounded-control border p-3 ${selected ? "border-green-700 bg-green-050" : "border-line-strong bg-paper hover:border-green-200"}`}
                >
                  <input type="radio" name="denomination" value={d.id} checked={selected} onChange={() => setDenominationId(d.id)} className="sr-only" />
                  <span className="text-xs text-ink-muted">{t("giftCards.faceValue")}</span>
                  <span className="font-semibold">{formatMoney({ amountMinor: d.faceValueMinor, currency: d.faceCurrency }, currencyMap)}</span>
                  <span className="mt-1 text-xs text-ink-muted">{t("giftCards.youPay")}</span>
                  <span className="text-sm">{formatMoney({ amountMinor: d.chargePriceMinor, currency: d.chargeCurrency }, currencyMap)}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-muted">{t("giftCards.facePriceNote")}</p>
        </fieldset>
      ) : (
        variants.length > 0 && (
          <Select id={`${id}-variant`} label={t("product.option")} value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {formatMoney({ amountMinor: v.priceMinor, currency: v.currency }, currencyMap)}
              </option>
            ))}
          </Select>
        )
      )}

      <Input
        id={`${id}-qty`}
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QUANTITY}
        label={t("product.quantity")}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Math.min(MAX_QUANTITY, Number(e.target.value) || 1)))}
        wrapperClassName="max-w-32"
      />

      <Textarea
        id={`${id}-msg`}
        label={t("product.giftMessage")}
        hint={`${t("product.giftMessageHint")} ${message.length}/${MAX_GIFT_MESSAGE}`}
        maxLength={MAX_GIFT_MESSAGE}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          {t("product.addToCart")}
          {unitPrice && (
            <span className="opacity-80">· {formatMoney({ amountMinor: unitPrice.amountMinor * quantity, currency: unitPrice.currency }, currencyMap)}</span>
          )}
        </Button>
        {status.kind === "added" && (
          <span role="status" className="text-sm text-ok">
            {t("product.added")} ·{" "}
            <Link href="/cart" className="font-medium underline">
              {t("nav.cart")}
            </Link>
          </span>
        )}
      </div>

      {status.kind === "conflict" && (
        <Notice tone="warn" live="assertive" title={t("cart.conflictTitle")}>
          <p>{t("cart.conflictBody", { city: destination?.cityName ?? "" })}</p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                cart.replaceWith(status.line);
                setStatus({ kind: "added" });
              }}
            >
              {t("cart.startNew")}
            </Button>
            <ButtonLink href="/cart" size="sm" variant="secondary">
              {t("cart.viewCurrent")}
            </ButtonLink>
          </div>
        </Notice>
      )}
    </form>
  );
}
