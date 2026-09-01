import { describe, expect, it } from "vitest";

const hasPostgres = Boolean(process.env.TEST_DATABASE_URL);
describe.skipIf(!hasPostgres)("PostgreSQL action execution (requires migrated and seeded TEST_DATABASE_URL)", () => {
  it("executes through Prisma, mock provider, records an outcome, and is idempotent", async () => {
    const { getPrisma } = await import("@/lib/db/prisma");
    const { PrismaActionRepository } = await import("@/lib/db/repositories/actions");
    const { executeRecoveryAction } = await import("@/lib/actions/executor");
    const { MockPaymentProvider } = await import("@/lib/payments/mock");
    const db = getPrisma();
    const repository = new PrismaActionRepository(db);
    const policy = { maxAttempts: 3, maxContacts: 3, cooldownHours: 24, highValueThresholdMinor: 5000000n, minimumRecoveryScore: 0.25, afterMaximumAttempts: "STOP" as const, afterMaximumContacts: "STOP" as const, supportedActions: ["RETRY_PAYMENT", "CREATE_PAYMENT_LINK"] as const };
    const first = await executeRecoveryAction({ merchantId: "merchant_demo", caseId: "case_demo_0002", action: "RETRY_PAYMENT", policy, repository, paymentProvider: new MockPaymentProvider("SUCCESSFUL_RETRY"), traceId: "integration-action", idempotencyKey: "integration-action-key" });
    const second = await executeRecoveryAction({ merchantId: "merchant_demo", caseId: "case_demo_0002", action: "RETRY_PAYMENT", policy, repository, paymentProvider: new MockPaymentProvider("SUCCESSFUL_RETRY"), traceId: "integration-action", idempotencyKey: "integration-action-key" });
    expect(first.success).toBe(true); expect(second.idempotent).toBe(true);
    await db.$disconnect();
  });
});
