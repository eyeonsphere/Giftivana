/**
 * Payment provider abstraction.
 *
 * Each provider knows how to create a payment record and (optionally)
 * process it immediately. The checkout flow calls the provider returned
 * by the registry; the provider inserts the row and returns the outcome.
 */

export interface PaymentIntent {
  orderId: string;
  amountMinor: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status: "paid" | "pending" | "failed";
  providerReference?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  mode: "demo" | "manual" | "live";
  /** Create a payment record and process it. */
  processPayment(intent: PaymentIntent): Promise<PaymentResult>;
  /** Whether this provider is currently available. */
  isAvailable(): boolean;
}
