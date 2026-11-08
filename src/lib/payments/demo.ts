/**
 * Demo payment provider — instant approval, development only.
 *
 * Gated by PAYMENTS_DEMO_ENABLED=true AND NODE_ENV !== 'production'.
 * Inserts a payment row with status 'paid' immediately.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentIntent, PaymentProvider, PaymentResult } from "./types";

function isDemoEnabled(): boolean {
  return (
    process.env.PAYMENTS_DEMO_ENABLED === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export const demoProvider: PaymentProvider = {
  name: "demo",
  mode: "demo",

  isAvailable(): boolean {
    return isDemoEnabled();
  },

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    if (!isDemoEnabled()) {
      return {
        success: false,
        status: "failed",
        error: "Demo payments are not enabled in this environment.",
      };
    }

    const reference = `demo_${Date.now()}`;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id: intent.orderId,
        provider: "demo",
        mode: "demo",
        status: "paid",
        amount_minor: intent.amountMinor,
        currency: intent.currency,
        provider_reference: reference,
        provider_payload: { demo: true, approved_at: new Date().toISOString() },
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        status: "failed",
        error: `Demo payment insert failed: ${error.message}`,
      };
    }

    return {
      success: true,
      paymentId: data.id,
      status: "paid",
      providerReference: reference,
    };
  },
};
