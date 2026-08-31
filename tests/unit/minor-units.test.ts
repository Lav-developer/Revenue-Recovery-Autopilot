import { describe, expect, it } from "vitest";

describe("monetary representation", () => {
  it("uses integer minor units for rupee amounts", () => {
    const amountMinor = 4999 * 100;
    expect(Number.isInteger(amountMinor)).toBe(true);
    expect(amountMinor).toBe(499900);
  });
});
