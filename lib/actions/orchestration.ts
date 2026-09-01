import { domainActionForAgentAction } from "@/lib/agent/context";
import type { AgentRunResult } from "@/lib/agent/agent";
import type { PaymentProvider } from "@/lib/payments/provider";
import type { ActionRepository, ActionExecutionResult } from "./types";
import { executeRecoveryAction } from "./executor";
import { ActionError } from "./errors";

export async function executeAgentRecommendation(input: { agentResult: AgentRunResult; repository: ActionRepository; paymentProvider: PaymentProvider; idempotencyKey: string; now?: Date }): Promise<ActionExecutionResult> {
  if (input.agentResult.safeFailure || !input.agentResult.recommendation) throw new ActionError("ACTION_NOT_ALLOWED", "A failed agent run cannot execute an action.");
  return executeRecoveryAction({ merchantId: input.agentResult.context.merchantId, caseId: input.agentResult.context.caseId, action: domainActionForAgentAction(input.agentResult.recommendation.decision.action), policy: input.agentResult.context.policy, repository: input.repository, paymentProvider: input.paymentProvider, traceId: input.agentResult.traceId, idempotencyKey: input.idempotencyKey, now: input.now });
}
