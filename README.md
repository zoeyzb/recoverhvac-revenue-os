# RecoverHVAC

Truth-first HVAC revenue operations: connect providers, test credentials, run allowlisted communication tests, analyze conversations, and grow into audited recovery workflows.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev -- --hostname 127.0.0.1
```

The app defaults to `COMMUNICATION_MODE=test`. Live external communication requires verified provider credentials and server-side safety activation. The integration catalog can test and persist credentials in the encrypted tenant vault when `INTEGRATION_ENCRYPTION_KEY` is configured. Secrets are never returned to the browser.

## Quality gates

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Architecture

- `src/app`: Next.js interface and API routes
- `src/domain`: deterministic policy and state-machine logic
- `src/integrations`: typed provider boundaries and connection health
- `worker`: hosted API and static-asset Worker entrypoint
- `scripts/package-sites.mjs`: deterministic Sites package builder
- `.openai/hosting.json`: Sites deployment contract

## Database setup

Apply the migrations in order to a new Supabase project:

1. `supabase/migrations/001_recovery_orders.sql`
2. `supabase/migrations/002_revenue_os_foundation.sql`
3. `supabase/migrations/003_provider_event_queue.sql`
4. `supabase/migrations/004_product_completion.sql`
5. `supabase/migrations/005_hands_off_runtime.sql`

The second migration adds organizations and memberships, canonical companies and contacts, consent and suppression evidence, conversations, workflow runs and tasks, approvals, appointments, payments, deduplicated provider events, integration health and an append-only audit log. It also enables tenant-scoped row-level security.

Creating an autopilot order fails closed until Supabase and an authenticated organization membership are configured. The application never returns a disposable session-only order that disappears after refresh.

Every operator route derives its tenant from the signed-in user's verified `organization_members` row. A tenant ID supplied by the browser is never treated as authorization.

Provider configuration is documented in `.env.example`. Missing integrations display `Needs credentials` and never fake a live connection.

## Honest product state

- Dashboard metrics remain `—` until backed by a verified provider event.
- OpenAI, Twilio, Resend, Stripe, and Supabase have live credential probes.
- Test calls and emails are blocked unless the recipient is in `TEST_RECIPIENTS`.
- AI analysis calls the configured OpenAI Responses API; it does not return canned output.
- Providers with direct probes report verified state; OAuth/account-specific providers remain visibly pending until their adapter completes authorization.
- The native runtime leases jobs, normalizes missed-call/estimate/job events, applies suppression and consent policy, requests approval, dispatches SMS/email/AI voice, retries failures and dead-letters exhausted work.
- The LiveKit service accepts approved per-call context, creates an explicit agent dispatch and SIP participant, persists opt-outs, queues human transfer/callback requests and records outcomes.
- Stripe and Twilio callback routes verify provider signatures before storing normalized, deduplicated events. They fail closed when signing secrets or durable event storage are unavailable; business processing remains an asynchronous-worker responsibility.
- Activepieces is an optional secondary event sink. The core recovery path remains native and durable when it is absent.
