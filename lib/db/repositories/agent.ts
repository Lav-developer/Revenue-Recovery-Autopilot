import type { Prisma, PrismaClient } from "@prisma/client";
import type { AgentRunRepository, AgentAuditRepository } from "@/lib/agent/agent";
import { createDomainAuditEvent } from "@/lib/recovery/audit";

type Db = PrismaClient | Prisma.TransactionClient;
export class PrismaAgentRunRepository implements AgentRunRepository {
  constructor(private readonly db: Db) {}
  async create(input: Parameters<AgentRunRepository["create"]>[0]): Promise<void> {
    await this.db.agentRun.create({ data: { traceId: input.traceId, merchantId: input.merchantId, recoveryCaseId: input.recoveryCaseId, provider: input.provider, model: input.model, inputContextHash: input.inputContextHash, outputJson: input.outputJson, validationStatus: input.validationStatus, latencyMs: input.latencyMs, error: input.error } });
  }
}
export class PrismaAgentAuditRepository implements AgentAuditRepository {
  constructor(private readonly db: Db) {}
  async create(event: ReturnType<typeof createDomainAuditEvent>): Promise<void> {
    await this.db.auditLog.create({ data: { merchantId: event.merchantId, recoveryCaseId: event.recoveryCaseId, traceId: event.traceId, actorType: "AI", eventType: event.type, reason: event.reason, metadata: event.metadata, createdAt: event.createdAt } });
  }
}
