# Revenue Recovery Autopilot

A bounded, auditable revenue recovery decision engine for Razorpay Buildathon Track 03.

## Foundation setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` plus a local `AUTH_SECRET`.
2. Install dependencies: `npm install`.
3. Generate Prisma Client: `npm run db:generate`.
4. Apply migrations: `npm run db:migrate`.
5. Seed deterministic demo data: `npm run db:seed`.
6. Start the app: `npm run dev`.

All monetary values are integer minor units. Dashboard metrics will be connected to aggregate queries in the recovery-engine milestones; the foundation UI intentionally shows an empty state until those APIs exist.
