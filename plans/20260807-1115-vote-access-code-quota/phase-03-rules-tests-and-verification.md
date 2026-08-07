# Phase 03 — rules, tests, and verification

## Scope

- Allow public point reads only for known link IDs; keep link listing/admin writes restricted.
- Require a paired link increment and vote create through `getAfter()`.
- Reject malformed codes, duplicate vote IDs, counter overflow, late votes, and updates.
- Add pure contract tests and run repository validation.

## Files

- `firestore.rules`
- `src/vote-access.test.ts`
- `package.json`

## Success criteria

The source contract proves 16 unique codes and quota 10. Type-check, tests, build,
diff check, and local deep-route HTTP checks pass. Rules deployment/emulator tests
remain a required external verification step.
