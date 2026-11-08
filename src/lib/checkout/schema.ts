/**
 * Checkout validation schemas.
 *
 * Every field submitted by the client is validated server-side before
 * create_order touches the database. The client sends intent; the server
 * verifies it against the catalog and recomputes all prices.
 */
import { z } from "zod";

export const senderSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Valid email required"),
  phone: z.string().max(30).optional().default(""),
});

export const recipientSchema = z.object({
  name: z.string().min(1, "Recipient name is required").max(120),
  phone: z.string().min(5, "Recipient phone is required").max(30),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().max(200).optional().default(""),
  addressLine2: z.string().max(200).optional().default(""),
  landmark: z.string().max(200).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});

export const checkoutLineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  denominationId: z.string().uuid().nullable(),
  quantity: z.number().int().min(1).max(10),
  giftMessage: z.string().max(300).default(""),
});

export const checkoutSchema = z.object({
  sender: senderSchema,
  recipient: recipientSchema,
  citySlug: z.string().min(1),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  giftMessage: z.string().max(300).default(""),
  lines: z.array(checkoutLineSchema).min(1, "Cart is empty"),
  paymentProvider: z.string().min(1).default("demo"),
  idempotencyKey: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SenderInput = z.infer<typeof senderSchema>;
export type RecipientInput = z.infer<typeof recipientSchema>;
