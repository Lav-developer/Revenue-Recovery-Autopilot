import { z } from "zod";
import type { NormalizedRevenueEvent } from "./types";

const rawEventSchema = z.object({
  merchantId: z.string().min(1), customerId: z.string().min(1),
  type: z.enum(["PAYMENT_FAILED", "CHECKOUT_ABANDONED", "SUBSCRIPTION_PAYMENT_FAILED", "INVOICE_OVERDUE"]),
  sourceId: z.string().min(1),
  amountMinor: z.union([z.bigint(), z.number().int().nonnegative(), z.string().regex(/^\d+$/)]),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  occurredAt: z.coerce.date(), idempotencyKey: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export function normalizeRevenueEvent(input: unknown): NormalizedRevenueEvent {
  const parsed = rawEventSchema.parse(input);
  const amountMinor = typeof parsed.amountMinor === "bigint" ? parsed.amountMinor : BigInt(parsed.amountMinor);
  return { ...parsed, amountMinor, payload: parsed.payload };
}
