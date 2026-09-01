# Revenue Recovery Autopilot

Revenue Recovery Autopilot is a bounded, auditable revenue-recovery decision engine for payment failures, checkout abandonment, subscription failures, and overdue receivables. It exists to answer a measurable business question: how much revenue did the recovery workflow actually recover?

## Architecture

```text
Revenue event → recovery case → context/score → agent recommendation
→ deterministic policy/stopping rules → action executor → provider
→ outcome event → attribution → metrics → operations dashboard
```

The safety boundary is explicit:

> LLM recommends → deterministic policy authorizes → executor performs → outcome proves → metrics measure.

The LLM cannot call payment infrastructure, write records, override policy, or claim recovery. Actual recovery is calculated from successful persisted payment outcome events and capped by the case amount at risk.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The app uses Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL. Monetary amounts are stored as integer minor units (`BigInt`). Configure `DATABASE_URL` and a local `AUTH_SECRET` in `.env`. Demo requests use the merchant scope configured by `NEXT_PUBLIC_DEMO_MERCHANT_ID` or `merchant_demo`.

## Demo mode

The dashboard is labeled **DEMO MODE · Simulated payment environment**. Use **Run recovery simulation** to run four deterministic scenarios:

- successful retry
- payment-link creation followed by a successful payment outcome
- high-value recommendation blocked and escalated by policy
- maximum-attempt recommendation stopped without payment execution

Run ID `recovery-autopilot-demo-v1` makes repeat runs idempotent. No real customers are charged. The dashboard refreshes metrics, funnel, activity, and scenario results from persisted API data.

## Razorpay

The server-side `RazorpayProvider` adapter uses `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` only on the server. The demo defaults to deterministic mock payment infrastructure. Razorpay is not required for the demo.

## Testing

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

PostgreSQL integration tests run when `DATABASE_URL` and `TEST_DATABASE_URL` are configured against a migrated database. Framework-independent tests run without PostgreSQL or an external LLM.

## Limitations

The current hackathon implementation does not include live messaging, voice recovery, background workers, historical analytics, advanced authentication/RBAC, or production webhook processing. The demo is intentionally bounded and uses the mock provider for repeatability.
