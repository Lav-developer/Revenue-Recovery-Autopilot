import { getPrisma } from "@/lib/db/prisma";
import { PrismaRecoveryCaseRepository } from "@/lib/db/repositories/recovery";
import { errorResponse, ApiError } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { previewCaseDetails } from "@/lib/preview/data";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { try { const merchantId = merchantIdFromRequest(request); const { id } = await context.params; if (process.env.PREVIEW_MODE === "true") { const preview = previewCaseDetails[id]; if (!preview) throw new ApiError(404, "CASE_NOT_FOUND", "Recovery case was not found."); return jsonResponse({ data: preview }); } const detail = await new PrismaRecoveryCaseRepository(getPrisma()).detail(merchantId, id); if (!detail) throw new ApiError(404, "CASE_NOT_FOUND", "Recovery case was not found."); return jsonResponse({ data: detail }); } catch (error) { return errorResponse(error); } }
