import type { DomainAuditEvent } from "./types";

export interface RecoveryAttributionInput {
  amountAtRiskMinor: bigint;
  alreadyAttributedMinor: bigint;
  outcomeAmountMinor: bigint;
  outcomeIsSuccessful: boolean;
}

export function attributeRecoveredRevenue(input: RecoveryAttributionInput): bigint {
  if (input.amountAtRiskMinor < 0n || input.alreadyAttributedMinor < 0n || input.outcomeAmountMinor < 0n) throw new RangeError("Revenue amounts cannot be negative");
  if (!input.outcomeIsSuccessful) return 0n;
  const remaining = input.amountAtRiskMinor > input.alreadyAttributedMinor ? input.amountAtRiskMinor - input.alreadyAttributedMinor : 0n;
  return input.outcomeAmountMinor > remaining ? remaining : input.outcomeAmountMinor;
}

export function createAttributionAuditEvent(merchantId: string, recoveryCaseId: string, traceId: string, amountMinor: bigint): DomainAuditEvent {
  return { type: "REVENUE_ATTRIBUTED", merchantId, recoveryCaseId, traceId, reason: "Successful outcome attributed up to the case amount at risk", metadata: { amountMinor: amountMinor.toString() }, createdAt: new Date() };
}
