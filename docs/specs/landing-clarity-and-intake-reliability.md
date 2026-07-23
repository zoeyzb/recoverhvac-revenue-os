# Landing clarity and intake reliability

## Outcome

Make the public site faster to understand, remove unfinished visual space, make
owner access discoverable, and ensure the recovery-plan form reaches a real,
durable backend.

## Acceptance criteria

- The core promise is short, concrete, and outcome-led.
- The workflow demo explains the handoff without internal product language.
- The proof section uses a compact two-column composition and explains the
  evidence attached to conversations, bookings, and revenue.
- FAQ copy states that Recover can assist a team or replace selected repetitive
  front-office work, depending on the approved scope.
- Launch copy states that the audit can start the same day and that a plan
  follows before integrations are connected.
- Public intake validates input, rejects cross-origin mutations, never exposes
  service credentials, and persists through a service-role-only Supabase table.
- Local Next.js and the packaged Worker expose the same `/api/intake` contract.
- Missing backend configuration produces a useful, non-technical error.
- Owner login is visible in the primary navigation and clearly distinguished
  from client login.

## Verification

- Worker regression tests cover accepted, invalid, and unconfigured intake.
- Full test, typecheck, lint, production build, and dependency audit pass.
- Desktop and mobile layouts are inspected at the supported breakpoints.
