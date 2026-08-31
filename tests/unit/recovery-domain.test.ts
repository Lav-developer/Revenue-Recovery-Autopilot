import { describe, expect, it } from "vitest";
import { normalizeRevenueEvent } from "@/lib/recovery/normalization";
import { calculateRecoveryScore } from "@/lib/recovery/scoring";
import { calculateExpectedRecoveryValue, probabilityToBasisPoints } from "@/lib/recovery/expected-value";
import { evaluatePolicy } from "@/lib/recovery/policies";
import { evaluateStoppingRules } from "@/lib/recovery/stopping-rules";
import { transitionCase } from "@/lib/recovery/state-machine";
import { attributeRecoveredRevenue } from "@/lib/recovery/attribution";
import type { PolicyConfig, RecoveryCaseSnapshot } from "@/lib/recovery/types";

const policy: PolicyConfig = { maxAttempts: 3, maxContacts: 3, cooldownHours: 24, highValueThresholdMinor: 5_000_000n, minimumRecoveryScore: 0.25, afterMaximumAttempts: "STOP", afterMaximumContacts: "STOP", supportedActions: ["RETRY_PAYMENT", "CREATE_PAYMENT_LINK", "SEND_REMINDER"] };
const base: RecoveryCaseSnapshot = { id: "case_1", merchantId: "m_1", customerId: "c_1", status: "ELIGIBLE", sourceType: "PAYMENT_FAILED", sourceId: "p_1", amountAtRiskMinor: 499900n, currency: "INR", attemptCount: 0, contactCount: 0, lastContactAt: null, nextActionAt: null, recoveredAmountMinor: 0n, recoveryScore: 0.8, customerOptedOut: false, paymentAlreadySuccessful: false, escalated: false };
const now = new Date("2026-01-01T12:00:00Z");

function result(overrides: Partial<RecoveryCaseSnapshot> = {}) { return { ...base, ...overrides }; }

describe("normalization", () => {
  it("normalizes amount to BigInt and currency", () => { const event = normalizeRevenueEvent({ merchantId: "m", customerId: "c", type: "PAYMENT_FAILED", sourceId: "p", amountMinor: "499900", currency: "inr", occurredAt: "2026-01-01", idempotencyKey: "x" }); expect(event.amountMinor).toBe(499900n); expect(event.currency).toBe("INR"); });
  it("rejects negative amounts", () => { expect(() => normalizeRevenueEvent({ merchantId: "m", customerId: "c", type: "PAYMENT_FAILED", sourceId: "p", amountMinor: -1, currency: "INR", occurredAt: now, idempotencyKey: "x" })).toThrow(); });
});

describe("policy and stopping rules", () => {
  it.each([
    ["paid", { paymentAlreadySuccessful: true }, "STOP", "ALREADY_PAID"],
    ["opted out", { customerOptedOut: true }, "STOP", "CUSTOMER_OPTED_OUT"],
    ["escalated", { escalated: true }, "ESCALATE", "ALREADY_ESCALATED"],
    ["attempt limit", { attemptCount: 3 }, "STOP", "MAX_ATTEMPTS"],
    ["contact limit", { contactCount: 3 }, "STOP", "MAX_CONTACTS"],
    ["high value", { amountAtRiskMinor: 5_000_000n }, "ESCALATE", "HIGH_VALUE"],
    ["unsupported", {}, "REJECT", "UNSUPPORTED_ACTION"],
    ["low score", { recoveryScore: 0.1 }, "STOP", "LOW_RECOVERY_PROBABILITY"],
  ])("handles %s", (_, overrides, outcome, ruleCode) => { const evaluated = evaluatePolicy(result(overrides), _ === "unsupported" ? "STOP" : "RETRY_PAYMENT", now, policy); expect(evaluated.outcome).toBe(outcome); expect(evaluated.ruleCode).toBe(ruleCode); });
  it("waits during cooldown and returns next allowed time", () => { const last = new Date("2026-01-01T00:00:00Z"); const evaluated = evaluatePolicy(result({ lastContactAt: last }), "RETRY_PAYMENT", now, policy); expect(evaluated.outcome).toBe("WAIT"); expect(evaluated.ruleCode).toBe("COOLDOWN"); expect(evaluated.nextAllowedAt?.toISOString()).toBe("2026-01-02T00:00:00.000Z"); });
  it("is repeatable and stops an already stopped case", () => { const evaluated = evaluatePolicy(result({ status: "STOPPED" }), "RETRY_PAYMENT", now, policy); expect(evaluated.outcome).toBe("STOP"); expect(evaluateStoppingRules(result({ status: "STOPPED" }), policy).shouldStop).toBe(true); });
  it("uses escalation when configured for conflicting limits", () => { const evaluated = evaluatePolicy(result({ attemptCount: 3, amountAtRiskMinor: 5_000_000n }), "RETRY_PAYMENT", now, { ...policy, afterMaximumAttempts: "ESCALATE" }); expect(evaluated.ruleCode).toBe("MAX_ATTEMPTS"); expect(evaluated.outcome).toBe("ESCALATE"); });
});

describe("score and expected value", () => {
  it("uses documented weights and exposes factor explanations", () => { const score = calculateRecoveryScore({ successfulPayments: 8, totalPayments: 10, daysSinceLastSuccessfulPayment: 10, failureRecoverability: 0.8, customerValue: 0.7, engagement: 0.6 }); expect(score.score).toBeCloseTo(0.77, 2); expect(score.factors.historicalSuccess).toBe(0.8); expect(score.explanations.engagement).toContain("60%"); });
  it("calculates expected value with BigInt basis points", () => { expect(calculateExpectedRecoveryValue({ amountAtRiskMinor: 500000n, recoveryProbabilityBasisPoints: 6000n, actionSuccessProbabilityBasisPoints: 7200n })).toBe(216000n); expect(probabilityToBasisPoints(0.6)).toBe(6000n); });
  it("handles zero and very large amounts without floating point", () => { expect(calculateExpectedRecoveryValue({ amountAtRiskMinor: 0n, recoveryProbabilityBasisPoints: 10000n, actionSuccessProbabilityBasisPoints: 10000n })).toBe(0n); expect(calculateExpectedRecoveryValue({ amountAtRiskMinor: 9_000_000_000_000_000_000n, recoveryProbabilityBasisPoints: 10000n, actionSuccessProbabilityBasisPoints: 10000n })).toBe(9_000_000_000_000_000_000n); });
});

describe("state transitions and attribution", () => {
  it("allows valid transitions", () => { expect(transitionCase("OPEN", "ELIGIBLE")).toBe("ELIGIBLE"); expect(transitionCase("PROCESSING", "AWAITING_OUTCOME")).toBe("AWAITING_OUTCOME"); expect(transitionCase("RECOVERED", "RESOLVED")).toBe("RESOLVED"); });
  it("rejects invalid transitions", () => { expect(() => transitionCase("RESOLVED", "ELIGIBLE")).toThrow("Invalid recovery case transition"); expect(() => transitionCase("OPEN", "RECOVERED")).toThrow(); });
  it("attributes only successful outcomes and caps at amount at risk", () => { expect(attributeRecoveredRevenue({ amountAtRiskMinor: 1000n, alreadyAttributedMinor: 200n, outcomeAmountMinor: 1000n, outcomeIsSuccessful: true })).toBe(800n); expect(attributeRecoveredRevenue({ amountAtRiskMinor: 1000n, alreadyAttributedMinor: 0n, outcomeAmountMinor: 500n, outcomeIsSuccessful: false })).toBe(0n); expect(attributeRecoveredRevenue({ amountAtRiskMinor: 1000n, alreadyAttributedMinor: 1000n, outcomeAmountMinor: 500n, outcomeIsSuccessful: true })).toBe(0n); });
});
