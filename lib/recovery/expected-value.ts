import type { ExpectedRecoveryValueInput } from "./types";

const BASIS_POINTS = 10_000n;
function assertProbability(value: bigint, name: string): void {
  if (value < 0n || value > BASIS_POINTS) throw new RangeError(`${name} must be between 0 and 10000 basis points`);
}

export function calculateExpectedRecoveryValue(input: ExpectedRecoveryValueInput): bigint {
  if (input.amountAtRiskMinor < 0n) throw new RangeError("amountAtRiskMinor cannot be negative");
  assertProbability(input.recoveryProbabilityBasisPoints, "recoveryProbabilityBasisPoints");
  assertProbability(input.actionSuccessProbabilityBasisPoints, "actionSuccessProbabilityBasisPoints");
  return input.amountAtRiskMinor * input.recoveryProbabilityBasisPoints * input.actionSuccessProbabilityBasisPoints / (BASIS_POINTS * BASIS_POINTS);
}

export function probabilityToBasisPoints(probability: number): bigint {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new RangeError("probability must be between 0 and 1");
  return BigInt(Math.round(probability * 10_000));
}
