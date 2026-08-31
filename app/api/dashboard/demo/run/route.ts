import { getPrisma } from "@/lib/db/prisma";
import { merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { runRecoverySimulation } from "@/lib/evaluation/simulation";
export async function POST(request: Request) { try { const merchantId = merchantIdFromRequest(request); return jsonResponse({ data: await runRecoverySimulation(getPrisma(), merchantId) }); } catch (error) { return errorResponse(error); } }
