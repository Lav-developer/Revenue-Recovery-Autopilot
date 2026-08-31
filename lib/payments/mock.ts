import type { PaymentActionResult, PaymentProvider, RetryPaymentInput, CreatePaymentLinkInput } from "./provider";

export type MockPaymentScenario = "SUCCESSFUL_RETRY" | "FAILED_RETRY" | "PAYMENT_LINK_CREATED" | "PAYMENT_LINK_PAID" | "PROVIDER_FAILURE" | "TIMEOUT";
export class MockPaymentProvider implements PaymentProvider {
  readonly providerName = "mock";
  constructor(private readonly scenario: MockPaymentScenario = "SUCCESSFUL_RETRY") {}
  async retryPayment(input: RetryPaymentInput): Promise<PaymentActionResult> {
    if (this.scenario === "PROVIDER_FAILURE") throw new Error("Mock payment provider failed.");
    if (this.scenario === "TIMEOUT") return new Promise((_, reject) => setTimeout(() => reject(new Error("Mock payment provider timed out.")), 5));
    const success = this.scenario === "SUCCESSFUL_RETRY";
    return { success, action: "RETRY_PAYMENT", provider: this.providerName, providerReference: `mock_retry_${input.sourceId}`, outcome: success ? "PAYMENT_RECOVERED" : "PAYMENT_FAILED", amountRecoveredMinor: success ? input.amountMinor : 0n, metadata: { scenario: this.scenario } };
  }
  async createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentActionResult> {
    if (this.scenario === "PROVIDER_FAILURE") throw new Error("Mock payment provider failed.");
    if (this.scenario === "TIMEOUT") return new Promise((_, reject) => setTimeout(() => reject(new Error("Mock payment provider timed out.")), 5));
    const paid = this.scenario === "PAYMENT_LINK_PAID";
    return { success: true, action: "CREATE_PAYMENT_LINK", provider: this.providerName, providerReference: `mock_link_${input.sourceId}`, outcome: paid ? "PAYMENT_RECOVERED" : "PAYMENT_LINK_CREATED", amountRecoveredMinor: paid ? input.amountMinor : 0n, metadata: { scenario: this.scenario, url: `https://mock.example/pay/${input.sourceId}` } };
  }
}
