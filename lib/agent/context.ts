import type { DomainAction, PolicyConfig, RecoveryCaseSnapshot, EventType, RecoveryScoreResult } from "@/lib/recovery/types";
import type { AgentDecisionOutput } from "./schema";
import { calculateRecoveryScore, type ScoringInput } from "@/lib/recovery/scoring";

export interface AgentContextInput {
  recoveryCase: RecoveryCaseSnapshot;
  failureReason: string | null;
  customerSegment: "STANDARD" | "GROWTH" | "VIP" | "ENTERPRISE";
  successfulPaymentCount: number;
  failureCount: number;
  priorRecoveryOutcomes: readonly string[];
  previousInterventionCount: number;
  scoringInput: ScoringInput;
  policy: PolicyConfig;
}

export interface AgentContext {
  traceId: string;
  merchantId: string;
  caseId: string;
  eventType: EventType;
  amountAtRiskMinor: bigint;
  currency: string;
  failureReason: string | null;
  customerSegment: AgentContextInput["customerSegment"];
  successfulPaymentCount: number;
  failureCount: number;
  priorRecoveryOutcomes: readonly string[];
  previousInterventionCount: number;
  attemptCount: number;
  contactCount: number;
  lastContactAt: Date | null;
  recoveryScore: RecoveryScoreResult;
  policy: PolicyConfig;
  currentState: RecoveryCaseSnapshot["status"];
  customerOptedOut: boolean;
  paymentAlreadySuccessful: boolean;
  escalated: boolean;
}

export function buildAgentContext(input: AgentContextInput, traceId: string): AgentContext {
  const { recoveryCase } = input;
  return {
    traceId, merchantId: recoveryCase.merchantId, caseId: recoveryCase.id, eventType: recoveryCase.sourceType, amountAtRiskMinor: recoveryCase.amountAtRiskMinor, currency: recoveryCase.currency,
    failureReason: input.failureReason, customerSegment: input.customerSegment, successfulPaymentCount: input.successfulPaymentCount, failureCount: input.failureCount,
    priorRecoveryOutcomes: [...input.priorRecoveryOutcomes], previousInterventionCount: input.previousInterventionCount, attemptCount: recoveryCase.attemptCount,
    contactCount: recoveryCase.contactCount, lastContactAt: recoveryCase.lastContactAt, recoveryScore: calculateRecoveryScore(input.scoringInput), policy: input.policy, currentState: recoveryCase.status, customerOptedOut: recoveryCase.customerOptedOut, paymentAlreadySuccessful: recoveryCase.paymentAlreadySuccessful, escalated: recoveryCase.escalated,
  };
}

export function domainActionForAgentAction(action: AgentDecisionOutput["decision"]["action"]): DomainAction {
  const map: Record<AgentDecisionOutput["decision"]["action"], DomainAction> = { retry_payment: "RETRY_PAYMENT", create_payment_link: "CREATE_PAYMENT_LINK", send_recovery_message: "SEND_RECOVERY_MESSAGE", send_reminder: "SEND_REMINDER", schedule_retry: "SCHEDULE_RETRY", escalate_case: "ESCALATE", stop_case: "STOP" };
  return map[action];
}
