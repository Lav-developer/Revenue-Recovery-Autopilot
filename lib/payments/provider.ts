import type { DomainAction } from "@/lib/recovery/types";

export type PaymentOutcome = "PAYMENT_RECOVERED" | "PAYMENT_FAILED" | "PAYMENT_LINK_CREATED";
export interface PaymentActionResult {
  success: boolean;
  action: "RETRY_PAYMENT" | "CREATE_PAYMENT_LINK";
  provider: string;
  providerReference: string;
  outcome?: PaymentOutcome;
  amountRecoveredMinor: bigint;
  metadata: Record<string, unknown>;
}
export interface RetryPaymentInput { merchantId: string; customerId: string; sourceId: string; amountMinor: bigint; currency: string; metadata?: Record<string, unknown>; }
export interface CreatePaymentLinkInput extends RetryPaymentInput { description?: string; }
export interface PaymentProvider {
  readonly providerName: string;
  retryPayment(input: RetryPaymentInput): Promise<PaymentActionResult>;
  createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentActionResult>;
}
export class PaymentProviderError extends Error { constructor(message: string, public readonly code: "UNAVAILABLE" | "TIMEOUT" | "FAILED" = "FAILED") { super(message); this.name = "PaymentProviderError"; } }
export function isPaymentAction(action: DomainAction): action is "RETRY_PAYMENT" | "CREATE_PAYMENT_LINK" { return action === "RETRY_PAYMENT" || action === "CREATE_PAYMENT_LINK"; }
