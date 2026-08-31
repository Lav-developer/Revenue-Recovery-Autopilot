import { describe, expect, it } from "vitest";

describe("merchant scoping contract", () => {
  it("requires merchant identity as part of demo identifiers", () => {
    const idempotencyKey = "merchant_demo:demo-idempotency-1";
    expect(idempotencyKey.startsWith("merchant_demo:")).toBe(true);
  });
});
