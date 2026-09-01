import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date("2026-01-15T12:00:00.000Z");
const money = (rupees: number) => BigInt(rupees * 100);
const eventTypes = ["PAYMENT_FAILED", "CHECKOUT_ABANDONED", "SUBSCRIPTION_PAYMENT_FAILED", "INVOICE_OVERDUE"];
const paymentMethods = ["CARD", "UPI", "NETBANKING", "WALLET", "EMI"];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.outcomeEvent.deleteMany();
  await prisma.intervention.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.recoveryCase.deleteMany();
  await prisma.revenueEvent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();

  const merchant = await prisma.merchant.create({ data: { id: "merchant_demo", name: "Acme Commerce India", defaultCurrency: "INR", createdAt: now, updatedAt: now } });

  const customers = [];
  for (let i = 0; i < 1000; i++) {
    const segment = i % 17 === 0 ? "ENTERPRISE" : i % 7 === 0 ? "VIP" : i % 3 === 0 ? "GROWTH" : "STANDARD";
    customers.push(await prisma.customer.create({ data: {
      id: `customer_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id,
      name: `${["Aarav", "Meera", "Kabir", "Ananya", "Ishaan"][i % 5]} ${["Sharma", "Gupta", "Khan", "Verma", "Patel"][i % 5]}`,
      email: `demo.customer.${i + 1}@example.test`, phone: `+91980000${String(i).padStart(4, "0")}`,
      segment, optedOut: i % 97 === 0, createdAt: new Date(now.getTime() - (i % 30) * 86400000), updatedAt: now
    }}));
  }

  for (let i = 0; i < 1000; i++) {
    const customer = customers[i];
    const type = eventTypes[i % 4];
    const amountRupees = 450 + ((i * 731) % 74550);
    const amountMinor = money(amountRupees);
    const sourceId = `${type.toLowerCase()}_demo_${String(i + 1).padStart(4, "0")}`;
    const occurredAt = new Date(now.getTime() - (i % 30) * 86400000 - (i % 12) * 3600000);

    if (type === "PAYMENT_FAILED" || type === "CHECKOUT_ABANDONED") {
      await prisma.transaction.create({ data: {
        id: `transaction_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id, customerId: customer.id,
        amountMinor, currency: "INR", status: type === "PAYMENT_FAILED" ? "FAILED" : "PENDING",
        paymentMethod: paymentMethods[i % paymentMethods.length], failureReason: type === "PAYMENT_FAILED" ? ["expired_card", "insufficient_funds", "bank_declined", "network_error"][i % 4] : null,
        providerReference: `pay_demo_${i + 1}`, createdAt: occurredAt
      }});
    } else if (type === "SUBSCRIPTION_PAYMENT_FAILED") {
      await prisma.subscription.create({ data: { id: sourceId, merchantId: merchant.id, customerId: customer.id, amountMinor, currency: "INR", status: "PAST_DUE", nextBillingAt: occurredAt, failureCount: 1 + (i % 3), createdAt: occurredAt, updatedAt: now } });
    } else {
      await prisma.invoice.create({ data: { id: sourceId, merchantId: merchant.id, customerId: customer.id, amountMinor, currency: "INR", dueDate: occurredAt, status: "OVERDUE", createdAt: occurredAt, updatedAt: now } });
    }

    await prisma.revenueEvent.create({ data: { id: `event_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id, customerId: customer.id, type, sourceId, idempotencyKey: `demo-idempotency-${i + 1}`, payload: { demo: true, amountRupees, sequence: i + 1 }, occurredAt, processedAt: now, createdAt: occurredAt } });

    const highValue = amountRupees >= 50000;
    const stopped = i % 19 === 0;
    const recovered = !highValue && !stopped && i % 4 === 0;
    const status = highValue ? "ESCALATED" : stopped ? "STOPPED" : recovered ? "RECOVERED" : i % 5 === 0 ? "AWAITING_OUTCOME" : "ELIGIBLE";
    const riskLevel = highValue ? "CRITICAL" : amountRupees >= 20000 ? "HIGH" : amountRupees >= 5000 ? "MEDIUM" : "LOW";
    const action = highValue ? "ESCALATE" : type === "PAYMENT_FAILED" ? (i % 2 === 0 ? "CREATE_PAYMENT_LINK" : "RETRY_PAYMENT") : type === "CHECKOUT_ABANDONED" ? "SEND_RECOVERY_MESSAGE" : type === "SUBSCRIPTION_PAYMENT_FAILED" ? "SCHEDULE_RETRY" : "SEND_REMINDER";
    const recoveredMinor = recovered ? BigInt(Math.floor(Number(amountMinor) * (0.72 + (i % 3) * 0.07))) : 0n;
    const reference = `RR-${String(10000 + i + 1)}`;
    const recoveryCase = await prisma.recoveryCase.create({ data: {
      id: `case_demo_${String(i + 1).padStart(4, "0")}`, reference, merchantId: merchant.id, customerId: customer.id,
      sourceType: type, sourceId, amountAtRiskMinor: amountMinor, currency: "INR", status, riskLevel,
      diagnosisCategory: type === "PAYMENT_FAILED" ? ["expired_card", "insufficient_funds", "bank_declined"][i % 3] : type.toLowerCase(),
      diagnosisConfidence: (0.76 + (i % 20) / 100).toFixed(4), recoveryScore: (0.42 + (i % 50) / 100).toFixed(4),
      recommendedAction: action, attemptCount: i % 4, contactCount: i % 4, nextActionAt: status === "AWAITING_OUTCOME" ? new Date(now.getTime() + 86400000) : null,
      lastContactAt: i % 4 > 0 ? occurredAt : null, recoveredAmountMinor: recoveredMinor,
      escalatedAt: highValue ? now : null, stoppedAt: stopped ? now : null, stopReason: stopped ? "maximum_attempts_reached" : null, createdAt: occurredAt, updatedAt: now
    }});

    if (recovered || highValue) {
      const intervention = await prisma.intervention.create({ data: {
        id: `intervention_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id, recoveryCaseId: recoveryCase.id, actionType: action,
        status: highValue ? "CANCELLED" : "SUCCEEDED", reason: highValue ? "High-value case requires human review" : "Deterministic demo outcome",
        expectedRecoveryValueMinor: BigInt(Math.floor(Number(amountMinor) * 0.65)), expectedProbability: "0.6500", actionSuccessProbability: "0.7200",
        policyDecision: highValue ? "ESCALATE" : "ALLOW", policyRule: highValue ? "high_value_escalation" : "action_allowed", executedAt: now, outcomeAt: recovered ? now : null,
        recoveredAmountMinor: recoveredMinor, providerReference: recovered ? `mock_demo_${i + 1}` : null, metadata: { seeded: true }
      }});
      if (recovered) await prisma.outcomeEvent.create({ data: { id: `outcome_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id, recoveryCaseId: recoveryCase.id, interventionId: intervention.id, type: "PAYMENT_RECOVERED", amountMinor: recoveredMinor, currency: "INR", providerReference: intervention.providerReference, occurredAt: now, metadata: { seeded: true } } });
      if (highValue) await prisma.escalation.create({ data: { id: `escalation_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id, recoveryCaseId: recoveryCase.id, priority: amountRupees >= 75000 ? "CRITICAL" : "HIGH", reason: "High-value revenue risk requires human review", status: "OPEN", createdAt: now, updatedAt: now } });
    }
    await prisma.auditLog.create({ data: { id: `audit_demo_${String(i + 1).padStart(4, "0")}`, merchantId: merchant.id, recoveryCaseId: recoveryCase.id, traceId: `rr_demo_trace_${i + 1}`, actorType: "SYSTEM", eventType: "CASE_CREATED", decision: status, reason: "Seeded deterministic demo case", metadata: { seeded: true, eventType: type }, createdAt: occurredAt } });
  }

  const policyRules = { maxAttempts: 3, maxContacts: 3, cooldownHours: 24, highValueThresholdMinor: money(50000).toString(), afterMaximum: "STOP", minimumRecoveryScore: 0.25 };
  for (const type of eventTypes) await prisma.policy.create({ data: { id: `policy_demo_${type.toLowerCase()}`, merchantId: merchant.id, name: `${type} default policy`, eventType: type, version: 1, rulesJson: policyRules, enabled: true, createdAt: now, updatedAt: now } });

  console.log(`Seeded merchant ${merchant.id} with 1,000 deterministic revenue-risk cases.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
