import { getPrisma } from "@/lib/db/prisma";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { runRecoverySimulation } from "@/lib/evaluation/simulation";
import { getPreviewDemoResult } from "@/lib/preview/demo";
export async function POST(request: Request) { try { const merchantId = merchantIdFromRequest(request); if (process.env.PREVIEW_MODE === "true") return jsonResponse({ data: getPreviewDemoResult() }); return jsonResponse({ data: await runRecoverySimulation(getPrisma(), merchantId) }); } catch (error) { return errorResponse(error); } }
