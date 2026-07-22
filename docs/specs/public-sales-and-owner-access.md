# Public Sales Experience and Owner Access

## Objective

Make RecoverHVAC commercially understandable to an HVAC owner and make owner authentication work in the packaged Sites runtime, not only in local Next.js development.

## Requirements

- Explain the specific leaks Recover addresses: missed calls, unsold estimates, after-hours demand, and dormant customers.
- Publish concrete entry, core, and growth prices with setup and provider-usage exclusions.
- Let prospects model opportunity from their own inputs without presenting the result as guaranteed or verified revenue.
- Use one conversion path with plan-specific email subjects and no nonfunctional form controls.
- Preserve the existing operator product, integrations, data model, tenant authorization, and safe communication policies.
- Authenticate `/owner/*` in the deployed Worker with the same session contract used by local Next.js.
- Fail with a useful setup message when either owner secret is absent.

## Authentication acceptance criteria

- `POST /api/owner/login` is implemented by the packaged Worker.
- Correct credentials issue a Secure, HTTP-only, SameSite owner cookie.
- Incorrect credentials do not issue a cookie.
- `/owner/*` redirects to `/owner/login/` without a valid cookie.
- `/owner/login/` remains public and explains missing deployment variables.
- Logout clears the owner cookie.
- The session verifier does not embed the owner password in the cookie value.

## Sales acceptance criteria

- A visitor can identify the offer, audience, three primary services, operating model, safeguards, integrations, prices, usage exclusions, and next action from the home page.
- Pricing contains a one-time audit, a one-workflow plan, and a multi-workflow plan.
- The calculator starts without fabricated business values and labels output as a planning estimate.
- No testimonials, performance percentages, recovered-dollar claims, or customer logos are invented.
- Desktop and mobile layouts remain usable and keyboard-accessible.

## Verification

- Worker regression tests cover configured login, missing configuration, protected assets, secure cookie attributes, and password rejection.
- Run tests, TypeScript, ESLint, and the production Sites build.
- Inspect the home page and owner-login page at desktop and mobile widths.
