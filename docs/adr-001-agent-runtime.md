# ADR 001: Do not embed Conway Automaton

## Decision

RecoverHVAC will not embed `Conway-Research/automaton` in its production runtime.

## Why

Automaton is designed as a continuously running, self-modifying and self-replicating agent with shell, wallet, infrastructure and real-world write access. RecoverHVAC needs narrow, tenant-scoped workflows with explicit approvals, deterministic policies and provider audit trails. Embedding the full runtime would enlarge the security boundary without improving the core missed-call, email, CRM or revenue-reconciliation workflows.

## Patterns retained

- A bounded observe-decide-act loop for individual workflow runs
- Heartbeats for provider and queue health
- Git-versioned workflow definitions
- Immutable safety policy evaluated before external actions

These patterns will be implemented inside the existing audited workflow layer rather than by granting a sovereign agent broad runtime access.
