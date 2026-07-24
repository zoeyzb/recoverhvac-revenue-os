# Product boundary and runtime repair

## Problem

Recover currently presents three conflicting products:

1. A managed-service intake that says a plan is "queued".
2. A standalone `/app` demo dashboard with fabricated chart bars.
3. A real customer workspace whose API calls do not exist in the Vercel app.

The owner console compounds the problem with seventeen navigation items, decorative
buttons, and hard-coded "blocked" states. The actual API implementation is deployed
separately on Railway, so Vercel returns HTML 404 pages for customer workspace calls.

## Product model

Recover is a managed revenue-recovery service with a software workspace:

- Recover diagnoses and implements the system.
- The customer workspace shows conversations, bookings, automations, revenue, and
  customer-owned connections.
- The owner console operates Recover itself: acquisition, sales, customers, and
  platform health.
- Provider fees and credentials are never represented as completed until a real
  probe or recorded connection proves that state.

## Information architecture

### Public

- Website
- Three-step request form
- Confirmation that repeats the selected service and priorities
- Workspace creation is optional and clearly separate from submitting a request

### Customer workspace

- Today
- Inbox
- Calendar
- Website
- Automations
- Revenue
- Connections

All customer routes use one shell and one visual language. Connections is the only
place where customer-owned provider credentials are added or tested.

### Owner console

- Command
- Acquisition
- Sales
- Customers
- Operations

Operations contains live deployment readiness, customer connection access, policy,
cost, and automation links. Subsystems are details inside a section, not seventeen
top-level destinations.

## Runtime boundary

- Next.js/Vercel owns public pages, authentication routes, and UI.
- Vercel owns the same-origin operational API used by the workspace.
- The existing worker implementation is mounted through a Next.js route handler so
  its authentication, connector vault, policy, webhook, and internal-service routes
  share one implementation.
- Railway owns persistent audit/voice/background services. Those services call the
  public Vercel API through `RECOVER_API_URL` with their existing signed secrets.
- Missing or unreachable backends always return structured JSON; HTML must never
  reach API consumers.

## Connection model

- Customer credentials are saved through the existing encrypted connector vault.
- Platform environment variables remain deployment configuration; the browser can
  show whether they are configured but never reveal or edit secret values.
- Activepieces is optional. The native queue remains the core runtime; Activepieces
  is an auxiliary event/workflow sink.
- Firecrawl is optional enrichment for crawl/extraction. Lighthouse and the
  persistent audit worker remain required for performance/browser evidence.

## Acceptance criteria

- `/app` uses the same shell as every nested customer route.
- `/api/runtime` and `/api/integrations` return JSON in Vercel production.
- Client API errors never expose raw HTML or JSON parser errors.
- Owner status is calculated from real configuration and health probes.
- Every visible owner action navigates, performs an implemented request, or is
  explicitly unavailable with a reason.
- Public confirmation shows the submitted service and priorities without claiming
  work has already been completed or queued.
- No fabricated chart data or false "live-ready" labels remain.
