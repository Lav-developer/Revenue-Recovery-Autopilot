import type { MetricCase, MetricIntervention, MetricOutcome, ActivityItem } from "@/lib/metrics/types";

export const previewCases: MetricCase[] = [
  { id: "preview-retry", status: "RECOVERED", amountAtRiskMinor: 499900n, recoveredAmountMinor: 499900n },
  { id: "preview-link", status: "AWAITING_OUTCOME", amountAtRiskMinor: 799900n, recoveredAmountMinor: 0n },
  { id: "preview-high-value", status: "ESCALATED", amountAtRiskMinor: 7500000n, recoveredAmountMinor: 0n },
  { id: "preview-attempts", status: "STOPPED", amountAtRiskMinor: 129900n, recoveredAmountMinor: 0n },
];
export const previewInterventions: MetricIntervention[] = [{ id: "preview-intervention-retry", recoveryCaseId: "preview-retry", status: "SUCCEEDED" }, { id: "preview-intervention-link", recoveryCaseId: "preview-link", status: "AWAITING_OUTCOME" }];
export const previewOutcomes: MetricOutcome[] = [{ id: "preview-outcome-retry", recoveryCaseId: "preview-retry", interventionId: "preview-intervention-retry", type: "PAYMENT_RECOVERED", amountMinor: 499900n, occurredAt: new Date("2026-01-15T12:00:05Z") }];
export const previewActivity: ActivityItem[] = [
  { id: "preview-audit-retry", caseId: "preview-retry", eventType: "REVENUE_ATTRIBUTED", actorType: "SYSTEM", reason: "Successful retry outcome attributed to recovery case.", createdAt: new Date("2026-01-15T12:00:05Z") },
  { id: "preview-audit-escalate", caseId: "preview-high-value", eventType: "CASE_ESCALATED", actorType: "SYSTEM", reason: "High-value case requires human review.", createdAt: new Date("2026-01-15T12:00:02Z") },
  { id: "preview-audit-link", caseId: "preview-link", eventType: "INTERVENTION_EXECUTED", actorType: "PROVIDER", reason: "Payment link created; awaiting payment outcome.", createdAt: new Date("2026-01-15T12:00:02Z") },
  { id: "preview-audit-stop", caseId: "preview-attempts", eventType: "CASE_STOPPED", actorType: "SYSTEM", reason: "Maximum recovery attempts have been reached.", createdAt: new Date("2026-01-15T12:00:01Z") },
];
export const previewCaseDetails: Record<string, unknown> = Object.fromEntries(previewCases.map((item, index) => [item.id, { case: { ...item, reference: `PREVIEW-${index + 1}`, merchantId: "preview", customerId: `preview-customer-${index + 1}`, sourceType: "PAYMENT_FAILED", riskLevel: item.status === "ESCALATED" ? "CRITICAL" : "HIGH", attemptCount: item.status === "STOPPED" ? 3 : 0, contactCount: 0, diagnosisCategory: item.status === "ESCALATED" ? "expired_card" : "network_error", diagnosisConfidence: 0.86, recommendedAction: item.status === "STOPPED" ? "RETRY_PAYMENT" : item.status === "ESCALATED" ? "CREATE_PAYMENT_LINK" : "RETRY_PAYMENT" }, customer: { name: `Preview Customer ${index + 1}`, segment: item.status === "ESCALATED" ? "ENTERPRISE" : "VIP" }, sourceEvent: { occurredAt: "2026-01-15T12:00:00.000Z" }, interventions: [], outcomes: previewOutcomes.filter((outcome) => outcome.recoveryCaseId === item.id), escalations: item.status === "ESCALATED" ? [{ id: `preview-escalation-${index}`, priority: "CRITICAL", reason: "High-value case requires human review.", status: "OPEN", createdAt: "2026-01-15T12:00:02Z" }] : [], auditTimeline: previewActivity.filter((event) => event.caseId === item.id) }]));
