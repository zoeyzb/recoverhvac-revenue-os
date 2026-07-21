# Implementation Plan: Revenue OS Realignment

1. Restore the complete provider map and correct provider responsibilities.
2. Consolidate navigation into Today, Inbox, Growth and System.
3. Add a typed AI action-plan contract and fail-closed policy evaluation.
4. Add conversational voice dispatch boundary for LiveKit plus Twilio; retain safe one-way test calls separately.
5. Add real event persistence and unified timeline after Supabase credentials are available.
6. Verify APIs, responsive UI, production build and private deployment.

## Risks

- No customer/provider credentials exist yet, so provider execution must remain disabled.
- Sites cannot host a continuously connected LiveKit voice worker; that worker needs a separate service deployment.
- OpenOutreach's LinkedIn automation conflicts with the approved scope and remains isolated.
