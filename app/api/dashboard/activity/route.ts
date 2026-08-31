import { getPrisma } from "@/lib/db/prisma";
import { PrismaMetricsRepository } from "@/lib/db/repositories/metrics";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { getActivity } from "@/lib/metrics/service";
import { previewActivity } from "@/lib/preview/data";
import { recentActivity } from "@/lib/metrics/activity";
export async function GET(request: Request) { try { const merchantId = merchantIdFromRequest(request); const rawLimit = new URL(request.url).searchParams.get("limit"); const limit = rawLimit ? Math.min(100, Math.max(1, Number(rawLimit))) : 20; if (!Number.isInteger(limit)) throw new Error("invalid limit"); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: recentActivity(previewActivity, limit) }); return jsonResponse({ data: await getActivity(new PrismaMetricsRepository(getPrisma()), merchantId, limit) }); } catch (error) { return errorResponse(error); } }
