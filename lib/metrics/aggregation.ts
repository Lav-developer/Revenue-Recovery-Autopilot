import type { ExecutiveMetrics, MetricCase, MetricIntervention, MetricOutcome } from "./types";
import { attributeRecoveredRevenue } from "@/lib/recovery/attribution";

const ZERO = 0n;
const percent = (numerator: bigint | number, denominator: bigint | number) => denominator === 0n || denominator === 0 ? 0 : Number(numerator) / Number(denominator) * 100;

export function actualRecoveredByCase(cases: readonly MetricCase[], outcomes: readonly MetricOutcome[]): Map<string, bigint> {
  const risk = new Map(cases.map((item) => [item.id, item.amountAtRiskMinor]));
  const totals = new Map<string, bigint>();
  for (const outcome of outcomes) {
    if (outcome.type !== "PAYMENT_RECOVERED") continue;
    const current = totals.get(outcome.recoveryCaseId) ?? ZERO;
    const attributed = attributeRecoveredRevenue({ amountAtRiskMinor: risk.get(outcome.recoveryCaseId) ?? ZERO, alreadyAttributedMinor: current, outcomeAmountMinor: outcome.amountMinor, outcomeIsSuccessful: true });
    if (attributed > ZERO) totals.set(outcome.recoveryCaseId, current + attributed);
  }
  return totals;
}

export function aggregateExecutiveMetrics(cases: readonly MetricCase[], interventions: readonly MetricIntervention[], outcomes: readonly MetricOutcome[]): ExecutiveMetrics {
  const recoveredByCase = actualRecoveredByCase(cases, outcomes);
  const recovered = [...recoveredByCase.values()].reduce((sum, value) => sum + value, ZERO);
  const totalRisk = cases.reduce((sum, item) => sum + item.amountAtRiskMinor, ZERO);
  const eligibleCases = cases.filter((item) => ["ELIGIBLE", "PROCESSING", "AWAITING_OUTCOME", "RECOVERED"].includes(item.status));
  const eligible = eligibleCases.reduce((sum, item) => sum + item.amountAtRiskMinor, ZERO);
  const intervenedCaseIds = new Set(interventions.map((item) => item.recoveryCaseId));
  const intervened = cases.filter((item) => intervenedCaseIds.has(item.id)).reduce((sum, item) => sum + item.amountAtRiskMinor, ZERO);
  const successfulInterventionIds = new Set(outcomes.filter((item) => item.type === "PAYMENT_RECOVERED" && item.interventionId && item.amountMinor > ZERO).map((item) => item.interventionId));
  const stopped = cases.filter((item) => item.status === "STOPPED");
  const escalated = cases.filter((item) => item.status === "ESCALATED");
  return {
    totalRevenueAtRiskMinor: totalRisk, eligibleRevenueMinor: eligible, intervenedRevenueMinor: intervened, recoveredRevenueMinor: recovered,
    pendingRecoveryRevenueMinor: eligible > recovered ? eligible - recovered : ZERO,
    recoveryRate: { numeratorMinor: recovered, denominatorMinor: eligible, percentage: percent(recovered, eligible) },
    interventionSuccessRate: { numerator: successfulInterventionIds.size, denominator: interventions.length, percentage: percent(successfulInterventionIds.size, interventions.length) },
    revenueRiskCases: cases.length, interventions: interventions.length, successfulRecoveries: recoveredByCase.size,
    stoppedCases: stopped.length, escalatedCases: escalated.length, escalatedRevenueMinor: escalated.reduce((sum, item) => sum + item.amountAtRiskMinor, ZERO), stoppedRevenueMinor: stopped.reduce((sum, item) => sum + item.amountAtRiskMinor, ZERO),
  };
}
