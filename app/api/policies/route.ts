import { getPrisma } from "@/lib/db/prisma";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
export async function GET(request: Request) { try { const merchantId = merchantIdFromRequest(request); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: ["PAYMENT_FAILED", "CHECKOUT_ABANDONED", "SUBSCRIPTION_PAYMENT_FAILED", "INVOICE_OVERDUE"].map((eventType) => ({ id: `preview-policy-${eventType}`, name: `${eventType.replaceAll("_", " ")} policy`, eventType, version: 1, enabled: true, rulesJson: { maxAttempts: 3, maxContacts: 3, cooldownHours: 24, highValueThresholdMinor: "5000000", afterMaximum: "STOP" } })) }); const items = await getPrisma().policy.findMany({ where: { merchantId }, orderBy: [{ eventType: "asc" }, { version: "desc" }] }); return jsonResponse({ data: items }); } catch (error) { return errorResponse(error); } }
