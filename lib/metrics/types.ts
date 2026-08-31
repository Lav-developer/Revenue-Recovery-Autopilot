export type MetricCaseStatus = "OPEN" | "ELIGIBLE" | "PROCESSING" | "AWAITING_OUTCOME" | "RECOVERED" | "FAILED" | "STOPPED" | "ESCALATED" | "RESOLVED";
export interface MetricCase { id: string; status: MetricCaseStatus; amountAtRiskMinor: bigint; recoveredAmountMinor?: bigint; }
export interface MetricIntervention { id: string; recoveryCaseId: string; status: string; }
export interface MetricOutcome { id: string; recoveryCaseId: string; interventionId?: string | null; type: string; amountMinor: bigint; occurredAt: Date; }
export interface ExecutiveMetrics {
  totalRevenueAtRiskMinor: bigint; eligibleRevenueMinor: bigint; intervenedRevenueMinor: bigint; recoveredRevenueMinor: bigint; pendingRecoveryRevenueMinor: bigint;
  recoveryRate: { numeratorMinor: bigint; denominatorMinor: bigint; percentage: number };
  interventionSuccessRate: { numerator: number; denominator: number; percentage: number };
  revenueRiskCases: number; interventions: number; successfulRecoveries: number; stoppedCases: number; escalatedCases: number; escalatedRevenueMinor: bigint; stoppedRevenueMinor: bigint;
}
export interface FunnelStage { stage: "AT_RISK" | "ELIGIBLE" | "INTERVENED" | "RECOVERED"; cases: number; amountMinor: bigint; conversionPercentage: number | null; }
export interface ActivityItem { id: string; caseId?: string | null; eventType: string; actorType: string; reason?: string | null; createdAt: Date; metadata?: unknown; }
