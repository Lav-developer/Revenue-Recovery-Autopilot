import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) { super(message); this.name = "ApiError"; }
}
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof ZodError) return new ApiError(400, "INVALID_PAYLOAD", "Request payload is invalid.", error.flatten());
  if (error instanceof Error && error.message.startsWith("Invalid recovery case transition")) return new ApiError(409, "INVALID_STATE_TRANSITION", error.message);
  return new ApiError(500, "DATABASE_ERROR", "The request could not be completed.");
}
export function errorResponse(error: unknown): Response { const apiError = toApiError(error); return Response.json({ error: { code: apiError.code, message: apiError.message, details: apiError.details } }, { status: apiError.status }); }
