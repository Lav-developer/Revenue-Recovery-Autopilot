
export type EventType = "PAYMENT_FAILED" | "CHECKOUT_ABANDONED" | "SUBSCRIPTION_PAYMENT_FAILED" | "INVOICE_OVERDUE";

export type DomainCaseStatus = "OPEN" | "ELIGIBLE" | "PROCESSING" | "AWAITING_OUTCOME" | "RECOVERED" | "FAILED" | "STOPPED" | "ESCALATED" | "RESOLVED";
export type DomainAction = "RETRY_PAYMENT" | "CREATE_PAYMENT_LINK" | "SEND_REMINDER" | "SEND_RECOVERY_MESSAGE" | "OFFER_ALTERNATE_METHOD" | "SCHEDULE_RETRY" | "MARK_RECOVERY_CAMPAIGN" | "ESCALATE" | "STOP";
export type PolicyOutcome = "ALLOW" | "WAIT" | "STOP" | "ESCALATE" | "REJECT";
export type RuleCode = "ALREADY_PAID" | "CUSTOMER_OPTED_OUT" | "ALREADY_ESCALATED" | "ALREADY_STOPPED" | "MAX_ATTEMPTS" | "MAX_CONTACTS" | "HIGH_VALUE" | "COOLDOWN" | "UNSUPPORTED_ACTION" | "LOW_RECOVERY_PROBABILITY" | "ACTION_ALLOWED";

export interface NormalizedRevenueEvent {
  merchantId: string;
  customerId: string;
  type: EventType;
  sourceId: string;
  amountMinor: bigint;
  currency: string;
  occurredAt: Date;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

export interface RecoveryCaseSnapshot {
  id: string;
  merchantId: string;
  customerId: string;
  status: DomainCaseStatus;
  sourceType: EventType;
  sourceId: string;
  amountAtRiskMinor: bigint;
  currency: string;
  attemptCount: number;
  contactCount: number;
  lastContactAt: Date | null;
  nextActionAt: Date | null;
  recoveredAmountMinor: bigint;
  recoveryScore: number | null;
  customerOptedOut: boolean;
  paymentAlreadySuccessful: boolean;
  escalated: boolean;
}

export interface PolicyConfig {
  maxAttempts: number;
  maxContacts: number;
  cooldownHours: number;
  highValueThresholdMinor: bigint;
  minimumRecoveryScore: number;
  afterMaximumAttempts: "STOP" | "ESCALATE";
  afterMaximumContacts: "STOP" | "ESCALATE";
  supportedActions: readonly DomainAction[];
}

export interface PolicyEvaluationResult {
  outcome: PolicyOutcome;
  ruleCode: RuleCode;
  reason: string;
  nextAllowedAt?: Date;
}

export interface StoppingRuleResult {
  shouldStop: boolean;
  shouldEscalate: boolean;
  reasonCode: string;
  reason: string;
  nextState: "STOPPED" | "ESCALATED" | "AWAITING_OUTCOME" | "ELIGIBLE";
}

export interface RecoveryScoreFactors {
  historicalSuccess: number;
  recency: number;
  failureRecoverability: number;
  customerValue: number;
  engagement: number;
}

export interface RecoveryScoreResult {
  score: number;
  factors: RecoveryScoreFactors;
  explanations: Record<keyof RecoveryScoreFactors, string>;
}

export interface ExpectedRecoveryValueInput {
  amountAtRiskMinor: bigint;
  recoveryProbabilityBasisPoints: bigint;
  actionSuccessProbabilityBasisPoints: bigint;
}

export interface DomainAuditEvent {
  type: "CASE_CREATED" | "SCORE_CALCULATED" | "POLICY_EVALUATED" | "COOLDOWN_APPLIED" | "CASE_STOPPED" | "CASE_ESCALATED" | "STATE_TRANSITION" | "REVENUE_ATTRIBUTED";
  merchantId: string;
  recoveryCaseId?: string;
  traceId: string;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
