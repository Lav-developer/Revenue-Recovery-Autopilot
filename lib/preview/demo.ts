import { aggregateExecutiveMetrics } from "@/lib/metrics/aggregation";
import { previewCases, previewInterventions, previewOutcomes } from "./data";
import { DEMO_RUN_ID } from "@/lib/evaluation/scenarios";

export function getPreviewDemoResult() {
  const metrics = aggregateExecutiveMetrics(previewCases, previewInterventions, previewOutcomes);
  return { runId: DEMO_RUN_ID, status: "COMPLETED", summary: { runId: DEMO_RUN_ID, status: "COMPLETED", casesProcessed: 4, casesEligible: 2, aiRecommendations: 4, allowedActions: 4, blockedActions: 2, escalations: 1, stoppedCases: 1, interventions: 2, successfulRecoveries: metrics.successfulRecoveries, recoveredAmountMinor: metrics.recoveredRevenueMinor, recoveryRate: metrics.recoveryRate, executionErrors: 0 }, scenarios: [{ name: "SUCCESSFUL_RETRY", caseId: "preview-retry", recommendation: "retry_payment", policyOutcome: "ALLOW", executedAction: "RETRY_PAYMENT", status: "RECOVERED", recoveredAmountMinor: 499900n }, { name: "PAYMENT_LINK_RECOVERY", caseId: "preview-link", recommendation: "create_payment_link", policyOutcome: "ALLOW", executedAction: "CREATE_PAYMENT_LINK", status: "AWAITING_OUTCOME", recoveredAmountMinor: 0n }, { name: "HIGH_VALUE_ESCALATION", caseId: "preview-high-value", recommendation: "create_payment_link", policyOutcome: "ESCALATE", executedAction: "ESCALATE", status: "ESCALATED", recoveredAmountMinor: 0n }, { name: "MAXIMUM_ATTEMPTS", caseId: "preview-attempts", recommendation: "retry_payment", policyOutcome: "STOP", executedAction: "STOP", status: "STOPPED", recoveredAmountMinor: 0n }], metrics };
}
