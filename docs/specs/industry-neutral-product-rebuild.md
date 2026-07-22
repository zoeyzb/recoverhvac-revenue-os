# Spec: Industry-neutral Recover product

## Objective
Turn Recover from an HVAC agency demo into a self-serve revenue operations product for service businesses. A visitor must understand the product, compare prices, create an organization account, sign in, and reach an honest workspace for calls, follow-up, calendar, website/SEO audits, automations, and verified revenue.

## Acceptance criteria
- No public or authenticated interface identifies the product as HVAC-only.
- Public navigation and CTAs lead to real signup/login pages, not the private operator password screen or a mailto link.
- Signup validates business name, email, and password; creates a Supabase user, organization, owner membership, safe automation settings, and disabled workflow templates.
- Login and signup never display HTML, JSON parser details, or provider internals. Invalid email is rejected client-side and server-side in plain English.
- `/owner/login` remains an internal administrator route and is not marketed to customers.
- The workspace groups Today, Conversations, Calendar, Website & SEO, Automations, Revenue, and Integrations without fabricated records.
- Disconnected providers and unavailable data remain visibly disconnected/unavailable.
- Desktop and mobile layouts have no horizontal overflow, hydration warning, or inaccessible form controls.

## Architecture
- Next.js App Router serves the public site and auth screens.
- The packaged edge worker remains the API boundary and asset router.
- Supabase Auth stores users; existing `organizations` and `organization_members` tables provide tenant ownership.
- Existing queue, policy, integration, audit, voice, timeline, and ledger systems are preserved.
- New account provisioning is additive and uses the server-only Supabase service role after successful Auth signup.

## Commands
- Develop: `npm run dev -- --hostname 127.0.0.1`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Production build: `npm run build`

## Testing strategy
- Worker unit/integration tests cover validation, signup provisioning, normalized failures, and existing auth regression paths.
- TypeScript and ESLint cover interface correctness.
- Production build validates server/client boundaries and packaging.
- Runtime HTTP checks cover public pages and auth endpoints.

## Boundaries
- Always: validate at browser and API boundaries; use secure HTTP-only cookies; default automation to test/disabled; display only real provider and database state.
- Ask first: live provider authorization, live outreach, payment activation, destructive database changes.
- Never: expose service-role secrets, invent customer results, enable outreach during signup, or claim guaranteed revenue.

## Repository influence
- addyosmani/agent-skills: specification, vertical slices, frontend quality, API errors, TDD, security review.
- github/spec-kit: testable requirements and acceptance criteria.
- Egonex-AI/Understand-Anything: dependency tracing across Next routes, the packaged worker, Supabase, and the operator UI.
- browser-use/browser-use: critical-flow and failure-state browser verification patterns; no source copied.

