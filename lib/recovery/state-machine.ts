import type { DomainCaseStatus } from "./types";

const transitions: Record<DomainCaseStatus, readonly DomainCaseStatus[]> = {
  OPEN: ["ELIGIBLE", "STOPPED", "ESCALATED"],
  ELIGIBLE: ["PROCESSING", "AWAITING_OUTCOME", "STOPPED", "ESCALATED"],
  PROCESSING: ["AWAITING_OUTCOME", "RECOVERED", "FAILED", "STOPPED", "ESCALATED"],
  AWAITING_OUTCOME: ["RECOVERED", "FAILED", "STOPPED", "ESCALATED"],
  FAILED: ["ELIGIBLE", "STOPPED", "ESCALATED"],
  RECOVERED: ["RESOLVED"],
  STOPPED: ["RESOLVED"],
  ESCALATED: ["RESOLVED", "STOPPED", "RECOVERED"],
  RESOLVED: [],
};

export function canTransition(from: DomainCaseStatus, to: DomainCaseStatus): boolean { return transitions[from].includes(to); }
export function transitionCase(from: DomainCaseStatus, to: DomainCaseStatus): DomainCaseStatus {
  if (!canTransition(from, to)) throw new Error(`Invalid recovery case transition: ${from} -> ${to}`);
  return to;
}
export function allowedTransitions(from: DomainCaseStatus): readonly DomainCaseStatus[] { return transitions[from]; }
