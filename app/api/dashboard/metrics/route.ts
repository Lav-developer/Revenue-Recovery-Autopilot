import { getPrisma } from "@/lib/db/prisma";
import { PrismaMetricsRepository } from "@/lib/db/repositories/metrics";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { getExecutiveMetrics } from "@/lib/metrics/service";
import { aggregateExecutiveMetrics } from "@/lib/metrics/aggregation";
import { previewCases, previewInterventions, previewOutcomes } from "@/lib/preview/data";
export async function GET(request: Request) { try { const merchantId = merchantIdFromRequest(request); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: aggregateExecutiveMetrics(previewCases, previewInterventions, previewOutcomes) }); return jsonResponse({ data: await getExecutiveMetrics(new PrismaMetricsRepository(getPrisma()), merchantId) }); } catch (error) { return errorResponse(error); } }
