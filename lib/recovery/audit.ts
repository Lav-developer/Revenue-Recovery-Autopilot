import type { DomainAuditEvent } from "./types";

export function createDomainAuditEvent(input: Omit<DomainAuditEvent, "createdAt"> & { createdAt?: Date }): DomainAuditEvent {
  return { ...input, createdAt: input.createdAt ?? new Date() };
}

export function createStateTransitionAuditEvent(merchantId: string, recoveryCaseId: string, traceId: string, from: string, to: string): DomainAuditEvent {
  return createDomainAuditEvent({ type: "STATE_TRANSITION", merchantId, recoveryCaseId, traceId, reason: `Recovery case transitioned from ${from} to ${to}.`, metadata: { from, to } });
}

export function createPolicyAuditEvent(merchantId: string, recoveryCaseId: string, traceId: string, outcome: string, ruleCode: string, reason: string, nextAllowedAt?: Date): DomainAuditEvent {
  return createDomainAuditEvent({ type: nextAllowedAt ? "COOLDOWN_APPLIED" : "POLICY_EVALUATED", merchantId, recoveryCaseId, traceId, reason, metadata: { outcome, ruleCode, nextAllowedAt: nextAllowedAt?.toISOString() } });
}

export function createCaseStoppedAuditEvent(merchantId: string, recoveryCaseId: string, traceId: string, reason: string): DomainAuditEvent {
  return createDomainAuditEvent({ type: "CASE_STOPPED", merchantId, recoveryCaseId, traceId, reason });
}

export function createCaseEscalatedAuditEvent(merchantId: string, recoveryCaseId: string, traceId: string, reason: string): DomainAuditEvent {
  return createDomainAuditEvent({ type: "CASE_ESCALATED", merchantId, recoveryCaseId, traceId, reason });
}
