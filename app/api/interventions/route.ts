import { getPrisma } from "@/lib/db/prisma";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { previewInterventions } from "@/lib/preview/data";
export async function GET(request: Request) { try { const merchantId = merchantIdFromRequest(request); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: previewInterventions }); const items = await getPrisma().intervention.findMany({ where: { merchantId }, orderBy: { createdAt: "desc" }, take: 100, include: { recoveryCase: { include: { customer: true } } } }); return jsonResponse({ data: items }); } catch (error) { return errorResponse(error); } }
