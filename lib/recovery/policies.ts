import type { DomainAction, PolicyConfig, PolicyEvaluationResult, RecoveryCaseSnapshot } from "./types";
import { evaluateStoppingRules } from "./stopping-rules";

export function evaluatePolicy(input: RecoveryCaseSnapshot, action: DomainAction, now: Date, policy: PolicyConfig): PolicyEvaluationResult {
  if (input.paymentAlreadySuccessful || input.status === "RECOVERED") return { outcome: "STOP", ruleCode: "ALREADY_PAID", reason: "Payment has already been successfully recorded." };
  if (input.customerOptedOut) return { outcome: "STOP", ruleCode: "CUSTOMER_OPTED_OUT", reason: "Customer has opted out of recovery contact." };
  if (input.status === "STOPPED") return { outcome: "STOP", ruleCode: "ALREADY_STOPPED", reason: "Recovery case is already stopped." };
  if (input.status === "ESCALATED" || input.escalated) return { outcome: "ESCALATE", ruleCode: "ALREADY_ESCALATED", reason: "Recovery case is already escalated for human handling." };
  if (input.attemptCount >= policy.maxAttempts) return { outcome: policy.afterMaximumAttempts, ruleCode: "MAX_ATTEMPTS", reason: "Maximum recovery attempts have been reached." };
  if (input.contactCount >= policy.maxContacts) return { outcome: policy.afterMaximumContacts, ruleCode: "MAX_CONTACTS", reason: "Maximum customer contacts have been reached." };
  if (input.amountAtRiskMinor >= policy.highValueThresholdMinor) return { outcome: "ESCALATE", ruleCode: "HIGH_VALUE", reason: "Amount at risk meets the high-value escalation threshold." };
  if (!policy.supportedActions.includes(action)) return { outcome: "REJECT", ruleCode: "UNSUPPORTED_ACTION", reason: `Action ${action} is not supported by this policy.` };
  if (input.lastContactAt) {
    const nextAllowedAt = new Date(input.lastContactAt.getTime() + policy.cooldownHours * 60 * 60 * 1000);
    if (now < nextAllowedAt) return { outcome: "WAIT", ruleCode: "COOLDOWN", reason: "Minimum customer contact cooldown has not elapsed.", nextAllowedAt };
  }
  if (input.recoveryScore !== null && input.recoveryScore < policy.minimumRecoveryScore) return { outcome: "STOP", ruleCode: "LOW_RECOVERY_PROBABILITY", reason: "Recovery probability is below the merchant minimum." };
  const stopping = evaluateStoppingRules(input, policy);
  if (stopping.shouldEscalate) return { outcome: "ESCALATE", ruleCode: stopping.reasonCode as PolicyEvaluationResult["ruleCode"], reason: stopping.reason };
  if (stopping.shouldStop) return { outcome: "STOP", ruleCode: stopping.reasonCode as PolicyEvaluationResult["ruleCode"], reason: stopping.reason };
  return { outcome: "ALLOW", ruleCode: "ACTION_ALLOWED", reason: "Action is supported and all deterministic policy checks passed." };
}
