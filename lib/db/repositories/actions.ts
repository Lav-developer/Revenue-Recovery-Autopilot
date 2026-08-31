/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { ActionRepository, ExecutableAction } from "@/lib/actions/types";
import type { RecoveryCaseSnapshot } from "@/lib/recovery/types";
import { PrismaRecoveryCaseRepository } from "./recovery";

type Db = PrismaClient | Prisma.TransactionClient;
export class PrismaActionRepository implements ActionRepository {
  private readonly cases: PrismaRecoveryCaseRepository;
  constructor(private readonly db: Db) { this.cases = new PrismaRecoveryCaseRepository(db); }
  findCase(merchantId: string, caseId: string) { return this.cases.findById(merchantId, caseId); }
  async findInterventionByIdempotencyKey(merchantId: string, caseId: string, key: string) { const rows = await this.db.intervention.findMany({ where: { merchantId, recoveryCaseId: caseId }, orderBy: { createdAt: "desc" } }); const row = rows.find((item: any) => item.metadata && item.metadata.idempotencyKey === key); return row ? { id: row.id, resultJson: row.metadata.resultJson } : null; }
  async createIntervention(input: { merchantId: string; recoveryCaseId: string; action: ExecutableAction; reason: string; idempotencyKey: string; expectedRecoveryValueMinor: bigint; providerReference?: string; status: string; metadata?: Record<string, unknown> }) { const row = await this.db.intervention.create({ data: { merchantId: input.merchantId, recoveryCaseId: input.recoveryCaseId, actionType: input.action, status: input.status, reason: input.reason, expectedRecoveryValueMinor: input.expectedRecoveryValueMinor, providerReference: input.providerReference, metadata: { ...input.metadata, idempotencyKey: input.idempotencyKey } } }); return { id: row.id }; }
  async createEscalation(input: { merchantId: string; recoveryCaseId: string; reason: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }) { await this.db.escalation.create({ data: { merchantId: input.merchantId, recoveryCaseId: input.recoveryCaseId, reason: input.reason, priority: input.priority, status: "OPEN" } }); }
  async updateInterventionResult(id: string, result: import("@/lib/actions/types").ActionExecutionResult) { await this.db.intervention.update({ where: { id }, data: { status: result.outcome === "PAYMENT_FAILED" ? "FAILED" : result.outcome === "PAYMENT_RECOVERED" ? "SUCCEEDED" : "AWAITING_OUTCOME", outcomeAt: result.outcome ? new Date() : null, recoveredAmountMinor: result.amountRecoveredMinor, metadata: { ...result.metadata, resultJson: { ...result, amountRecoveredMinor: result.amountRecoveredMinor.toString(), policy: result.policy, idempotent: false } } } }); }
  async recordOutcome(input: { merchantId: string; recoveryCaseId: string; interventionId: string; type: string; amountMinor: bigint; currency: string; providerReference?: string; metadata?: Record<string, unknown> }) { await this.db.outcomeEvent.create({ data: { merchantId: input.merchantId, recoveryCaseId: input.recoveryCaseId, interventionId: input.interventionId, type: input.type, amountMinor: input.amountMinor, currency: input.currency, providerReference: input.providerReference, metadata: input.metadata, occurredAt: new Date() } }); }
  async updateCase(merchantId: string, caseId: string, patch: Partial<RecoveryCaseSnapshot>) { await this.cases.update(caseId, patch, merchantId); }
  async audit(input: { merchantId: string; recoveryCaseId: string; traceId: string; eventType: string; reason: string; metadata?: Record<string, unknown> }) { await this.db.auditLog.create({ data: { merchantId: input.merchantId, recoveryCaseId: input.recoveryCaseId, traceId: input.traceId, actorType: "SYSTEM", eventType: input.eventType, reason: input.reason, metadata: input.metadata } }); }
}
