# DESIGN.md --- Revenue Recovery Autopilot

## 1. Design Direction

### Product personality

**Financial infrastructure + intelligent operations**

The interface should feel like a serious fintech operations console, not
a generic AI dashboard.

Design principles:

-   Minimal
-   High information density
-   Strong hierarchy
-   Trustworthy
-   Operational
-   Explainable
-   Fast to scan

Avoid:

-   Excessive gradients
-   Generic AI robot imagery
-   Chatbot-first layouts
-   Decorative animations
-   Overuse of cards
-   Fake-looking financial charts

------------------------------------------------------------------------

## 2. Visual Language

### Base aesthetic

Use a dark fintech interface inspired by modern payment infrastructure
products.

Suggested palette:

``` text
Background:      #0B0A08
Surface:         #12110F
Elevated Surface:#181613
Border:          #292621
Primary Text:    #F3EEE5
Secondary Text:  #AAA39A
Muted Text:      #777168
Accent:          #F2A93B
Success:         #55C98A
Warning:         #F2B84B
Danger:          #EF6B6B
Info:            #79A9FF
```

Use accent colors sparingly.

------------------------------------------------------------------------

## 3. Typography

Recommended:

-   Inter
-   Geist
-   IBM Plex Sans

Typography hierarchy:

``` text
Page title       28–36px / semibold
Section heading  18–22px / semibold
Metric value     28–40px / bold
Body             14–16px
Table            13–14px
Metadata         11–12px
```

Numbers should use tabular/monospaced numerals where possible.

------------------------------------------------------------------------

## 4. Navigation

Desktop sidebar:

``` text
Revenue Recovery
────────────────────
Overview
At Risk
Recoveries
Interventions
Customers
Escalations
Audit Log
Policies
Settings
```

Bottom area:

``` text
Agent Status
● Operational
```

------------------------------------------------------------------------

## 5. Overview Dashboard

### Header

``` text
Revenue Recovery
Autopilot overview

Last 30 days     [Date range]
```

### Hero metrics

Four primary metrics:

``` text
┌─────────────────┐ ┌─────────────────┐
│ ₹18.4L          │ │ ₹6.72L          │
│ Revenue at Risk │ │ Recovered       │
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ 36.5%           │ │ 327             │
│ Recovery Rate   │ │ Interventions   │
└─────────────────┘ └─────────────────┘
```

The recovered revenue metric should visually dominate.

### Revenue recovery chart

Show:

-   At-risk revenue
-   Intervened revenue
-   Recovered revenue

Prefer a clean line/area or bar visualization.

------------------------------------------------------------------------

## 6. Recovery Funnel

Display:

``` text
₹18.4L
At Risk
   ↓
₹12.7L
Eligible
   ↓
₹9.2L
Intervened
   ↓
₹6.72L
Recovered
```

Each stage should display:

-   Amount
-   Number of cases
-   Conversion percentage

------------------------------------------------------------------------

## 7. AI Decision Feed

A live operational feed:

``` text
AI Recovery Activity

● 14:32
₹4,999 payment
Diagnosis: expired card
Action: Payment link
Expected recovery: ₹3,950
Status: Awaiting outcome

● 14:31
₹899 checkout abandoned
Action: Recovery message
Status: Recovered

● 14:29
₹74,000 invoice overdue
Action: Human escalation
Reason: High-value receivable
```

This is useful during the live hackathon demo because judges can see the
agent making decisions.

------------------------------------------------------------------------

## 8. At-Risk Cases

Table:

``` text
Customer | Event | Amount | Risk | Diagnosis | Next Action | Status
```

Risk indicators:

-   Low
-   Medium
-   High
-   Critical

Do not rely on color alone; use labels/icons as well.

------------------------------------------------------------------------

## 9. Case Detail Page

The case detail page is one of the most important screens.

### Header

``` text
Recovery Case #RR-10482

₹4,999
Payment Failure

● Recovery in progress
```

### Customer context

``` text
Customer
Previous successful payments: 7
Previous failures: 1
Average order value: ₹3,800
Last successful payment: 12 days ago
```

### Agent diagnosis

``` text
WHY THIS HAPPENED

Expired card

Confidence
91%

WHY THIS ACTION

Payment link selected because:
• Customer has strong payment history
• Failure is payment-method specific
• Transaction value is above retry threshold
```

### Workflow timeline

``` text
Payment Failed
     ↓
AI Diagnosed
     ↓
Policy Checked ✓
     ↓
Payment Link Sent
     ↓
Customer Opened
     ↓
Payment Recovered ✓
```

### Audit section

Show:

-   Timestamp
-   Event
-   Agent recommendation
-   Policy result
-   Action
-   Outcome
-   Actor: AI / System / Human

------------------------------------------------------------------------

## 10. Policy Builder

Allow merchant operators to configure bounded automation.

Example:

``` text
Payment Failure Policy

IF amount < ₹2,000
AND previous attempts < 2
→ Retry automatically

IF amount >= ₹2,000
AND payment method failure
→ Send payment link

IF amount >= ₹50,000
→ Human escalation

Maximum customer contacts
[ 3 ]

Cooldown
[ 24 hours ]

After maximum attempts
[ Stop workflow ]
```

Important: policies should look deterministic and trustworthy.

------------------------------------------------------------------------

## 11. Escalation Queue

High-priority operational screen:

``` text
Escalations

CRITICAL
₹74,000
B2B invoice overdue
Reason: high-value receivable

HIGH
₹51,000
Subscription failed
Reason: repeated payment failures
```

Actions:

-   Assign
-   Review
-   Approve next action
-   Mark resolved
-   Stop recovery

------------------------------------------------------------------------

## 12. Audit Log

Dense table with filters:

``` text
Time | Case | Event | AI Decision | Policy | Action | Outcome
```

Filters:

-   Date
-   Event type
-   Action
-   Status
-   Escalation
-   Customer
-   Amount

Every automated side effect should have an audit entry.

------------------------------------------------------------------------

## 13. Agent Interaction

Do not make the product a chatbot.

If natural language is included, make it an optional operator interface:

``` text
Ask Recovery Agent

"Why did recovery drop yesterday?"

Agent:
Recovery fell 8.4% primarily because card-related
failures increased 19% and the retry success rate
fell from 31% to 22%.
```

The primary UI remains the operations dashboard.

------------------------------------------------------------------------

## 14. Demo Mode

Create a dedicated demo control:

``` text
[ Run Recovery Simulation ]
```

When triggered:

1.  Load demo batch.
2.  Process cases.
3.  Show agent decisions.
4.  Execute allowed actions.
5.  Generate outcomes.
6.  Update recovered revenue.
7.  Update dashboard.
8.  Display audit trail.

The animation should be subtle and fast.

------------------------------------------------------------------------

## 15. Responsive Design

Desktop is the primary target.

Minimum supported:

-   1280px desktop
-   1440px preferred demo resolution
-   Tablet fallback

Mobile should remain usable but does not need to be the primary
hackathon presentation.

------------------------------------------------------------------------

## 16. UX Rules

### Always communicate state

Use:

-   Processing
-   Awaiting outcome
-   Recovered
-   Failed
-   Stopped
-   Escalated

### Avoid fake certainty

Never display:

> "AI knows this customer will pay."

Prefer:

> "Expected recovery probability: 78%"

### Financial values

Always show:

-   Currency
-   Exact amount
-   Recovered vs at-risk distinction

### Trust

For every AI action, provide:

**What happened + Why + What will happen next**

------------------------------------------------------------------------

## 17. Key Screens for MVP

Priority order:

1.  Overview Dashboard
2.  At-Risk Cases
3.  Case Detail
4.  AI Decision/Workflow Timeline
5.  Escalation Queue
6.  Audit Log
7.  Policy Builder

These seven screens are sufficient for a strong hackathon demo.
