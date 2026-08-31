# PRD --- Revenue Recovery Autopilot

## 1. Product Overview

**Product:** Revenue Recovery Autopilot\
**Hackathon Track:** Razorpay Buildathon --- Track 03: AI Revenue
Recovery

Revenue Recovery Autopilot is an AI-powered agentic system that detects
revenue at risk, diagnoses the likely cause, selects an appropriate
recovery intervention, executes a bounded workflow, measures the
outcome, and maintains an auditable record of every decision.

The product is designed around the track requirement:

> Don't just identify the problem. Show measured money recovered across
> a batch, with compliant escalation, stopping rules, and an audit
> trail.

The system should demonstrate measurable business impact rather than
functioning as a generic conversational AI.

------------------------------------------------------------------------

## 2. Problem Statement

Revenue leakage can happen through multiple failure points:

-   Payment failures
-   Checkout abandonment
-   Failed subscription payments
-   Overdue invoices / receivables
-   Mandate or retry failures

Merchants often have fragmented rules for handling these events. A
failed payment may be retried too aggressively, an abandoned checkout
may never receive a relevant recovery action, and high-value cases may
require human intervention.

The product should close the loop:

**Detect → Diagnose → Decide → Act → Measure → Stop/Escalate**

------------------------------------------------------------------------

## 3. Product Goal

Build an autonomous but bounded recovery agent that maximizes expected
recovered revenue while respecting:

-   Attempt limits
-   Cooldown periods
-   Customer/contact frequency limits
-   Merchant-defined policies
-   Risk/value thresholds
-   Human escalation rules
-   Complete auditability

### Primary success metric

**Recovered Revenue**

Secondary metrics:

-   Recovery rate
-   Recovery ROI
-   Intervention success rate
-   Revenue recovered per intervention
-   False/intervention rate
-   Escalation rate
-   Average recovery time

------------------------------------------------------------------------

## 4. Target Users

### Primary User --- Merchant / Revenue Operations Team

Needs to:

-   See how much revenue is at risk
-   Understand why revenue is at risk
-   Review AI-selected interventions
-   Configure recovery policies
-   Track recovered money
-   Inspect agent decisions
-   Handle escalated cases

### Secondary User --- Finance / Collections Team

Needs to:

-   Track overdue receivables
-   Review promises to pay
-   Monitor high-value cases
-   Audit recovery activity

------------------------------------------------------------------------

## 5. Core User Journey

### Journey A --- Failed Payment

1.  A payment failure event enters the system.
2.  Agent retrieves relevant transaction/customer context.
3.  Agent diagnoses the likely failure reason.
4.  Agent calculates recovery eligibility.
5.  Agent selects a bounded intervention.
6.  System executes/simulates the action.
7.  Outcome is recorded.
8.  If recovered, recovered amount is attributed to the intervention.
9.  If unsuccessful, the agent may schedule another permitted step.
10. Once limits are reached, the case stops or escalates.

### Journey B --- Checkout Abandonment

1.  Checkout session becomes inactive.
2.  Agent determines whether the customer is worth contacting.
3.  Agent evaluates cart value, customer history, and previous
    interventions.
4.  Agent selects a recovery action.
5.  Recovery action is executed.
6.  Successful payment is attributed to the recovery campaign.

### Journey C --- Failed Subscription

1.  Subscription payment fails.
2.  Agent identifies failure reason.
3.  Agent chooses retry, payment-link, reminder, or escalation.
4.  Retry/action is executed within policy.
5.  Subscription recovery is tracked.

### Journey D --- Overdue Receivable

1.  Invoice crosses its due date.
2.  Agent evaluates amount, aging, customer history, and promise-to-pay
    state.
3.  Agent chooses a reminder/escalation action.
4.  Customer response is tracked.
5.  Payment or promise-to-pay is recorded.
6.  The workflow stops when paid, promise fulfilled, policy limit
    reached, or human escalation is required.

------------------------------------------------------------------------

## 6. MVP Scope

### Must Have

-   Revenue-at-risk dashboard
-   Batch event ingestion
-   Failed-payment recovery
-   Checkout-abandonment recovery
-   AI diagnosis
-   AI recovery decision
-   Tool/action execution layer
-   Policy/stopping-rule engine
-   Recovery outcome simulation/integration
-   Recovered revenue calculation
-   Audit trail
-   Human escalation
-   Agent decision explanation
-   Demo dataset with enough records to show batch-level impact

### Should Have

-   Subscription recovery
-   Overdue receivables
-   Recovery strategy experimentation
-   Merchant policy configuration
-   Customer timeline
-   Recovery campaign analytics

### Nice to Have

-   Hinglish recovery communication
-   Voice recovery
-   Promise-to-pay tracker
-   Mandate retry sequencer
-   Natural-language merchant controls

------------------------------------------------------------------------

## 7. Core Agent Responsibilities

The AI agent is responsible for reasoning over context and selecting an
action. It must not directly perform unrestricted side effects.

### Agent input

-   Event type
-   Transaction/invoice/subscription data
-   Amount
-   Failure reason
-   Customer history
-   Previous recovery attempts
-   Attempt count
-   Last contact time
-   Merchant policy
-   Customer segment
-   Current workflow state

### Agent output

``` json
{
  "diagnosis": "expired_card",
  "risk_level": "high",
  "recommended_action": "send_payment_link",
  "reason": "High-value customer with strong historical payment success",
  "expected_recovery_value": 4200,
  "confidence": 0.91,
  "next_allowed_action_after": "24h",
  "should_escalate": false
}
```

The output must be validated against deterministic business rules before
execution.

------------------------------------------------------------------------

## 8. Recovery Actions

Supported actions should include:

-   Retry payment
-   Generate/send payment link
-   Send reminder
-   Send personalized recovery message
-   Offer alternate payment method
-   Schedule next retry
-   Mark as recovery campaign
-   Escalate to human
-   Stop workflow

The system should clearly distinguish between:

**AI decision** and **policy permission**.

The AI recommends; the policy engine decides whether that action is
allowed.

------------------------------------------------------------------------

## 9. Stopping Rules

Every recovery case must have explicit stopping conditions.

Examples:

-   Maximum retry count reached
-   Maximum customer contacts reached
-   Minimum cooldown not satisfied
-   Customer paid
-   Customer opted out
-   Case escalated
-   Recovery probability becomes too low
-   Merchant policy blocks further action

Example:

``` text
Attempt 1 → Retry
Attempt 2 → Payment Link
Attempt 3 → Reminder
No recovery → STOP / Human Escalation
```

------------------------------------------------------------------------

## 10. Compliance & Safety Principles

The demo should model responsible automation.

The system must:

-   Respect merchant-configured limits
-   Avoid infinite retries
-   Avoid repeated customer contact
-   Record every automated action
-   Escalate sensitive/high-value cases
-   Never claim a payment was recovered without an outcome event
-   Keep AI recommendations separate from actual payment execution
-   Provide a reason for every intervention

------------------------------------------------------------------------

## 11. Dashboard Requirements

### Executive Metrics

Display:

-   Total revenue at risk
-   Revenue recovered
-   Recovery rate
-   Number of interventions
-   Successful recoveries
-   Amount pending recovery
-   Escalated cases

Example:

``` text
₹18.4L      ₹6.72L       36.5%
At Risk     Recovered    Recovery Rate
```

### Recovery Funnel

``` text
At Risk
  ↓
Eligible
  ↓
Intervened
  ↓
Engaged
  ↓
Recovered
```

### Case Table

Columns:

-   Customer
-   Event
-   Amount
-   Risk
-   Diagnosis
-   Recommended action
-   Current attempt
-   Status
-   Recovered amount
-   Last action

### Audit Timeline

Each case should expose:

-   Event
-   Agent reasoning summary
-   Policy decision
-   Action
-   Outcome
-   Timestamp
-   Next step
-   Escalation status

------------------------------------------------------------------------

## 12. Batch Evaluation

The system should process a meaningful synthetic/demo batch rather than
a single happy-path example.

Suggested demo:

-   500--1,000 revenue-risk records
-   Multiple event types
-   Different failure reasons
-   Different customer histories
-   Different transaction values
-   Some recoverable cases
-   Some non-recoverable cases
-   Some escalation cases

Track:

``` text
Total At Risk
Eligible Amount
Intervention Amount
Recovered Amount
Recovery Rate
Escalated Amount
Stopped Amount
```

The final demo must be able to answer:

> "How much money did your agent actually recover?"

------------------------------------------------------------------------

## 13. Product Differentiation

The product should not be positioned as:

> "An AI chatbot that sends payment reminders."

Instead:

> **An autonomous revenue recovery decision engine that chooses the next
> best bounded intervention based on expected recovery value, customer
> context, and merchant policy --- then measures the money recovered.**

The core differentiator is the closed feedback loop:

**Prediction → Intervention → Outcome → Revenue attribution**

------------------------------------------------------------------------

## 14. Non-Goals

For the hackathon MVP, do not attempt:

-   Production-grade payment processing
-   Unbounded autonomous financial transactions
-   Full enterprise CRM
-   Full collections management platform
-   Training a large custom ML model
-   Hundreds of integrations
-   Real customer messaging without appropriate controls

------------------------------------------------------------------------

## 15. Acceptance Criteria

The MVP is successful when:

1.  A batch of revenue-risk events can be ingested.
2.  The system identifies eligible recovery cases.
3.  The agent diagnoses cases.
4.  The agent recommends actions.
5.  Deterministic policy rules validate actions.
6.  Actions are executed or safely simulated.
7.  Outcomes are recorded.
8.  Recovered revenue is calculated from outcome events.
9.  Stopping rules prevent excessive actions.
10. High-risk cases can be escalated.
11. Every decision is auditable.
12. The dashboard demonstrates measurable batch-level recovery.
