import { getPrisma } from "@/lib/db/prisma";
import { escalateCase } from "@/lib/api/services";
import { escalationRequestSchema, merchantIdFromRequest } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const merchantId = merchantIdFromRequest(request); const { id } = await context.params; const body = escalationRequestSchema.parse(await request.json().catch(() => ({}))); const result = await escalateCase(getPrisma(), merchantId, id, crypto.randomUUID(), body.reason ?? "Escalated for human review.", body.priority ?? "HIGH"); return jsonResponse({ data: result }); } catch (error) { return errorResponse(error); } }
