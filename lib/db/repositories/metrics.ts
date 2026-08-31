/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { MetricsRepository } from "@/lib/metrics/service";
import type { ActivityItem, MetricCase, MetricIntervention, MetricOutcome } from "@/lib/metrics/types";

type Db = PrismaClient | Prisma.TransactionClient;
export class PrismaMetricsRepository implements MetricsRepository {
  constructor(private readonly db: Db) {}
  async loadCases(merchantId: string): Promise<MetricCase[]> { const rows = await this.db.recoveryCase.findMany({ where: { merchantId }, select: { id: true, status: true, amountAtRiskMinor: true, recoveredAmountMinor: true } }); return rows.map((row: any) => ({ id: row.id, status: row.status, amountAtRiskMinor: BigInt(row.amountAtRiskMinor), recoveredAmountMinor: BigInt(row.recoveredAmountMinor) })); }
  async loadInterventions(merchantId: string): Promise<MetricIntervention[]> { const rows = await this.db.intervention.findMany({ where: { merchantId }, select: { id: true, recoveryCaseId: true, status: true } }); return rows.map((row: any) => row); }
  async loadOutcomes(merchantId: string): Promise<MetricOutcome[]> { const rows = await this.db.outcomeEvent.findMany({ where: { merchantId }, select: { id: true, recoveryCaseId: true, interventionId: true, type: true, amountMinor: true, occurredAt: true } }); return rows.map((row: any) => ({ ...row, amountMinor: BigInt(row.amountMinor) })); }
  async loadActivity(merchantId: string, limit: number): Promise<ActivityItem[]> { const rows = await this.db.auditLog.findMany({ where: { merchantId }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, recoveryCaseId: true, eventType: true, actorType: true, reason: true, createdAt: true, metadata: true } }); return rows; }
}
