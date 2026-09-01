import type { PolicyConfig, RecoveryCaseSnapshot, StoppingRuleResult } from "./types";

export function evaluateStoppingRules(input: RecoveryCaseSnapshot, policy: PolicyConfig): StoppingRuleResult {
  if (input.paymentAlreadySuccessful || input.status === "RECOVERED") return { shouldStop: true, shouldEscalate: false, reasonCode: "ALREADY_PAID", reason: "Payment has already been successfully recorded.", nextState: "STOPPED" };
  if (input.customerOptedOut) return { shouldStop: true, shouldEscalate: false, reasonCode: "CUSTOMER_OPTED_OUT", reason: "Customer has opted out of recovery contact.", nextState: "STOPPED" };
  if (input.status === "STOPPED") return { shouldStop: true, shouldEscalate: false, reasonCode: "ALREADY_STOPPED", reason: "Recovery case is already stopped.", nextState: "STOPPED" };
  if (input.status === "ESCALATED" || input.escalated) return { shouldStop: false, shouldEscalate: true, reasonCode: "ALREADY_ESCALATED", reason: "Recovery case is already escalated for human handling.", nextState: "ESCALATED" };
  if (input.attemptCount >= policy.maxAttempts) return policy.afterMaximumAttempts === "ESCALATE" ? { shouldStop: false, shouldEscalate: true, reasonCode: "MAX_ATTEMPTS", reason: "Maximum recovery attempts have been reached.", nextState: "ESCALATED" } : { shouldStop: true, shouldEscalate: false, reasonCode: "MAX_ATTEMPTS", reason: "Maximum recovery attempts have been reached.", nextState: "STOPPED" };
  if (input.contactCount >= policy.maxContacts) return policy.afterMaximumContacts === "ESCALATE" ? { shouldStop: false, shouldEscalate: true, reasonCode: "MAX_CONTACTS", reason: "Maximum customer contacts have been reached.", nextState: "ESCALATED" } : { shouldStop: true, shouldEscalate: false, reasonCode: "MAX_CONTACTS", reason: "Maximum customer contacts have been reached.", nextState: "STOPPED" };
  if (input.recoveryScore !== null && input.recoveryScore < policy.minimumRecoveryScore) return { shouldStop: true, shouldEscalate: false, reasonCode: "LOW_RECOVERY_PROBABILITY", reason: "Recovery probability is below the merchant minimum.", nextState: "STOPPED" };
  return { shouldStop: false, shouldEscalate: false, reasonCode: "CONTINUE", reason: "No stopping condition has been met.", nextState: "ELIGIBLE" };
}
