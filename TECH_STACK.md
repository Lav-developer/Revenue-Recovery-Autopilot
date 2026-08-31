# TECH_STACK.md --- Revenue Recovery Autopilot

## 1. Architecture

Recommended architecture:

``` text
                    ┌─────────────────────┐
                    │      Next.js UI     │
                    │ Dashboard / Ops UI  │
                    └──────────┬──────────┘
                               │
                         REST / API
                               │
                    ┌──────────▼──────────┐
                    │   Application API   │
                    │ Node.js / TypeScript│
                    └───────┬───────┬──────┘
                            │       │
                ┌───────────┘       └────────────┐
                ↓                                ↓
       ┌─────────────────┐              ┌─────────────────┐
       │ Recovery Engine │              │   PostgreSQL    │
       │ Agent + Policies│              │ Persistent Data │
       └────────┬────────┘              └─────────────────┘
                │
       ┌────────▼────────┐
       │ Action / Tooling │
       │ Razorpay + Mock  │
       └─────────────────┘
```

------------------------------------------------------------------------

## 2. Frontend

### Framework

**Next.js + TypeScript**

Why:

-   Fast development
-   Excellent dashboard support
-   API routes/server actions available
-   Easy deployment
-   Strong React ecosystem

### Styling

**Tailwind CSS**

### Components

Use a reusable component system such as:

-   shadcn/ui
-   Radix primitives

### Charts

**Recharts**

Use charts only where they communicate business metrics.

------------------------------------------------------------------------

## 3. Backend

### Runtime

**Node.js**

### Language

**TypeScript**

### API

Recommended:

-   Next.js Route Handlers for MVP

or:

-   Separate Express/Fastify service if the agent workflow becomes
    large.

For the hackathon, prefer a single Next.js application unless separation
is genuinely needed.

------------------------------------------------------------------------

## 4. Database

### PostgreSQL

Recommended hosted options:

-   Supabase
-   Neon

Use PostgreSQL because the product has relational financial/event data.

### ORM

**Prisma**

Alternative:

-   Drizzle ORM

Prisma is preferred for faster development and readable schema
management.

------------------------------------------------------------------------

## 5. Core Data Model

### merchants

``` text
id
name
created_at
```

### customers

``` text
id
merchant_id
name
email
phone
segment
created_at
```

### transactions

``` text
id
customer_id
amount
currency
status
payment_method
failure_reason
created_at
```

### subscriptions

``` text
id
customer_id
amount
status
next_billing_at
failure_count
```

### invoices

``` text
id
customer_id
amount
due_date
status
paid_at
```

### recovery_cases

``` text
id
customer_id
source_type
source_id
amount_at_risk
status
risk_level
diagnosis
confidence
recommended_action
attempt_count
next_action_at
escalated_at
recovered_amount
created_at
updated_at
```

### interventions

``` text
id
recovery_case_id
action_type
status
reason
expected_recovery_value
executed_at
outcome_at
recovered_amount
```

### policies

``` text
id
merchant_id
name
event_type
rules_json
enabled
created_at
```

### audit_logs

``` text
id
recovery_case_id
actor_type
event_type
decision
reason
metadata_json
created_at
```

------------------------------------------------------------------------

## 6. AI Architecture

Use an LLM as the reasoning layer, not as the entire application.

``` text
Event
  ↓
Context Builder
  ↓
LLM Agent
  ↓
Structured Decision
  ↓
Schema Validation
  ↓
Policy Engine
  ↓
Tool Executor
  ↓
Outcome
  ↓
Database
  ↓
Feedback / Metrics
```

------------------------------------------------------------------------

## 7. Agent Tools

The agent should have narrowly scoped tools.

Example tools:

``` text
get_customer_history()
get_transaction()
get_subscription()
get_invoice()
calculate_recovery_score()
check_policy()
retry_payment()
create_payment_link()
send_recovery_message()
schedule_retry()
escalate_case()
stop_case()
record_outcome()
```

Tools must validate inputs and enforce authorization.

The LLM should never receive a generic "execute arbitrary SQL/API" tool.

------------------------------------------------------------------------

## 8. Structured Agent Output

Use strict structured output.

Example:

``` json
{
  "case_id": "RR-10482",
  "diagnosis": {
    "category": "expired_card",
    "confidence": 0.91
  },
  "decision": {
    "action": "create_payment_link",
    "reason": "High-value customer with strong historical payment success",
    "expected_recovery_value": 3950
  },
  "policy": {
    "allowed": true,
    "rule": "payment_link_for_method_failure"
  },
  "next_step": {
    "type": "await_outcome",
    "cooldown_hours": 24
  },
  "escalate": false
}
```

Validate with Zod before executing any action.

------------------------------------------------------------------------

## 9. Deterministic Policy Engine

The policy engine must be separate from the LLM.

Example:

``` text
IF customer_opted_out
→ STOP

IF payment_already_successful
→ STOP

IF attempts >= max_attempts
→ STOP

IF amount >= high_value_threshold
→ ESCALATE

IF cooldown_not_elapsed
→ WAIT

ELSE
→ ALLOW_AGENT_ACTION
```

This architecture demonstrates safe agentic behavior.

------------------------------------------------------------------------

## 10. Recovery Scoring

Do not let the LLM invent arbitrary financial values.

Create a deterministic scoring model.

Example inputs:

``` text
payment history
failure type
amount
customer recency
previous recovery success
attempt count
event type
```

Possible formula:

``` text
recovery_score =
    0.30 * historical_success
  + 0.20 * recency
  + 0.20 * failure_recoverability
  + 0.15 * customer_value
  + 0.15 * engagement
```

Normalize to 0--1.

The exact weights can be tuned using the demo dataset.

------------------------------------------------------------------------

## 11. Expected Recovery Value

Use:

``` text
Expected Recovery Value
=
Amount At Risk
× Recovery Probability
× Action Success Probability
```

This can help the agent choose between interventions.

Example:

``` text
Retry
₹5,000 × 0.60 × 0.55 = ₹1,650

Payment Link
₹5,000 × 0.60 × 0.72 = ₹2,160

→ Choose Payment Link
```

The calculation should be deterministic and auditable.

------------------------------------------------------------------------

## 12. Event Processing

For the hackathon MVP, use a simple event pipeline.

``` text
POST /api/events
       ↓
Store event
       ↓
Create/update recovery case
       ↓
Build context
       ↓
Agent decision
       ↓
Policy validation
       ↓
Execute action
       ↓
Record intervention
```

For larger scale, this can later become:

``` text
Webhook
→ Queue
→ Worker
→ Agent
→ Action
→ Outcome
```

Do not introduce Kafka or complex infrastructure unless necessary.

------------------------------------------------------------------------

## 13. Razorpay Integration

Use Razorpay APIs/test environment where practical.

Integration layer should be abstracted:

``` text
PaymentProvider
├── RazorpayProvider
└── MockPaymentProvider
```

This lets the demo remain deterministic while retaining a credible
integration architecture.

Never put Razorpay credentials in frontend code.

Use environment variables.

------------------------------------------------------------------------

## 14. API Design

### Events

``` text
POST /api/events
POST /api/events/batch
```

### Cases

``` text
GET  /api/recovery-cases
GET  /api/recovery-cases/:id
POST /api/recovery-cases/:id/process
POST /api/recovery-cases/:id/stop
POST /api/recovery-cases/:id/escalate
```

### Actions

``` text
POST /api/interventions/:id/execute
POST /api/interventions/:id/outcome
```

### Dashboard

``` text
GET /api/dashboard/metrics
GET /api/dashboard/funnel
GET /api/dashboard/activity
```

### Policies

``` text
GET  /api/policies
POST /api/policies
PATCH /api/policies/:id
```

### Audit

``` text
GET /api/audit-logs
```

------------------------------------------------------------------------

## 15. Authentication

For the hackathon MVP:

-   Use simple authenticated demo merchant access.
-   Never expose secrets to the browser.
-   Keep merchant IDs server-side.
-   Add proper role-based access if time permits.

Potential roles:

``` text
ADMIN
OPERATIONS
FINANCE
VIEWER
```

------------------------------------------------------------------------

## 16. Observability

Track:

-   Agent latency
-   Agent decisions
-   Policy rejection rate
-   Tool execution failures
-   Recovery outcomes
-   Recovered amount
-   Escalations
-   Stopped cases

Every agent run should have a trace/correlation ID.

Example:

``` text
trace_id = rr_01JXYZ...
```

------------------------------------------------------------------------

## 17. Testing Strategy

### Unit tests

Test:

-   Policy engine
-   Recovery scoring
-   Expected recovery calculation
-   Stopping rules
-   Agent output schema
-   Recovery attribution

### Integration tests

Test:

``` text
Event
→ Recovery Case
→ Agent Decision
→ Policy
→ Action
→ Outcome
→ Recovered Revenue
```

### Scenario tests

Minimum scenarios:

1.  Recoverable failed payment
2.  Non-recoverable failed payment
3.  Repeated failure
4.  High-value escalation
5.  Checkout abandonment
6.  Subscription failure
7.  Paid-before-intervention
8.  Contact-limit reached
9.  Cooldown violation
10. Manual escalation

------------------------------------------------------------------------

## 18. Demo Dataset

Create deterministic synthetic data.

Suggested:

``` text
1,000 revenue-risk events

Payment failures       450
Checkout abandonment   250
Subscriptions          150
Overdue invoices       150
```

Include realistic distributions of:

-   Amount
-   Customer history
-   Failure reason
-   Attempt count
-   Previous recovery
-   Risk level

The dataset should contain both successful and unsuccessful recovery
outcomes.

Do not hardcode a fake recovered-revenue number into the dashboard.
Calculate it from event outcomes.

------------------------------------------------------------------------

## 19. Deployment

Recommended:

``` text
Frontend/API → Vercel
Database     → Supabase or Neon
Repository   → GitHub
```

If background workers are needed:

-   Vercel-compatible jobs
-   A lightweight worker service
-   Or scheduled server-side processing

Keep deployment simple for the hackathon.

------------------------------------------------------------------------

## 20. Environment Variables

Example:

``` text
DATABASE_URL=
NEXT_PUBLIC_APP_URL=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

LLM_API_KEY=

AUTH_SECRET=
```

Only expose variables prefixed with `NEXT_PUBLIC_` when they are
intentionally public.

------------------------------------------------------------------------

## 21. Security Requirements

-   Never expose payment secrets to frontend
-   Validate every tool input
-   Validate LLM output
-   Apply policy checks before side effects
-   Rate-limit public event endpoints
-   Sanitize customer-provided text
-   Avoid logging secrets
-   Keep audit logs immutable from normal UI flows

------------------------------------------------------------------------

## 22. Recommended Repository Structure

``` text
revenue-recovery-autopilot/
├── app/
│   ├── dashboard/
│   ├── cases/
│   ├── recoveries/
│   ├── escalations/
│   ├── audit/
│   ├── policies/
│   └── api/
│
├── components/
│   ├── dashboard/
│   ├── cases/
│   ├── recovery/
│   ├── charts/
│   └── ui/
│
├── lib/
│   ├── agent/
│   │   ├── agent.ts
│   │   ├── prompts.ts
│   │   ├── tools.ts
│   │   └── schema.ts
│   ├── recovery/
│   │   ├── scoring.ts
│   │   ├── policies.ts
│   │   ├── workflow.ts
│   │   └── stopping-rules.ts
│   ├── payments/
│   │   ├── provider.ts
│   │   ├── razorpay.ts
│   │   └── mock.ts
│   └── db/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── scenarios/
│
├── public/
├── PRD.md
├── DESIGN.md
├── TECH_STACK.md
└── README.md
```

------------------------------------------------------------------------

## 23. Implementation Order

### Phase 1 --- Foundation

-   Next.js project
-   Tailwind/shadcn
-   PostgreSQL
-   Prisma schema
-   Seed data
-   Dashboard shell

### Phase 2 --- Recovery Engine

-   Event ingestion
-   Recovery cases
-   Scoring
-   Policies
-   Stopping rules

### Phase 3 --- AI Agent

-   Context builder
-   Structured LLM output
-   Tool definitions
-   Validation
-   Agent workflow

### Phase 4 --- Actions

-   Mock payment provider
-   Razorpay provider abstraction
-   Payment link action
-   Retry action
-   Reminder action
-   Escalation

### Phase 5 --- Measurement

-   Outcome events
-   Recovered revenue calculation
-   Funnel
-   Metrics
-   Audit log

### Phase 6 --- UX Polish

-   Case detail
-   Decision explanation
-   Live activity feed
-   Policy builder
-   Escalation queue

### Phase 7 --- Demo

-   Deterministic demo dataset
-   One-click simulation
-   Seeded recovery outcomes
-   5-minute demo flow
-   Error handling
-   Deployment

------------------------------------------------------------------------

## 24. Architecture Principle

The most important technical rule:

> **LLM decides; deterministic software controls; payment infrastructure
> executes; database proves the outcome.**

This prevents the project from becoming a generic AI wrapper and
directly supports the hackathon requirements around bounded workflows,
stopping rules, measurable recovery, escalation, and auditability.
