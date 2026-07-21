# Recover Revenue OS Realignment

## Objective

Deliver one premium, minimal operator workspace for customer revenue recovery and internal HVAC acquisition. The interface must expose real system state, while the backend controls channel selection, approvals, provider execution, reply handling and audit evidence.

## Product structure

- **Today:** missed calls, replies needing attention, appointments, failures and verified outcomes.
- **Inbox:** a unified call, SMS and email timeline with AI analysis, assignment, consent and outcome.
- **Growth:** prospect discovery, evidence-based audit, approval, outreach and Twenty pipeline state.
- **System:** integrations, workflow health, billing, reporting and safety controls.

## Provider boundaries

- Supabase: authentication, tenants, operational truth and audit records.
- Activepieces: timers, retries, approvals and long-running workflow orchestration.
- Twenty: companies, contacts and sales pipeline.
- Twilio: PSTN, SMS and carrier delivery truth.
- LiveKit: conversational voice agent, tools and human transfer.
- Resend: email delivery.
- OpenAI: structured analysis, drafting and channel recommendations; never final authorization.
- Stripe: payment truth.
- PostHog: product behavior only.
- Metabase: read-only operational reporting.
- OpenOutreach: optional isolated acquisition experiment; not the core email system and never automatic LinkedIn activity.

## AI operator contract

The model may recommend `call`, `sms`, `email`, `wait`, `human_review` or `do_not_contact`, with rationale, urgency, draft and required provider. The server policy independently checks suppression, consent, local quiet hours, tenant/channel switches, limits, approval, recipient allowlist and idempotency before execution.

## Voice experience contract

- Sound natural through low latency, interruption handling, concise turns, pronunciation controls and contextual memory—not through human impersonation.
- Open an approved business call with one verified pain point, identify the represented company, and state that the caller is its automated assistant.
- Ask one diagnostic question before pitching. Never invent lost leads, revenue, customer complaints or an existing relationship.
- Use light situational humor only after rapport; never joke about safety, emergencies, money or business failure.
- Detect stop requests immediately, persist suppression before ending the call, and never redial a suppressed number.
- Make human transfer available and disclose recording when required by the applicable jurisdiction and tenant policy.
- A campaign may fan out only after each destination passes business-identity, source-evidence, calling-hours, suppression, attempt-limit, approval and idempotency checks.
- Call concurrency is an operational setting, never permission to bypass per-recipient policy.

## End-to-end operating contract

Every opportunity follows one durable state machine:

`discovered → verified → audited → planned → awaiting_approval → approved → contacting → engaged → booked → completed → paid`

`blocked`, `failed`, `suppressed`, and `closed` are explicit terminal or intervention states. A state transition is valid only when its evidence is stored in the same transaction. AI output is advisory evidence, never provider truth.

An autonomous run must:

1. acquire an idempotency key and tenant-scoped lock;
2. load contactability, consent, suppression, quiet-hours and rate-limit evidence;
3. produce a structured recommendation;
4. require approval for first-touch outreach, policy exceptions, pricing and refunds;
5. dispatch through the configured provider adapter;
6. persist the provider identifier before acknowledging success;
7. wait for a signed provider event instead of assuming delivery, booking or payment;
8. retry transient failures and route permanent failures to human review.

## Production data model

- Organizations, memberships and roles establish tenant ownership.
- Companies and contacts are canonical identities; provider IDs are aliases, not primary keys.
- Consent records and suppressions are append-only policy evidence.
- Conversations contain channel-neutral messages and provider delivery states.
- Recovery orders contain the business state machine and next required action.
- Workflow runs and workflow tasks expose automation progress, retries and failures.
- Approvals record requester, approver, scope, decision and expiry.
- Appointments and payments change state only from verified provider events.
- Provider events are deduplicated by provider plus external event ID.
- Audit records are append-only and redact secrets and message bodies by default.

## Security boundary

- Browser clients use Supabase user sessions; service-role credentials remain server-only.
- Every user query is constrained by row-level security and organization membership.
- Webhooks are verified against the raw request body before parsing.
- Live actions require an authenticated tenant, a configured connection, policy evidence and an idempotency key.
- Test actions additionally require a server-side recipient allowlist.
- The production API fails closed when authentication, tenant context, signing secrets or policy evidence are missing.
- Provider credentials are deployment secrets or encrypted vault references and are never returned by an API.

## Acceptance criteria

- All eleven external providers appear with honest configured/test state.
- No fabricated business records or metrics appear.
- Related features are grouped into four primary workspaces.
- Calls are labeled conversational only when LiveKit agent dispatch is configured.
- Email/call/analysis endpoints fail closed without credentials and policy evidence.
- OpenOutreach is isolated and accurately described.
- Tests, typecheck, lint and production build pass.
- Refreshing the UI never loses a persisted order, message, approval, appointment or payment.
- Duplicate workflow requests and duplicate webhooks cannot create duplicate external actions.
- Every displayed operational state includes its source and last verified timestamp.
- The operator can see queued, running, waiting, blocked, failed and completed work without reading logs.
- No production route uses `DEFAULT_TENANT_ID` as authorization; it is permitted only for local test fixtures.

## Boundaries

- Always: validate input, redact secrets, require approval for first-touch outbound actions, preserve provider identifiers.
- Ask first: live credentials, public access, production communication enablement.
- Never: fake provider success, automated social login/messaging, browser-stored secrets, invented revenue.
