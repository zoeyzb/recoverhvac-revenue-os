# Recover

## Public website, owner OS, and customer workspace

Recover is intentionally split into two bounded operating surfaces:

- `/` is the public SaaS landing page.
- `/owner/login` is the private platform-owner sign-in.
- `/owner` is the internal acquisition and operations OS for discovery, audits, approvals, outreach, calls, pipeline, orders, provisioning, platform integrations, costs, compliance, and system health.
- `/login` and `/signup` are customer account entry points.
- `/app` is the tenant-scoped customer workspace for conversations, bookings, recovery automations, customer integrations, and verified revenue.

The owner OS and customer workspace must not share provider credentials, navigation, authorization assumptions, or unscoped data. Internal prospecting records never become customer operational records until an explicit verified conversion/provisioning step.

Set `OWNER_DASHBOARD_PASSWORD` and a long random `OWNER_SESSION_SECRET` in the deployment environment. Owner access uses an HTTP-only, secure, same-site cookie and fails closed when either value is missing. Supabase authentication continues to protect tenant data and backend operations inside customer workspaces.

Typing `OWNER_DASHBOARD_PASSWORD=...` into a terminal does **not** save it for future terminal windows or configure the deployed website. For local use, put both values in `.env.local`. For the public deployment, add both values in the project environment settings and redeploy. Generate a session secret with `openssl rand -hex 32`; do not reuse the dashboard password as the session secret.

Truth-first revenue operations for service businesses: discover and audit qualified businesses, prepare evidence-backed outreach, convert prospects into customer workspaces, connect providers, recover missed opportunities, and measure verified revenue.

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

- `src/app`: public site, owner OS, customer workspace, and API routes
- `src/components/owner-operations.tsx`: private platform acquisition and operations surface
- `src/components/operator-app.tsx`: tenant-scoped customer workspace
- `src/domain`: deterministic policy and state-machine logic
- `src/integrations`: typed provider boundaries and connection health
- `worker`: hosted API and static-asset Worker entrypoint
- `scripts/package-sites.mjs`: deterministic Sites package builder
- `.openai/hosting.json`: Sites deployment contract

The intended runtime split is Vercel for the web application, Supabase for authentication and operational truth, and persistent workers for discovery, browser audits, workflow jobs, outreach adapters, and voice. A successful Next.js deployment does not replace those workers.

## Database setup

Apply the migrations in order to a new Supabase project:

1. `supabase/migrations/001_recovery_orders.sql`
2. `supabase/migrations/002_revenue_os_foundation.sql`
3. `supabase/migrations/003_provider_event_queue.sql`
4. `supabase/migrations/004_product_completion.sql`
5. `supabase/migrations/005_hands_off_runtime.sql`
6. `supabase/migrations/006_internal_acquisition_engine.sql`

The foundation migrations add organizations and memberships, canonical companies and contacts, consent and suppression evidence, conversations, workflow runs and tasks, approvals, appointments, payments, deduplicated provider events, integration health and an append-only audit log. They also enable tenant-scoped row-level security.

Migration 006 adds the bounded internal acquisition engine: saved searches, scrape batches, normalized leads, versioned opportunity scoring, outreach plans and drafts, first-touch approvals, acquisition events, and explicit workspace-provisioning jobs.

Creating an autopilot order fails closed until Supabase and an authenticated organization membership are configured. The application never returns a disposable session-only order that disappears after refresh.

Every customer operator route derives its tenant from the signed-in user's verified `organization_members` row. A tenant ID supplied by the browser is never treated as authorization.

Provider configuration is documented in `.env.example`. Missing integrations display `Needs credentials` and never fake a live connection.

## Honest product state

- Dashboard metrics remain `—` or show a setup state until backed by a verified provider event.
- OpenAI, Twilio, Resend, Stripe, and Supabase have live credential probes.
- Test calls and emails are blocked unless the recipient is in `TEST_RECIPIENTS`.
- AI analysis calls the configured OpenAI Responses API; it does not return canned output.
- Providers with direct probes report verified state; OAuth/account-specific providers remain visibly pending until their adapter completes authorization.
- The native runtime leases jobs, normalizes missed-call/estimate/job events, applies suppression and consent policy, requests approval, dispatches SMS/email/AI voice, retries failures and dead-letters exhausted work.
- The LiveKit service accepts approved per-call context, creates an explicit agent dispatch and SIP participant, persists opt-outs, queues human transfer/callback requests and records outcomes.
- Stripe and Twilio callback routes verify provider signatures before storing normalized, deduplicated events. They fail closed when signing secrets or durable event storage are unavailable; business processing remains an asynchronous-worker responsibility.
- Activepieces is an optional secondary event sink. The core recovery path remains native and durable when it is absent.
- The owner OS now exposes the correct acquisition and operations structure, but live discovery, audit, outreach, CRM, voice, billing, analytics, and reporting remain unavailable until their worker services and provider credentials are deployed and verified.
