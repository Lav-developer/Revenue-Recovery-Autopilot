/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "@prisma/client";
import { createOrUpdateRecoveryCase } from "@/lib/recovery/cases";
import { createCaseEscalatedAuditEvent, createCaseStoppedAuditEvent, createDomainAuditEvent, createStateTransitionAuditEvent } from "@/lib/recovery/audit";
import { evaluateStoppingRules } from "@/lib/recovery/stopping-rules";
import { transitionCase } from "@/lib/recovery/state-machine";
import type { DomainAction, PolicyConfig } from "@/lib/recovery/types";
import { ApiError } from "./errors";
import { PrismaRecoveryCaseRepository } from "@/lib/db/repositories/recovery";

const defaultPolicy: PolicyConfig = { maxAttempts: 3, maxContacts: 3, cooldownHours: 24, highValueThresholdMinor: 5_000_000n, minimumRecoveryScore: 0.25, afterMaximumAttempts: "STOP", afterMaximumContacts: "STOP", supportedActions: ["RETRY_PAYMENT", "CREATE_PAYMENT_LINK", "SEND_REMINDER", "SEND_RECOVERY_MESSAGE", "OFFER_ALTERNATE_METHOD", "SCHEDULE_RETRY", "MARK_RECOVERY_CAMPAIGN"] };

function auditData(event: ReturnType<typeof createDomainAuditEvent>) { return { merchantId: event.merchantId, recoveryCaseId: event.recoveryCaseId, traceId: event.traceId, actorType: "SYSTEM", eventType: event.type, reason: event.reason, metadata: event.metadata, createdAt: event.createdAt }; }
async function writeAudits(db: PrismaClient | any, events: ReturnType<typeof createDomainAuditEvent>[]) { for (const event of events) await db.auditLog.create({ data: auditData(event) }); }
function policyFromJson(value: unknown): PolicyConfig { if (!value || typeof value !== "object") return defaultPolicy; const rules = value as Record<string, unknown>; return { ...defaultPolicy, ...(typeof rules.maxAttempts === "number" ? { maxAttempts: rules.maxAttempts } : {}), ...(typeof rules.maxContacts === "number" ? { maxContacts: rules.maxContacts } : {}), ...(typeof rules.cooldownHours === "number" ? { cooldownHours: rules.cooldownHours } : {}), ...(typeof rules.minimumRecoveryScore === "number" ? { minimumRecoveryScore: rules.minimumRecoveryScore } : {}), ...(typeof rules.highValueThresholdMinor === "string" ? { highValueThresholdMinor: BigInt(rules.highValueThresholdMinor) } : {}) }; }

export async function ingestEvent(db: PrismaClient | any, raw: unknown, merchantId: string, traceId: string) {
  const input = typeof raw === "object" && raw !== null ? { ...(raw as Record<string, unknown>), merchantId } : raw;
  const normalized = (await import("@/lib/recovery/normalization")).normalizeRevenueEvent(input);
  if ((raw as { merchantId?: string } | null)?.merchantId && (raw as { merchantId: string }).merchantId !== merchantId) throw new ApiError(403, "MERCHANT_MISMATCH", "Event merchant does not match the requested merchant scope.");
  return db.$transaction(async (tx: any) => {
    const existingEvent = await tx.revenueEvent.findUnique({ where: { merchantId_idempotencyKey: { merchantId, idempotencyKey: normalized.idempotencyKey } } });
    const repository = new PrismaRecoveryCaseRepository(tx);
    if (existingEvent) {
      const existingCase = await repository.findBySource(merchantId, normalized.type, normalized.sourceId);
      return { duplicate: true, event: existingEvent, recoveryCase: existingCase };
    }
    const event = await tx.revenueEvent.create({ data: { merchantId, customerId: normalized.customerId, type: normalized.type, sourceId: normalized.sourceId, idempotencyKey: normalized.idempotencyKey, payload: normalized.payload, occurredAt: normalized.occurredAt, processedAt: new Date() } });
    const result = await createOrUpdateRecoveryCase(repository, normalized, traceId);
    await writeAudits(tx, result.auditEvents);
    return { duplicate: false, event, recoveryCase: result.recoveryCase };
  });
}

export async function processCase(db: PrismaClient | any, merchantId: string, caseId: string, traceId: string, action?: DomainAction) {
  return db.$transaction(async (tx: any) => {
    const repository = new PrismaRecoveryCaseRepository(tx);
    const current = await repository.findById(merchantId, caseId);
    if (!current) throw new ApiError(404, "CASE_NOT_FOUND", "Recovery case was not found.");
    let updated = current;
    const audits = [];
    if (current.status === "OPEN") { transitionCase(current.status, "ELIGIBLE"); updated = await repository.update(caseId, { status: "ELIGIBLE" }, merchantId); audits.push(createStateTransitionAuditEvent(merchantId, caseId, traceId, current.status, "ELIGIBLE")); }
    const policy = await tx.policy.findFirst({ where: { merchantId, eventType: updated.sourceType, enabled: true }, orderBy: { version: "desc" } });
    const stopping = evaluateStoppingRules(updated, policyFromJson(policy?.rulesJson));
    if (stopping.shouldStop && updated.status !== "STOPPED" && updated.status !== "RECOVERED") { const next = transitionCase(updated.status, "STOPPED"); updated = await repository.update(caseId, { status: next }, merchantId); audits.push(createCaseStoppedAuditEvent(merchantId, caseId, traceId, stopping.reason)); }
    else if (stopping.shouldEscalate) { const next = transitionCase(updated.status, "ESCALATED"); updated = await repository.update(caseId, { status: next, escalated: true }, merchantId); audits.push(createCaseEscalatedAuditEvent(merchantId, caseId, traceId, stopping.reason)); }
    else if (action) { void action; }
    await writeAudits(tx, audits);
    return { recoveryCase: updated, stopping, auditEvents: audits };
  });
}

export async function stopCase(db: PrismaClient | any, merchantId: string, caseId: string, traceId: string, reason: string) { return db.$transaction(async (tx: any) => { const repository = new PrismaRecoveryCaseRepository(tx); const current = await repository.findById(merchantId, caseId); if (!current) throw new ApiError(404, "CASE_NOT_FOUND", "Recovery case was not found."); const next = transitionCase(current.status, "STOPPED"); const updated = await repository.update(caseId, { status: next }, merchantId); await writeAudits(tx, [createStateTransitionAuditEvent(merchantId, caseId, traceId, current.status, next), createCaseStoppedAuditEvent(merchantId, caseId, traceId, reason)]); return updated; }); }

export async function escalateCase(db: PrismaClient | any, merchantId: string, caseId: string, traceId: string, reason: string, priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") { return db.$transaction(async (tx: any) => { const repository = new PrismaRecoveryCaseRepository(tx); const current = await repository.findById(merchantId, caseId); if (!current) throw new ApiError(404, "CASE_NOT_FOUND", "Recovery case was not found."); const next = transitionCase(current.status, "ESCALATED"); const updated = await repository.update(caseId, { status: next, escalated: true }, merchantId); await tx.escalation.create({ data: { merchantId, recoveryCaseId: caseId, priority, reason, status: "OPEN" } }); await writeAudits(tx, [createStateTransitionAuditEvent(merchantId, caseId, traceId, current.status, next), createCaseEscalatedAuditEvent(merchantId, caseId, traceId, reason)]); return updated; }); }
