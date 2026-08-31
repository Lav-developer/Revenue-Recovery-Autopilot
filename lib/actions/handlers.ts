import type { ExecutableAction } from "./types";
export const isSideEffectAction = (action: ExecutableAction) => action === "RETRY_PAYMENT" || action === "CREATE_PAYMENT_LINK" || action === "SEND_RECOVERY_MESSAGE" || action === "SEND_REMINDER" || action === "SCHEDULE_RETRY" || action === "ESCALATE" || action === "STOP";
