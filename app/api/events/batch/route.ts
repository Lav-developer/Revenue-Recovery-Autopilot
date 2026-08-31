import { getPrisma } from "@/lib/db/prisma";
import { batchEventSchema } from "@/lib/api/validation";
import { errorResponse, toApiError } from "@/lib/api/errors";
import { jsonResponse } from "@/lib/api/json";
import { ingestEvent } from "@/lib/api/services";
import { merchantIdFromRequest } from "@/lib/api/validation";

export async function POST(request: Request) { try { const merchantId = merchantIdFromRequest(request); const body = batchEventSchema.parse(await request.json()); const results = []; for (const event of body.events) { try { results.push({ idempotencyKey: event.idempotencyKey, ...(await ingestEvent(getPrisma(), event, merchantId, crypto.randomUUID())) }); } catch (error) { const apiError = toApiError(error); results.push({ idempotencyKey: event.idempotencyKey, error: { code: apiError.code, message: apiError.message } }); } } return jsonResponse({ data: results, count: results.length }, { status: 200 }); } catch (error) { return errorResponse(error); } }
