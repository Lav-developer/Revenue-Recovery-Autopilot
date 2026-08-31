/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPrisma } from "@/lib/db/prisma";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { previewCaseDetails } from "@/lib/preview/data";
export async function GET(request: Request) { try { const merchantId = merchantIdFromRequest(request); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: Object.values(previewCaseDetails).filter((item: any) => item.case.status === "ESCALATED").map((item: any) => ({ ...item.escalations[0], case: item.case, customer: item.customer })) }); const items = await getPrisma().escalation.findMany({ where: { merchantId }, orderBy: [{ priority: "desc" }, { createdAt: "desc" }], take: 100, include: { recoveryCase: { include: { customer: true } } } }); return jsonResponse({ data: items }); } catch (error) { return errorResponse(error); } }
