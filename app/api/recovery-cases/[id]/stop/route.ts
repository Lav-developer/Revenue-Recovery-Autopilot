import { getPrisma } from "@/lib/db/prisma";
import { stopCase } from "@/lib/api/services";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { merchantIdFromRequest } from "@/lib/api/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const merchantId = merchantIdFromRequest(request); const { id } = await context.params; const body = await request.json().catch(() => ({})); const result = await stopCase(getPrisma(), merchantId, id, crypto.randomUUID(), typeof body.reason === "string" ? body.reason : "Stopped by operator."); return jsonResponse({ data: result }); } catch (error) { return errorResponse(error); } }
