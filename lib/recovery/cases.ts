import { normalizeRevenueEvent } from "./normalization";
import { createDomainAuditEvent } from "./audit";
import type { DomainAuditEvent, EventType, NormalizedRevenueEvent, RecoveryCaseSnapshot } from "./types";

export interface RecoveryCaseRepository {
  findBySource(merchantId: string, sourceType: EventType, sourceId: string): Promise<RecoveryCaseSnapshot | null>;
  create(input: RecoveryCaseSnapshot): Promise<RecoveryCaseSnapshot>;
  update(id: string, patch: Partial<RecoveryCaseSnapshot>, merchantId?: string): Promise<RecoveryCaseSnapshot>;
}

export interface CaseCreationResult {
  event: NormalizedRevenueEvent;
  recoveryCase: RecoveryCaseSnapshot;
  created: boolean;
  auditEvents: DomainAuditEvent[];
}

export async function createOrUpdateRecoveryCase(repository: RecoveryCaseRepository, input: unknown, traceId: string): Promise<CaseCreationResult> {
  const event = normalizeRevenueEvent(input);
  const existing = await repository.findBySource(event.merchantId, event.type, event.sourceId);
  if (existing) return { event, recoveryCase: existing, created: false, auditEvents: [] };
  const recoveryCase = await repository.create({
    id: `case_${event.idempotencyKey}`,
    merchantId: event.merchantId,
    customerId: event.customerId,
    status: "OPEN",
    sourceType: event.type,
    sourceId: event.sourceId,
    amountAtRiskMinor: event.amountMinor,
    currency: event.currency,
    attemptCount: 0,
    contactCount: 0,
    lastContactAt: null,
    nextActionAt: null,
    recoveredAmountMinor: 0n,
    recoveryScore: null,
    customerOptedOut: false,
    paymentAlreadySuccessful: false,
    escalated: false,
  });
  return {
    event,
    recoveryCase,
    created: true,
    auditEvents: [createDomainAuditEvent({ type: "CASE_CREATED", merchantId: event.merchantId, recoveryCaseId: recoveryCase.id, traceId, reason: "Recovery case created from normalized revenue event", metadata: { eventType: event.type, sourceId: event.sourceId } })],
  };
}

export async function updateRecoveryCase(repository: RecoveryCaseRepository, merchantId: string, caseId: string, patch: Partial<RecoveryCaseSnapshot>): Promise<RecoveryCaseSnapshot> {
  const current = await repository.update(caseId, patch, merchantId);
  if (current.merchantId !== merchantId) throw new Error("Recovery case does not belong to merchant");
  return current;
}
