import { beforeAll, describe, expect, it } from "vitest";

const requiresPostgres = Boolean(process.env.TEST_DATABASE_URL);
const scope = { "x-merchant-id": "integration_merchant" };
const event = (key: string, merchantId = "integration_merchant") => ({ merchantId, customerId: "integration_customer", type: "PAYMENT_FAILED", sourceId: `source-${key}`, amountMinor: "499900", currency: "INR", occurredAt: "2026-01-01T12:00:00.000Z", idempotencyKey: key, payload: { integration: true } });
const request = (url: string, body?: unknown) => new Request(`http://localhost${url}`, { method: body === undefined ? "GET" : "POST", headers: { ...scope, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

let ingest: typeof import("@/app/api/events/route").POST;
let batch: typeof import("@/app/api/events/batch/route").POST;
let listCases: typeof import("@/app/api/recovery-cases/route").GET;
let detailCase: typeof import("@/app/api/recovery-cases/[id]/route").GET;
let processCase: typeof import("@/app/api/recovery-cases/[id]/process/route").POST;
let stopCase: typeof import("@/app/api/recovery-cases/[id]/stop/route").POST;
let escalateCase: typeof import("@/app/api/recovery-cases/[id]/escalate/route").POST;

describe.skipIf(!requiresPostgres)("PostgreSQL API integration (requires TEST_DATABASE_URL and migrated schema)", () => {
  beforeAll(async () => {
    ingest = (await import("@/app/api/events/route")).POST;
    batch = (await import("@/app/api/events/batch/route")).POST;
    listCases = (await import("@/app/api/recovery-cases/route")).GET;
    detailCase = (await import("@/app/api/recovery-cases/[id]/route")).GET;
    processCase = (await import("@/app/api/recovery-cases/[id]/process/route")).POST;
    stopCase = (await import("@/app/api/recovery-cases/[id]/stop/route")).POST;
    escalateCase = (await import("@/app/api/recovery-cases/[id]/escalate/route")).POST;
  });
  it("ingests a single event and persists its case/audit trail", async () => { const response = await ingest(request("/api/events", event("single"))); expect(response.status).toBe(201); const body = await response.json(); expect(body.data.recoveryCase).toBeTruthy(); });
  it("ingests a bounded batch", async () => { const response = await batch(request("/api/events/batch", { events: [event("batch-1"), event("batch-2")] })); expect(response.status).toBe(200); expect((await response.json()).count).toBe(2); });
  it("returns duplicate/idempotent result on repeated ingestion", async () => { await ingest(request("/api/events", event("duplicate"))); const response = await ingest(request("/api/events", event("duplicate"))); expect(response.status).toBe(200); expect((await response.json()).duplicate).toBe(true); });
  it("rejects merchant mismatch", async () => { const response = await ingest(request("/api/events", event("mismatch", "other_merchant"))); expect(response.status).toBe(403); });
  it("lists cases with pagination and filtering", async () => { const response = await listCases(request("/api/recovery-cases?page=1&pageSize=10&status=OPEN")); expect(response.status).toBe(200); expect((await response.json()).data.pageSize).toBe(10); });
  it("returns case detail", async () => { const created = await ingest(request("/api/events", event("detail"))); const id = (await created.json()).data.recoveryCase.id; const response = await detailCase(request(`/api/recovery-cases/${id}`), params(id)); expect(response.status).toBe(200); expect((await response.json()).data.auditTimeline).toBeDefined(); });
  it("processes a case through deterministic eligibility evaluation", async () => { const created = await ingest(request("/api/events", event("process"))); const id = (await created.json()).data.recoveryCase.id; const response = await processCase(request(`/api/recovery-cases/${id}/process`, {}), params(id)); expect(response.status).toBe(200); });
  it("stops a case", async () => { const created = await ingest(request("/api/events", event("stop"))); const id = (await created.json()).data.recoveryCase.id; const response = await stopCase(request(`/api/recovery-cases/${id}/stop`, { reason: "Operator stop" }), params(id)); expect(response.status).toBe(200); });
  it("escalates a case", async () => { const created = await ingest(request("/api/events", event("escalate"))); const id = (await created.json()).data.recoveryCase.id; const response = await escalateCase(request(`/api/recovery-cases/${id}/escalate`, { priority: "HIGH" }), params(id)); expect(response.status).toBe(200); });
  it("rejects invalid state transitions", async () => { const created = await ingest(request("/api/events", event("invalid-transition"))); const id = (await created.json()).data.recoveryCase.id; await stopCase(request(`/api/recovery-cases/${id}/stop`, {}), params(id)); const response = await stopCase(request(`/api/recovery-cases/${id}/stop`, {}), params(id)); expect(response.status).toBe(409); });
  it("rejects invalid payloads", async () => { const response = await ingest(request("/api/events", { customerId: "missing-required-fields" })); expect(response.status).toBe(400); });
  it("returns not found for a missing case", async () => { const response = await detailCase(request("/api/recovery-cases/missing"), params("missing")); expect(response.status).toBe(404); });
  it("preserves audit persistence through process", async () => { const created = await ingest(request("/api/events", event("audit"))); const id = (await created.json()).data.recoveryCase.id; await processCase(request(`/api/recovery-cases/${id}/process`, {}), params(id)); const response = await detailCase(request(`/api/recovery-cases/${id}`), params(id)); expect((await response.json()).data.auditTimeline.length).toBeGreaterThan(0); });
  it("rejects a batch larger than 100 events", async () => { const response = await batch(request("/api/events/batch", { events: Array.from({ length: 101 }, (_, index) => event(`too-large-${index}`)) })); expect(response.status).toBe(400); });
  it("isolates cases by merchant", async () => { const created = await ingest(request("/api/events", event("isolation"))); const id = (await created.json()).data.recoveryCase.id; const response = await detailCase(new Request(`http://localhost/api/recovery-cases/${id}`, { headers: { "x-merchant-id": "other_merchant" } }), params(id)); expect(response.status).toBe(404); });
});
