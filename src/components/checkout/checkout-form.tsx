"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { formatMoney } from "@/lib/money";
import { getAvailableDates } from "@/lib/delivery/dates";
import { displaySubtotalMinor } from "@/lib/cart/rules";
import { createOrder, type CheckoutResult } from "@/lib/checkout/actions";
import { CheckoutSection } from "./checkout-section";
import type { Currency, DeliverySettings, Destination } from "@/types/domain";

/* ---------- Types ---------- */

interface Provider {
  name: string;
  label: string;
  description: string;
}

interface CheckoutFormProps {
  destination: Destination;
  deliverySettings: DeliverySettings;
  currencies: Currency[];
  providers: Provider[];
}

type Step = "sender" | "recipient" | "delivery" | "message" | "review" | "payment";
const STEPS: Step[] = ["sender", "recipient", "delivery", "message", "review", "payment"];

/* ---------- Tiny form field ---------- */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

/* ---------- Main form ---------- */

export function CheckoutForm({
  destination,
  deliverySettings,
  currencies,
  providers,
}: CheckoutFormProps) {
  const router = useRouter();
  const { state: cart, clear: clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // Step management
  const [activeStep, setActiveStep] = useState<Step>("sender");
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Form state
  const [sender, setSender] = useState({ name: "", email: "", phone: "" });
  const [recipient, setRecipient] = useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    notes: "",
  });
  const [deliveryDate, setDeliveryDate] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(
    providers[0]?.name ?? "manual",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delivery dates
  const availableDates = useMemo(
    () => getAvailableDates(deliverySettings, destination.city.timezone),
    [deliverySettings, destination.city.timezone],
  );

  // Cart totals for display
  const subtotal = displaySubtotalMinor(cart);
  const deliveryFee = 0; // Computed server-side; show 0 or "calculated at checkout"

  function completeStep(step: Step) {
    setCompletedSteps((prev) => new Set([...prev, step]));
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1]);
  }

  function editStep(step: Step) {
    setActiveStep(step);
  }

  // Validation helpers
  function validateSender(): boolean {
    const errs: Record<string, string[]> = {};
    if (!sender.name.trim()) errs["sender.name"] = ["Name is required"];
    if (!sender.email.trim() || !/\S+@\S+\.\S+/.test(sender.email))
      errs["sender.email"] = ["Valid email required"];
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRecipient(): boolean {
    const errs: Record<string, string[]> = {};
    if (!recipient.name.trim()) errs["recipient.name"] = ["Name is required"];
    if (!recipient.phone.trim() || recipient.phone.length < 5)
      errs["recipient.phone"] = ["Phone is required (min 5 chars)"];
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const input = {
        sender,
        recipient,
        citySlug: destination.city.slug,
        deliveryDate,
        giftMessage,
        lines: cart.lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          denominationId: l.denominationId,
          quantity: l.quantity,
          giftMessage: l.giftMessage,
        })),
        paymentProvider: selectedProvider,
        idempotencyKey: crypto.randomUUID(),
      };

      const result: CheckoutResult = await createOrder(input);

      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      clearCart();

      const params = new URLSearchParams();
      if (result.accessToken) params.set("t", result.accessToken);
      router.push(
        `/orders/${result.orderNumber}${params.toString() ? `?${params}` : ""}`,
      );
    });
  }

  if (!cart.lines.length) {
    return (
      <div className="text-center py-12 text-ink/50">
        <p className="text-lg mb-2">Your cart is empty</p>
        <a href="/gifts" className="text-emerald-700 underline">
          Browse gifts
        </a>
      </div>
    );
  }

  const fmt = (minor: number, currency: string) =>
    formatMoney({ amountMinor: minor, currency }, currencies);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Destination banner */}
      <div className="rounded-card bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
        Delivering to <strong>{destination.city.name}</strong>,{" "}
        {destination.country.name}
      </div>

      {/* --- Step 1: Sender --- */}
      <CheckoutSection
        stepNumber={1}
        title="Your details"
        isActive={activeStep === "sender"}
        isComplete={completedSteps.has("sender")}
        summary={sender.name && sender.email ? `${sender.name} · ${sender.email}` : undefined}
        onEdit={() => editStep("sender")}
      >
        <div className="space-y-3">
          <Field label="Your name" required error={fieldErrors["sender.name"]?.[0]}>
            <input
              className={inputCls}
              value={sender.name}
              onChange={(e) => setSender({ ...sender, name: e.target.value })}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email" required error={fieldErrors["sender.email"]?.[0]}>
            <input
              className={inputCls}
              type="email"
              value={sender.email}
              onChange={(e) => setSender({ ...sender, email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              className={inputCls}
              type="tel"
              value={sender.phone}
              onChange={(e) => setSender({ ...sender, phone: e.target.value })}
              placeholder="+1 …"
            />
          </Field>
          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium hover:bg-ink/90"
            onClick={() => validateSender() && completeStep("sender")}
          >
            Continue
          </button>
        </div>
      </CheckoutSection>

      {/* --- Step 2: Recipient --- */}
      <CheckoutSection
        stepNumber={2}
        title="Recipient"
        isActive={activeStep === "recipient"}
        isComplete={completedSteps.has("recipient")}
        summary={recipient.name ? `${recipient.name} · ${recipient.phone}` : undefined}
        onEdit={() => editStep("recipient")}
      >
        <div className="space-y-3">
          <Field label="Recipient name" required error={fieldErrors["recipient.name"]?.[0]}>
            <input
              className={inputCls}
              value={recipient.name}
              onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
              placeholder="Who is this for?"
            />
          </Field>
          <Field label="Phone" required error={fieldErrors["recipient.phone"]?.[0]}>
            <input
              className={inputCls}
              type="tel"
              value={recipient.phone}
              onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
              placeholder="Recipient's phone number"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              className={inputCls}
              type="email"
              value={recipient.email}
              onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
            />
          </Field>
          <Field label="Address line 1">
            <input
              className={inputCls}
              value={recipient.addressLine1}
              onChange={(e) =>
                setRecipient({ ...recipient, addressLine1: e.target.value })
              }
              placeholder="Street, building"
            />
          </Field>
          <Field label="Address line 2">
            <input
              className={inputCls}
              value={recipient.addressLine2}
              onChange={(e) =>
                setRecipient({ ...recipient, addressLine2: e.target.value })
              }
            />
          </Field>
          <Field label="Landmark">
            <input
              className={inputCls}
              value={recipient.landmark}
              onChange={(e) =>
                setRecipient({ ...recipient, landmark: e.target.value })
              }
              placeholder="Near…"
            />
          </Field>
          <Field label="Delivery notes">
            <textarea
              className={inputCls + " resize-none"}
              rows={2}
              value={recipient.notes}
              onChange={(e) =>
                setRecipient({ ...recipient, notes: e.target.value })
              }
              placeholder="Ring the doorbell, ask for…"
            />
          </Field>
          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium hover:bg-ink/90"
            onClick={() => validateRecipient() && completeStep("recipient")}
          >
            Continue
          </button>
        </div>
      </CheckoutSection>

      {/* --- Step 3: Delivery date --- */}
      <CheckoutSection
        stepNumber={3}
        title="Delivery date"
        isActive={activeStep === "delivery"}
        isComplete={completedSteps.has("delivery")}
        summary={
          deliveryDate
            ? new Date(deliveryDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : undefined
        }
        onEdit={() => editStep("delivery")}
      >
        <div className="space-y-3">
          <p className="text-sm text-ink/60">
            Choose a delivery date. Orders placed before{" "}
            {deliverySettings.cutoffTime} ({destination.city.name} time) can be
            delivered in {deliverySettings.minLeadDays} days.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto">
            {availableDates.slice(0, 28).map((d) => {
              const dt = new Date(d + "T00:00:00");
              const isSelected = d === deliveryDate;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeliveryDate(d)}
                  className={`rounded-lg border px-2 py-2 text-center text-sm transition-colors ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-medium"
                      : "border-sand hover:border-emerald-300 text-ink/70"
                  }`}
                >
                  <div className="text-xs text-ink/40">
                    {dt.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div>
                    {dt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium hover:bg-ink/90 disabled:opacity-40"
            disabled={!deliveryDate}
            onClick={() => completeStep("delivery")}
          >
            Continue
          </button>
        </div>
      </CheckoutSection>

      {/* --- Step 4: Gift message --- */}
      <CheckoutSection
        stepNumber={4}
        title="Gift message"
        isActive={activeStep === "message"}
        isComplete={completedSteps.has("message")}
        summary={
          giftMessage
            ? giftMessage.length > 40
              ? giftMessage.slice(0, 40) + "…"
              : giftMessage
            : "No message"
        }
        onEdit={() => editStep("message")}
      >
        <div className="space-y-3">
          <p className="text-sm text-ink/60">
            Add a personal message. It will be included with the delivery.
          </p>
          <textarea
            className={inputCls + " resize-none"}
            rows={4}
            maxLength={300}
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Write something from the heart…"
          />
          <div className="text-right text-xs text-ink/40">
            {giftMessage.length}/300
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium hover:bg-ink/90"
            onClick={() => completeStep("message")}
          >
            Continue
          </button>
        </div>
      </CheckoutSection>

      {/* --- Step 5: Review --- */}
      <CheckoutSection
        stepNumber={5}
        title="Review order"
        isActive={activeStep === "review"}
        isComplete={completedSteps.has("review")}
        summary={
          subtotal
            ? `${cart.lines.length} item${cart.lines.length > 1 ? "s" : ""} · ${fmt(subtotal.amountMinor, subtotal.currency)}`
            : undefined
        }
        onEdit={() => editStep("review")}
      >
        <div className="space-y-4">
          {/* Line items */}
          <div className="divide-y divide-sand/50">
            {cart.lines.map((line) => (
              <div key={line.key} className="flex gap-3 py-3">
                {line.imagePath && (
                  <img
                    src={line.imagePath}
                    alt={line.name}
                    className="h-14 w-14 rounded-lg bg-ivory object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {line.name}
                  </p>
                  {line.variantName && (
                    <p className="text-xs text-ink/50">{line.variantName}</p>
                  )}
                  {line.faceValueLabel && (
                    <p className="text-xs text-ink/50">{line.faceValueLabel}</p>
                  )}
                  <p className="text-xs text-ink/50">Qty: {line.quantity}</p>
                </div>
                <p className="text-sm font-medium text-ink shrink-0">
                  {fmt(line.unitPriceMinor * line.quantity, line.currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-sand pt-3 space-y-1">
            {subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-ink/60">Subtotal</span>
                <span>{fmt(subtotal.amountMinor, subtotal.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Delivery fee</span>
              <span className="text-ink/50">Calculated next</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium hover:bg-ink/90"
            onClick={() => completeStep("review")}
          >
            Continue to payment
          </button>
        </div>
      </CheckoutSection>

      {/* --- Step 6: Payment --- */}
      <CheckoutSection
        stepNumber={6}
        title="Payment"
        isActive={activeStep === "payment"}
        isComplete={false}
      >
        <div className="space-y-4">
          {/* Provider selection */}
          <div className="space-y-2">
            {providers.map((p) => (
              <label
                key={p.name}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedProvider === p.name
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-sand hover:border-emerald-200"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.name}
                  checked={selectedProvider === p.name}
                  onChange={() => setSelectedProvider(p.name)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <p className="text-sm font-medium text-ink">{p.label}</p>
                  <p className="text-xs text-ink/50">{p.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Demo banner */}
          {selectedProvider === "demo" && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              This is a demo payment. No real money will be charged.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Place order */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="w-full rounded-lg bg-emerald-600 text-white py-3 text-base font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-wait"
          >
            {isPending ? "Placing order…" : "Place order"}
          </button>

          <p className="text-center text-xs text-ink/40">
            By placing this order you agree to our terms of service.
          </p>
        </div>
      </CheckoutSection>
    </div>
  );
}
