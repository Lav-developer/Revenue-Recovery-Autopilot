import type { AgentContext } from "./context";
import type { AgentDecisionOutput } from "./schema";

export interface AgentProvider {
  readonly providerName: string;
  readonly modelName?: string;
  generateDecision(input: AgentContext): Promise<unknown>;
}

export class AgentProviderError extends Error {
  constructor(message: string, public readonly code: "TIMEOUT" | "UNAVAILABLE" | "MALFORMED_OUTPUT" = "UNAVAILABLE") { super(message); this.name = "AgentProviderError"; }
}

export class UnavailableAgentProvider implements AgentProvider {
  readonly providerName = "unconfigured";
  readonly modelName = undefined;
  async generateDecision(input: AgentContext): Promise<unknown> { void input; throw new AgentProviderError("No external LLM provider is configured.", "UNAVAILABLE"); }
}

export class DeterministicTestProvider implements AgentProvider {
  readonly providerName = "deterministic-test";
  readonly modelName = "rule-fixture-v1";
  async generateDecision(input: AgentContext): Promise<AgentDecisionOutput> {
    const highValue = input.amountAtRiskMinor >= input.policy.highValueThresholdMinor;
    const action = highValue ? "escalate_case" : input.failureReason === "expired_card" ? "create_payment_link" : input.eventType === "CHECKOUT_ABANDONED" ? "send_recovery_message" : input.attemptCount > 0 ? "send_reminder" : "retry_payment";
    const diagnosis = input.failureReason === "expired_card" || input.failureReason === "insufficient_funds" || input.failureReason === "bank_declined" || input.failureReason === "network_error" ? input.failureReason : input.eventType === "CHECKOUT_ABANDONED" ? "checkout_abandonment" : input.eventType === "SUBSCRIPTION_PAYMENT_FAILED" ? "subscription_payment_failure" : input.eventType === "INVOICE_OVERDUE" ? "overdue_invoice" : "unknown";
    const escalate = highValue;
    return { case_id: input.caseId, diagnosis: { category: diagnosis, confidence: highValue ? 0.98 : 0.86 }, decision: { action, reason: highValue ? "Amount at risk requires human review." : "Selected from deterministic case context and failure category.", expected_recovery_value_minor: 0n }, next_step: { type: escalate ? "human_review" : "await_outcome", cooldown_hours: input.policy.cooldownHours }, escalate };
  }
}

export interface RetryingProviderOptions { retries?: number; timeoutMs?: number; }
export class RetryingAgentProvider implements AgentProvider {
  constructor(private readonly inner: AgentProvider, private readonly options: RetryingProviderOptions = {}) {}
  get providerName() { return this.inner.providerName; }
  get modelName() { return this.inner.modelName; }
  async generateDecision(input: AgentContext): Promise<unknown> {
    const retries = this.options.retries ?? 1;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try { return await this.withTimeout(this.inner.generateDecision(input), this.options.timeoutMs ?? 10_000); } catch (error) { lastError = error; }
    }
    throw lastError instanceof Error ? lastError : new AgentProviderError("Agent provider failed.");
  }
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> { return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new AgentProviderError("Agent provider timed out.", "TIMEOUT")), timeoutMs))]); }
}

export function configuredAgentProvider(): AgentProvider {
  // External provider adapters are intentionally deferred to a later milestone.
  // The environment-selected entry point keeps orchestration provider-agnostic.
  switch (process.env.LLM_PROVIDER ?? "unconfigured") {
    case "unconfigured":
    default:
      return new UnavailableAgentProvider();
  }
}
