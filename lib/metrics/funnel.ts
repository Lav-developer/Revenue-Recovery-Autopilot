import type { FunnelStage, MetricCase, MetricIntervention, MetricOutcome } from "./types";
import { actualRecoveredByCase } from "./aggregation";

export function buildRecoveryFunnel(cases: readonly MetricCase[], interventions: readonly MetricIntervention[], outcomes: readonly MetricOutcome[]): FunnelStage[] {
  const recovered = actualRecoveredByCase(cases, outcomes);
  const intervenedIds = new Set(interventions.map((item) => item.recoveryCaseId));
  const eligible = cases.filter((item) => ["ELIGIBLE", "PROCESSING", "AWAITING_OUTCOME", "RECOVERED"].includes(item.status));
  const amount = (items: readonly MetricCase[]) => items.reduce((sum, item) => sum + item.amountAtRiskMinor, 0n);
  const atRiskAmount = amount(cases);
  const stages = [{ stage: "AT_RISK" as const, cases, amountMinor: atRiskAmount }, { stage: "ELIGIBLE" as const, cases: eligible, amountMinor: amount(eligible) }, { stage: "INTERVENED" as const, cases: cases.filter((item) => intervenedIds.has(item.id)), amountMinor: amount(cases.filter((item) => intervenedIds.has(item.id))) }, { stage: "RECOVERED" as const, cases: cases.filter((item) => (recovered.get(item.id) ?? 0n) > 0n), amountMinor: [...recovered.values()].reduce((sum, value) => sum + value, 0n) }];
  return stages.map((item, index) => ({ stage: item.stage, cases: item.cases.length, amountMinor: item.amountMinor, conversionPercentage: index === 0 ? null : percentOf(item.amountMinor, stages[index - 1].amountMinor) }));
}
function percentOf(value: bigint, denominator: bigint) { return denominator === 0n ? 0 : Number(value) / Number(denominator) * 100; }
