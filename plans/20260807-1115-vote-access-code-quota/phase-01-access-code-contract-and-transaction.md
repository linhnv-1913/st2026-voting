# Phase 01 — access-code contract and transaction

## Context

- [Rules research](../reports/researcher-20260807-vote-access-rules.md)
- [Routing research](../reports/researcher-20260807-vote-access-routing.md)

## Scope

- Add the exact 16-code allowlist and `vote-links` contract.
- Seed missing links from the admin surface without overwriting existing counts.
- Submit one vote per anonymous browser and code with a Firestore transaction.
- Preserve root `votes` documents so results readers need no migration.

## Files

- `src/vote-access.ts`
- `src/vote-access-service.ts`
- `src/types.ts`
- `firebase-blueprint.json`

## Success criteria

No duplicate browser/code vote; transaction rejects a full or missing link;
new vote documents still expose `optionIds` to existing result aggregation.
