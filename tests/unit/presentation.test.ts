import { describe, expect, it } from "vitest";
import { formatMinorUnits, formatPercent } from "@/lib/format/money";
describe("presentation safety", () => { it("formats minor units without fake values", () => { expect(formatMinorUnits("499900")).toBe("₹4,999.00"); expect(formatMinorUnits(0n)).toBe("₹0.00"); expect(formatMinorUnits("9000000000000000000")).toBe("₹90,000,000,000,000,000.00"); }); it("formats supplied percentages", () => { expect(formatPercent(33.333)).toBe("33.3%"); expect(formatPercent(undefined)).toBe("—"); }); });
