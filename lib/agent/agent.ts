import { createHash } from "node:crypto";
import { calculateExpectedRecoveryValue, probabilityToBasisPoints } from "@/lib/recovery/expected-value";
import { createDomainAuditEvent } from "@/lib/recovery/audit";
import { evaluatePolicy } from "@/lib/recovery/policies";
import { agentDecisionSchema, type AgentDecisionOutput } from "./schema";
import { buildAgentContext, domainActionForAgentAction, type AgentContext, type AgentContextInput } from "./context";
import type { AgentProvider } from "./provider";

export interface AgentRunRepository { create(input: { traceId: string; merchantId: string; recoveryCaseId: string; provider: string; model?: string; inputContextHash: string; outputJson?: unknown; validationStatus: string; latencyMs: number; error?: string }): Promise<void>; }
export interface AgentAuditRepository { create(event: ReturnType<typeof createDomainAuditEvent>): Promise<void>; }
export interface AgentRunInput { context: AgentContextInput; provider: AgentProvider; runRepository: AgentRunRepository; auditRepository: AgentAuditRepository; traceId: string; now?: Date; }
export interface AgentRunResult { context: AgentContext; recommendation?: AgentDecisionOutput; serverExpectedRecoveryValueMinor?: bigint; policy: ReturnType<typeof evaluatePolicy>; traceId: string; safeFailure?: { code: string; reason: string }; }

const actionSuccessBasisPoints: Record<string, bigint> = { RETRY_PAYMENT: 5500n, CREATE_PAYMENT_LINK: 7200n, SEND_RECOVERY_MESSAGE: 4800n, SEND_REMINDER: 4200n, SCHEDULE_RETRY: 5000n, ESCALATE: 0n, STOP: 0n };
const hashContext = (context: AgentContext) => createHash("sha256").update(JSON.stringify({ ...context, amountAtRiskMinor: context.amountAtRiskMinor.toString(), policy: { ...context.policy, highValueThresholdMinor: context.policy.highValueThresholdMinor.toString() } })).digest("hex");

export async function runRecoveryAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const context = buildAgentContext(input.context, input.traceId);
  const started = Date.now();
  const hash = hashContext(context);
  try {
    const raw = await input.provider.generateDecision(context);
    const parsed = agentDecisionSchema.parse(raw);
    if (parsed.case_id !== context.caseId) throw new Error("Agent decision case ID does not match the current case.");
    if (parsed.next_step.cooldown_hours > context.policy.cooldownHours) throw new Error("Agent cooldown exceeds the merchant policy cooldown.");
    const domainAction = domainActionForAgentAction(parsed.decision.action);
    const probability = probabilityToBasisPoints(context.recoveryScore.score);
    const serverExpected = calculateExpectedRecoveryValue({ amountAtRiskMinor: context.amountAtRiskMinor, recoveryProbabilityBasisPoints: probability, actionSuccessProbabilityBasisPoints: actionSuccessBasisPoints[domainAction] ?? 0n });
    const policy = evaluatePolicy(contextCase(context), domainAction, input.now ?? new Date(), context.policy);
    await input.runRepository.create({ traceId: input.traceId, merchantId: contextCase(context).merchantId, recoveryCaseId: context.caseId, provider: input.provider.providerName, model: input.provider.modelName, inputContextHash: hash, outputJson: { ...parsed, decision: { ...parsed.decision, expected_recovery_value_minor: parsed.decision.expected_recovery_value_minor.toString() } }, validationStatus: "VALID", latencyMs: Date.now() - started });
    await input.auditRepository.create(createDomainAuditEvent({ type: "POLICY_EVALUATED", merchantId: contextCase(context).merchantId, recoveryCaseId: context.caseId, traceId: input.traceId, reason: policy.reason, metadata: { outcome: policy.outcome, ruleCode: policy.ruleCode } }));
    return { context, recommendation: parsed, serverExpectedRecoveryValueMinor: serverExpected, policy, traceId: input.traceId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Agent provider failed.";
    const code = error instanceof Error && "code" in error ? String((error as { code?: unknown }).code) : "AGENT_FAILURE";
    await input.runRepository.create({ traceId: input.traceId, merchantId: contextCase(context).merchantId, recoveryCaseId: context.caseId, provider: input.provider.providerName, model: input.provider.modelName, inputContextHash: hash, validationStatus: "FAILED", latencyMs: Date.now() - started, error: reason });
    await input.auditRepository.create(createDomainAuditEvent({ type: "POLICY_EVALUATED", merchantId: contextCase(context).merchantId, recoveryCaseId: context.caseId, traceId: input.traceId, reason: `Agent failed safely: ${reason}`, metadata: { code, safeFailure: true } }));
    return { context, policy: { outcome: "REJECT", ruleCode: "UNSUPPORTED_ACTION", reason: "No actionable recommendation was produced." }, traceId: input.traceId, safeFailure: { code, reason } };
  }
}

function contextCase(context: AgentContext): AgentContextInput["recoveryCase"] { return { id: context.caseId, merchantId: context.merchantId, customerId: "", status: context.currentState, sourceType: context.eventType, sourceId: "", amountAtRiskMinor: context.amountAtRiskMinor, currency: context.currency, attemptCount: context.attemptCount, contactCount: context.contactCount, lastContactAt: context.lastContactAt, nextActionAt: null, recoveredAmountMinor: 0n, recoveryScore: context.recoveryScore.score, customerOptedOut: context.customerOptedOut, paymentAlreadySuccessful: context.paymentAlreadySuccessful, escalated: context.escalated }; }
