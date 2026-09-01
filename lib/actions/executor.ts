import { calculateExpectedRecoveryValue } from "@/lib/recovery/expected-value";
import { attributeRecoveredRevenue } from "@/lib/recovery/attribution";
import { evaluatePolicy } from "@/lib/recovery/policies";
import { evaluateStoppingRules } from "@/lib/recovery/stopping-rules";
import { transitionCase } from "@/lib/recovery/state-machine";
import { ActionError } from "./errors";
import type { ActionExecutionResult, ExecuteActionInput, ExecutableAction } from "./types";

const executableActions = new Set<ExecutableAction>(["RETRY_PAYMENT", "CREATE_PAYMENT_LINK", "SEND_RECOVERY_MESSAGE", "SEND_REMINDER", "SCHEDULE_RETRY", "ESCALATE", "STOP"]);
const successBasisPoints: Record<ExecutableAction, bigint> = { RETRY_PAYMENT: 5500n, CREATE_PAYMENT_LINK: 7200n, SEND_RECOVERY_MESSAGE: 4800n, SEND_REMINDER: 4200n, SCHEDULE_RETRY: 5000n, ESCALATE: 0n, STOP: 0n };

export async function executeRecoveryAction(input: ExecuteActionInput): Promise<ActionExecutionResult> {
  const current = await input.repository.findCase(input.merchantId, input.caseId);
  if (!current) throw new ActionError("CASE_NOT_FOUND", "Recovery case was not found.", 404);
  const action = input.action;
  if (!executableActions.has(action as ExecutableAction)) throw new ActionError("ACTION_NOT_ALLOWED", "Action is not supported.");
  const executableAction = action as ExecutableAction;
  const existing = await input.repository.findInterventionByIdempotencyKey(input.merchantId, input.caseId, input.idempotencyKey);
  if (existing) return { ...(existing.resultJson as ActionExecutionResult), idempotent: true };
  if (current.status === "STOPPED" || current.status === "RESOLVED" || current.status === "RECOVERED") throw new ActionError("ACTION_NOT_ALLOWED", "Terminal recovery cases cannot execute actions.");
  const policy = evaluatePolicy(current, executableAction, input.now ?? new Date(), input.policy);
  const stopping = evaluateStoppingRules(current, input.policy);
  const controlAction = executableAction === "ESCALATE" ? policy.outcome === "ESCALATE" || policy.outcome === "ALLOW" : executableAction === "STOP" ? policy.outcome === "STOP" || policy.outcome === "ALLOW" : policy.outcome === "ALLOW";
  if (!controlAction || stopping.shouldStop && executableAction !== "STOP" || stopping.shouldEscalate && executableAction !== "ESCALATE") throw new ActionError("ACTION_NOT_ALLOWED", `Action rejected by deterministic controls: ${policy.reason}`);
  const expected = calculateExpectedRecoveryValue({ amountAtRiskMinor: current.amountAtRiskMinor, recoveryProbabilityBasisPoints: BigInt(Math.round((current.recoveryScore ?? 0) * 10_000)), actionSuccessProbabilityBasisPoints: successBasisPoints[executableAction] });
  const created = await input.repository.createIntervention({ merchantId: input.merchantId, recoveryCaseId: input.caseId, action: executableAction, reason: policy.reason, idempotencyKey: input.idempotencyKey, expectedRecoveryValueMinor: expected, status: "EXECUTING", metadata: { traceId: input.traceId } });
  try {
    const providerResult = executableAction === "RETRY_PAYMENT" ? await input.paymentProvider.retryPayment({ merchantId: input.merchantId, customerId: current.customerId, sourceId: current.sourceId, amountMinor: current.amountAtRiskMinor, currency: current.currency }) : executableAction === "CREATE_PAYMENT_LINK" ? await input.paymentProvider.createPaymentLink({ merchantId: input.merchantId, customerId: current.customerId, sourceId: current.sourceId, amountMinor: current.amountAtRiskMinor, currency: current.currency }) : null;
    const result: ActionExecutionResult = { success: true, action: executableAction, provider: providerResult?.provider ?? "internal", providerReference: providerResult?.providerReference, outcome: providerResult?.outcome ?? (executableAction === "SCHEDULE_RETRY" ? "RETRY_SCHEDULED" : executableAction === "ESCALATE" ? "CASE_ESCALATED" : executableAction === "STOP" ? "CASE_STOPPED" : "CUSTOMER_CONTACTED"), amountRecoveredMinor: providerResult?.amountRecoveredMinor ?? 0n, interventionId: created.id, policy, idempotent: false, metadata: { ...providerResult?.metadata, traceId: input.traceId } };
    await input.repository.updateInterventionResult(created.id, result);
    if (providerResult?.outcome) await input.repository.recordOutcome({ merchantId: input.merchantId, recoveryCaseId: input.caseId, interventionId: created.id, type: providerResult.outcome, amountMinor: providerResult.amountRecoveredMinor, currency: current.currency, providerReference: providerResult.providerReference, metadata: providerResult.metadata });
    if (providerResult?.outcome === "PAYMENT_RECOVERED") { const attributed = attributeRecoveredRevenue({ amountAtRiskMinor: current.amountAtRiskMinor, alreadyAttributedMinor: current.recoveredAmountMinor, outcomeAmountMinor: providerResult.amountRecoveredMinor, outcomeIsSuccessful: true }); await input.repository.updateCase(input.merchantId, input.caseId, { recoveredAmountMinor: current.recoveredAmountMinor + attributed, status: "RECOVERED" }); }
    else if (executableAction === "ESCALATE") { transitionCase(current.status, "ESCALATED"); if (input.repository.createEscalation) await input.repository.createEscalation({ merchantId: input.merchantId, recoveryCaseId: input.caseId, reason: policy.reason, priority: current.amountAtRiskMinor >= input.policy.highValueThresholdMinor ? "CRITICAL" : "HIGH" }); await input.repository.updateCase(input.merchantId, input.caseId, { status: "ESCALATED", escalated: true }); }
    else if (executableAction === "STOP") { transitionCase(current.status, "STOPPED"); await input.repository.updateCase(input.merchantId, input.caseId, { status: "STOPPED" }); }
    else if (current.status === "ELIGIBLE") await input.repository.updateCase(input.merchantId, input.caseId, { status: "AWAITING_OUTCOME", attemptCount: current.attemptCount + (executableAction === "RETRY_PAYMENT" ? 1 : 0), contactCount: current.contactCount + (executableAction === "RETRY_PAYMENT" ? 0 : 1), lastContactAt: executableAction === "RETRY_PAYMENT" ? current.lastContactAt : (input.now ?? new Date()) });
    await input.repository.audit({ merchantId: input.merchantId, recoveryCaseId: input.caseId, traceId: input.traceId, eventType: "INTERVENTION_EXECUTED", reason: policy.reason, metadata: { action: executableAction, outcome: result.outcome, providerReference: result.providerReference } });
    return result;
  } catch (error) { const reason = error instanceof Error ? error.message : "Action execution failed."; const failedResult: ActionExecutionResult = { success: false, action: executableAction, provider: input.paymentProvider.providerName, interventionId: created.id, policy, idempotent: false, amountRecoveredMinor: 0n, metadata: { traceId: input.traceId, error: reason } }; await input.repository.updateInterventionResult(created.id, failedResult); await input.repository.audit({ merchantId: input.merchantId, recoveryCaseId: input.caseId, traceId: input.traceId, eventType: "INTERVENTION_EXECUTED", reason, metadata: { action: executableAction, failed: true } }); throw new ActionError("ACTION_FAILED", reason); }
}
