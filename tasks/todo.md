# Runtime and product repair checklist

- [x] Confirm production `/api/runtime` and `/api/integrations` return HTML 404.
- [x] Confirm the Railway worker contains the missing API implementations.
- [x] Confirm Activepieces is auxiliary in the current worker.
- [x] Confirm Firecrawl is not currently used by the codebase.
- [x] Mount the operational API in the Vercel application.
- [x] Guarantee structured JSON responses from operational routes.
- [x] Remove the alternate `/app` dashboard.
- [x] Add live owner readiness endpoint and simplified owner UI.
- [x] Improve request confirmation.
- [x] Add optional Firecrawl configuration.
- [x] Run tests, typecheck, lint, and build.
- [ ] Complete browser checks on a published preview.
- [ ] Publish and verify production.
