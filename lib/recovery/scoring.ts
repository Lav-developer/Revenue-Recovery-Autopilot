import type { RecoveryScoreFactors, RecoveryScoreResult } from "./types";

export interface ScoringInput {
  successfulPayments: number;
  totalPayments: number;
  daysSinceLastSuccessfulPayment: number | null;
  failureRecoverability: number;
  customerValue: number;
  engagement: number;
  previousRecoverySuccesses?: number;
  attemptCount?: number;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function calculateRecoveryScore(input: ScoringInput): RecoveryScoreResult {
  const historicalSuccess = input.totalPayments > 0 ? clamp(input.successfulPayments / input.totalPayments) : 0;
  const recency = input.daysSinceLastSuccessfulPayment === null ? 0 : clamp(1 - input.daysSinceLastSuccessfulPayment / 90);
  const failureRecoverability = clamp(input.failureRecoverability);
  const customerValue = clamp(input.customerValue);
  const engagement = clamp(input.engagement);
  const base = 0.30 * historicalSuccess + 0.20 * recency + 0.20 * failureRecoverability + 0.15 * customerValue + 0.15 * engagement;
  const adjustment = 0.02 * (input.previousRecoverySuccesses ?? 0) - 0.03 * (input.attemptCount ?? 0);
  const score = clamp(Number((base + adjustment).toFixed(6)));
  const factors: RecoveryScoreFactors = { historicalSuccess, recency, failureRecoverability, customerValue, engagement };
  return {
    score, factors,
    explanations: {
      historicalSuccess: `${input.successfulPayments} of ${input.totalPayments} historical payments succeeded.`,
      recency: input.daysSinceLastSuccessfulPayment === null ? "No prior successful payment recency is available." : `Last successful payment was ${input.daysSinceLastSuccessfulPayment} days ago.`,
      failureRecoverability: `The failure category has a ${Math.round(failureRecoverability * 100)}% recoverability estimate.`,
      customerValue: `Customer value factor is ${Math.round(customerValue * 100)}%.`,
      engagement: `Recent engagement factor is ${Math.round(engagement * 100)}%.`,
    },
  };
}
