import type { DomainAction, PolicyConfig, RecoveryCaseSnapshot } from "@/lib/recovery/types";
import type { PaymentProvider, PaymentActionResult } from "@/lib/payments/provider";

export type ExecutableAction = Extract<DomainAction, "RETRY_PAYMENT" | "CREATE_PAYMENT_LINK" | "SEND_RECOVERY_MESSAGE" | "SEND_REMINDER" | "SCHEDULE_RETRY" | "ESCALATE" | "STOP">;
export interface ActionExecutionResult { success: boolean; action: ExecutableAction; provider: string; providerReference?: string; outcome?: string; amountRecoveredMinor: bigint; interventionId?: string; policy: { outcome: string; ruleCode: string; reason: string; nextAllowedAt?: Date }; idempotent: boolean; metadata: Record<string, unknown>; }
export interface ActionRepository {
  findCase(merchantId: string, caseId: string): Promise<RecoveryCaseSnapshot | null>;
  findInterventionByIdempotencyKey(merchantId: string, caseId: string, key: string): Promise<{ id: string; resultJson: unknown } | null>;
  createIntervention(input: { merchantId: string; recoveryCaseId: string; action: ExecutableAction; reason: string; idempotencyKey: string; expectedRecoveryValueMinor: bigint; providerReference?: string; status: string; metadata?: Record<string, unknown> }): Promise<{ id: string }>;
  updateInterventionResult(id: string, result: ActionExecutionResult): Promise<void>;
  recordOutcome(input: { merchantId: string; recoveryCaseId: string; interventionId: string; type: string; amountMinor: bigint; currency: string; providerReference?: string; metadata?: Record<string, unknown> }): Promise<void>;
  updateCase(merchantId: string, caseId: string, patch: Partial<RecoveryCaseSnapshot>): Promise<void>;
  audit(input: { merchantId: string; recoveryCaseId: string; traceId: string; eventType: string; reason: string; metadata?: Record<string, unknown> }): Promise<void>;
}
export interface ExecuteActionInput { merchantId: string; caseId: string; action: DomainAction; policy: PolicyConfig; repository: ActionRepository; paymentProvider: PaymentProvider; traceId: string; idempotencyKey: string; now?: Date; }
export type { PaymentActionResult };
