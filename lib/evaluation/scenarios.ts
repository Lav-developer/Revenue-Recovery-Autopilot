import type { DemoScenarioName } from "./types";
export const DEMO_RUN_ID = "recovery-autopilot-demo-v1";
export const DEMO_SCENARIOS: readonly { name: DemoScenarioName; amountMinor: bigint; failureReason: string; attempts: number; providerScenario: "SUCCESSFUL_RETRY" | "PAYMENT_LINK_CREATED" | "FAILED_RETRY" }[] = [
  { name: "SUCCESSFUL_RETRY", amountMinor: 499900n, failureReason: "network_error", attempts: 0, providerScenario: "SUCCESSFUL_RETRY" },
  { name: "PAYMENT_LINK_RECOVERY", amountMinor: 799900n, failureReason: "expired_card", attempts: 0, providerScenario: "PAYMENT_LINK_CREATED" },
  { name: "HIGH_VALUE_ESCALATION", amountMinor: 7500000n, failureReason: "expired_card", attempts: 0, providerScenario: "PAYMENT_LINK_CREATED" },
  { name: "MAXIMUM_ATTEMPTS", amountMinor: 129900n, failureReason: "network_error", attempts: 3, providerScenario: "FAILED_RETRY" },
];
