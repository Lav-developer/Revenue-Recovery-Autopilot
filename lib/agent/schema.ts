import { z } from "zod";

export const agentActionSchema = z.enum(["retry_payment", "create_payment_link", "send_recovery_message", "send_reminder", "schedule_retry", "escalate_case", "stop_case"]);
export const agentDecisionSchema = z.object({
  case_id: z.string().min(1),
  diagnosis: z.object({ category: z.enum(["expired_card", "insufficient_funds", "bank_declined", "network_error", "checkout_abandonment", "subscription_payment_failure", "overdue_invoice", "unknown"]), confidence: z.number().min(0).max(1) }),
  decision: z.object({ action: agentActionSchema, reason: z.string().trim().min(1).max(1000), expected_recovery_value_minor: z.union([z.bigint(), z.number().int().nonnegative(), z.string().regex(/^\d+$/)]).transform((value) => BigInt(value) ) }),
  next_step: z.object({ type: z.enum(["await_outcome", "schedule_retry", "human_review", "stop_workflow"]), cooldown_hours: z.number().int().min(0).max(720) }),
  escalate: z.boolean(),
}).strict();

export type AgentDecisionOutput = z.infer<typeof agentDecisionSchema>;
