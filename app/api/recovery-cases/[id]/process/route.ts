import { getPrisma } from "@/lib/db/prisma";
import { processRequestSchema, merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { processCase } from "@/lib/api/services";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const merchantId = merchantIdFromRequest(request); const { id } = await context.params; const body = processRequestSchema.parse(await request.json().catch(() => ({}))); const result = await processCase(getPrisma(), merchantId, id, crypto.randomUUID(), body.action); return jsonResponse({ data: result }); } catch (error) { return errorResponse(error); } }
