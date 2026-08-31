import { getPrisma } from "@/lib/db/prisma";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { previewCases } from "@/lib/preview/data";
export async function GET(request: Request) { try { const merchantId = merchantIdFromRequest(request); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: previewCases.map((item, index) => ({ id: `preview-customer-${index + 1}`, name: `Preview Customer ${index + 1}`, email: "Hidden in preview", segment: item.status === "ESCALATED" ? "ENTERPRISE" : "VIP", optedOut: false, caseCount: 1 })) }); const customers = await getPrisma().customer.findMany({ where: { merchantId }, orderBy: { createdAt: "desc" }, take: 100, include: { _count: { select: { recoveryCases: true, transactions: true } } } }); return jsonResponse({ data: customers }); } catch (error) { return errorResponse(error); } }
