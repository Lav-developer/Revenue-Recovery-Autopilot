import type { CreatePaymentLinkInput, PaymentActionResult, PaymentProvider, RetryPaymentInput } from "./provider";
import { PaymentProviderError } from "./provider";

export interface RazorpayConfig { keyId: string; keySecret: string; baseUrl?: string; fetchImpl?: typeof fetch; }
export class RazorpayProvider implements PaymentProvider {
  readonly providerName = "razorpay";
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  constructor(private readonly config: RazorpayConfig) { this.baseUrl = config.baseUrl ?? "https://api.razorpay.com/v1"; this.fetchImpl = config.fetchImpl ?? fetch; }
  async retryPayment(input: RetryPaymentInput): Promise<PaymentActionResult> {
    // Razorpay does not expose a generic retry operation for an arbitrary failed payment.
    // A fresh payment link is the safe provider-level equivalent for this action.
    return this.createPaymentLink({ ...input, description: "Revenue recovery payment retry" });
  }
  async createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentActionResult> {
    if (!this.config.keyId || !this.config.keySecret) throw new PaymentProviderError("Razorpay credentials are not configured.", "UNAVAILABLE");
    const response = await this.fetchImpl(`${this.baseUrl}/payment_links`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: input.amountMinor.toString(), currency: input.currency, description: input.description ?? "Revenue recovery payment", reference_id: input.sourceId, notes: { merchant_id: input.merchantId, customer_id: input.customerId } }) });
    if (!response.ok) throw new PaymentProviderError(`Razorpay payment link request failed with status ${response.status}.`, "FAILED");
    const body = await response.json() as { id?: string; short_url?: string };
    if (!body.id) throw new PaymentProviderError("Razorpay returned no payment-link reference.", "FAILED");
    return { success: true, action: "CREATE_PAYMENT_LINK", provider: this.providerName, providerReference: body.id, outcome: "PAYMENT_LINK_CREATED", amountRecoveredMinor: 0n, metadata: { shortUrl: body.short_url } };
  }
}
