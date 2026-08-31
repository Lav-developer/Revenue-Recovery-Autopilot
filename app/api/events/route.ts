import { getPrisma } from "@/lib/db/prisma";
import { eventRequestSchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { ingestEvent } from "@/lib/api/services";
import { merchantIdFromRequest } from "@/lib/api/validation";

export async function POST(request: Request) { try { const merchantId = merchantIdFromRequest(request); const body = eventRequestSchema.parse(await request.json()); const result = await ingestEvent(getPrisma(), body, merchantId, crypto.randomUUID()); return jsonResponse({ data: result, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 }); } catch (error) { return errorResponse(error); } }
