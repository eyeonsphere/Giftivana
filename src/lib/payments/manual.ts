/**
 * Manual payment provider — payment is recorded as pending and an admin
 * confirms receipt later via mark_payment_received().
 *
 * Always available. This is the default for the MVP until a live payment
 * processor is integrated.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentIntent, PaymentProvider, PaymentResult } from "./types";

export const manualProvider: PaymentProvider = {
  name: "manual",
  mode: "manual",

  isAvailable(): boolean {
    return true;
  },

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id: intent.orderId,
        provider: "manual",
        mode: "manual",
        status: "pending",
        amount_minor: intent.amountMinor,
        currency: intent.currency,
        provider_reference: null,
        provider_payload: { awaiting_confirmation: true },
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        status: "failed",
        error: `Manual payment insert failed: ${error.message}`,
      };
    }

    return {
      success: true,
      paymentId: data.id,
      status: "pending",
    };
  },
};
