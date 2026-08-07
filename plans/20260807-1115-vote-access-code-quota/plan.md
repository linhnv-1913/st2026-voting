---
work_type: feature
status: complete
---

# 16 access-code voting quota

## Goal

Persist the 16 supplied bearer codes in `vote-links/{code}`, route voters through
`/<code>`, and enforce a maximum of 10 immutable votes per code (160 total).
Keep the existing three-option vote payload and top-level `votes` aggregation.

## Phases

- [x] [Phase 01 — access-code contract and transaction](phase-01-access-code-contract-and-transaction.md)
- [x] [Phase 02 — routing, admin links, and QR](phase-02-routing-admin-links-and-qr.md)
- [x] [Phase 03 — rules, tests, and verification](phase-03-rules-tests-and-verification.md)

## Key invariants

- The code allowlist contains exactly 16 unique 12-character IDs.
- Every seeded link has `voteCount: 0..10`, `maxVotes: 10`, and `isActive`.
- A vote creates `votes/vote_{uid}_{code}` and increments its link in one transaction.
- Firestore Rules require the matching vote and counter update through `getAfter()`.
- Existing legacy votes remain readable; admin reset clears votes and link counts.

## Verification

`bun run lint`, `bun run test`, `bun run build`, `git diff --check`, and a local
HTTP 200 check for `/7f3k9m2q8x1a` passed. Firebase deployment/emulator validation
is still external because this checkout has no Firebase CLI/emulator.
