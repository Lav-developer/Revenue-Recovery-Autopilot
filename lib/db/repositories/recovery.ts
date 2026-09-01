/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { EventType, RecoveryCaseSnapshot, DomainCaseStatus } from "@/lib/recovery/types";

export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

function snapshot(row: any): RecoveryCaseSnapshot {
  return {
    id: row.id, merchantId: row.merchantId, customerId: row.customerId, status: row.status as DomainCaseStatus,
    sourceType: row.sourceType as EventType, sourceId: row.sourceId, amountAtRiskMinor: BigInt(row.amountAtRiskMinor), currency: row.currency,
    attemptCount: row.attemptCount, contactCount: row.contactCount, lastContactAt: row.lastContactAt, nextActionAt: row.nextActionAt,
    recoveredAmountMinor: BigInt(row.recoveredAmountMinor), recoveryScore: row.recoveryScore === null ? null : Number(row.recoveryScore),
    customerOptedOut: Boolean(row.customer?.optedOut), paymentAlreadySuccessful: row.status === "RECOVERED" || Boolean(row.paymentAlreadySuccessful), escalated: row.status === "ESCALATED" || Boolean(row.escalatedAt),
  };
}

export class PrismaRecoveryCaseRepository {
  constructor(private readonly db: PrismaExecutor) {}

  async findBySource(merchantId: string, sourceType: EventType, sourceId: string): Promise<RecoveryCaseSnapshot | null> {
    const row = await this.db.recoveryCase.findUnique({ where: { merchantId_sourceType_sourceId: { merchantId, sourceType, sourceId } }, include: { customer: true } });
    return row ? snapshot(row) : null;
  }

  async findById(merchantId: string, id: string): Promise<RecoveryCaseSnapshot | null> {
    const row = await this.db.recoveryCase.findFirst({ where: { id, merchantId }, include: { customer: true } });
    return row ? snapshot(row) : null;
  }

  async create(input: RecoveryCaseSnapshot): Promise<RecoveryCaseSnapshot> {
    const row = await this.db.recoveryCase.create({ data: {
      id: input.id, reference: input.id, merchantId: input.merchantId, customerId: input.customerId, sourceType: input.sourceType, sourceId: input.sourceId,
      amountAtRiskMinor: input.amountAtRiskMinor, currency: input.currency, status: input.status, attemptCount: input.attemptCount, contactCount: input.contactCount,
      lastContactAt: input.lastContactAt, nextActionAt: input.nextActionAt, recoveredAmountMinor: input.recoveredAmountMinor, recoveryScore: input.recoveryScore,
      escalatedAt: input.escalated ? new Date() : null, createdAt: new Date(), updatedAt: new Date()
    }, include: { customer: true } });
    return snapshot(row);
  }

  async update(id: string, patch: Partial<RecoveryCaseSnapshot>, merchantId?: string): Promise<RecoveryCaseSnapshot> {
    const existing = await this.db.recoveryCase.findFirst({ where: { id, ...(merchantId ? { merchantId } : {}) } });
    if (!existing) throw new Error("Recovery case not found");
    const row = await this.db.recoveryCase.update({ where: { id: existing.id }, data: {
      ...(patch.status ? { status: patch.status } : {}), ...(patch.attemptCount !== undefined ? { attemptCount: patch.attemptCount } : {}), ...(patch.contactCount !== undefined ? { contactCount: patch.contactCount } : {}),
      ...(patch.nextActionAt !== undefined ? { nextActionAt: patch.nextActionAt } : {}), ...(patch.lastContactAt !== undefined ? { lastContactAt: patch.lastContactAt } : {}),
      ...(patch.recoveredAmountMinor !== undefined ? { recoveredAmountMinor: patch.recoveredAmountMinor } : {}), ...(patch.recoveryScore !== undefined ? { recoveryScore: patch.recoveryScore } : {}),
      ...(patch.escalated ? { escalatedAt: new Date() } : {})
    }, include: { customer: true } });
    return snapshot(row);
  }

  async list(merchantId: string, filters: Record<string, unknown>, page = 1, pageSize = 25, sortBy = "createdAt", sortOrder: "asc" | "desc" = "desc") {
    const where = { merchantId, ...filters };
    const [rows, total] = await Promise.all([
      this.db.recoveryCase.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize, include: { customer: true } }),
      this.db.recoveryCase.count({ where }),
    ]);
    return { items: rows.map(snapshot), total, page, pageSize };
  }

  async detail(merchantId: string, id: string) {
    const row = await this.db.recoveryCase.findFirst({ where: { id, merchantId }, include: { customer: true, interventions: { orderBy: { createdAt: "desc" } }, outcomes: { orderBy: { occurredAt: "desc" } }, escalations: { orderBy: { createdAt: "desc" } }, auditLogs: { orderBy: { createdAt: "asc" } } } });
    if (!row) return null;
    const sourceEvent = await this.db.revenueEvent.findFirst({ where: { merchantId, type: row.sourceType, sourceId: row.sourceId } });
    return { case: snapshot(row), customer: row.customer, sourceEvent, interventions: row.interventions, outcomes: row.outcomes, escalations: row.escalations, auditTimeline: row.auditLogs };
  }
}
