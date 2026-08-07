# Research Report: Firestore bearer-code voting quota

---
conducted: 2026-08-07T11:24:27+07:00
scope: direct Web SDK, 16 bearer codes, 10 votes per code
---

## Recommendation

Use an immutable `roundId` and ten pre-seeded slots per code. Make slot IDs
(`0` through `9`) plus create-only vote documents the quota invariant. Do not
make a client-written `usedVotes` counter the enforcement boundary; fixed slots
avoid shared-counter races under concurrent browsers.

Suggested shape; keep new votes in the existing root collection:

```text
accessCodeRounds/{roundId}                         status, maxVotesPerCode: 10, codeCount: 16
accessCodeRounds/{roundId}/codes/{codeKey}         enabled, maxVotes: 10
.../codes/{codeKey}/slots/{0..9}                   state: free|used, claimedBy, claimedAt
votes/{roundId}_{codeKey}_{slot}                   schemaVersion, roundId, accessCodeKey, slot,
                                                     optionIds, userId, submissionId, timestamp
```

`codeKey` must be a high-entropy opaque key (prefer SHA-256 of a random
128-bit token, or use the random key directly). Never use `01`..`16`, short
guessable codes, or plaintext codes in public `config/main`. Hashing reduces
at-rest exposure only; possession of the key remains bearer authorization.

## Checkout findings

- `firestore.rules:89-97`: one immutable `votes/vote_{uid}` per signed-in
  anonymous UID; no access-code/quota model.
- `UserVote.tsx:171-205`: one `writeBatch`/`batch.set`; `submitting` and
  `hasVoted` are accidental-repeat UX guards only.
- `AdminPanel.tsx:194-227,299-325`: reads all root votes; reset deletes all
  root votes and historical `voter-claims` in batches of 500.
- `src/types.ts:25-32` and `firebase-blueprint.json:17-26`: legacy Vote shape,
  no round/code/slot/submission fields; blueprint is not enforcement.
- `package.json:6-12,20`: no Firebase emulator/rules test script; no
  `firebase.json` or Firebase CLI was found in this checkout.

## Rules contract

Keep the default-deny catch-all and enforce:

1. Admin-only create/update/delete for rounds, code docs, and ten slot docs;
   clients cannot add slot `10`, delete a slot, or reopen `used`.
2. Public slot transition is only `free -> used`, by a signed-in user with
   `claimedBy == request.auth.uid`, active round/code, and open poll.
3. Public vote is create-only, exact fields/types, valid distinct options,
   `userId == request.auth.uid`, and fields/ID matching round, code, and slot.
   Require integer slot `0..9`; deny client update/delete.
4. Use `getAfter()` both ways: slot update must see the matching vote after the
   atomic operation, and vote create must see that same slot become `used`.
   Slot-only and vote-only writes fail.
5. Do not list-read code docs; vote reads are admin-only or caller-own. Rules
   can internally `get()` protected code/round docs for authorization.
6. Gate new writes on `activeRoundId`, round status, `isActive`, and the current
   `[startTime,endTime)` window. After cutover, deny the legacy UID-create path.

Authoritative invariant: `0 <= used slots(code, round) <= 10`. If `usedVotes`
is wanted for admin display, derive/reconcile it from slots or update it only
in a trusted backend transaction; never let a client increment it independently.

## Atomicity and duplicate submissions

- A transaction can read a free slot, then write slot + vote. Firestore retries
  on contention and may rerun the callback; keep React state/side effects out
  of it. A two-write batch is atomic and `getAfter()` supplies the pair check.
- Web `WriteBatch` has no create method; `batch.set(voteRef, data)` is safe only
  with rules that allow create and deny update. Deterministic vote IDs make
  same-slot races resolve to one winner.
- Keep one `submissionId`/slot across an unknown-result retry; read the caller's
  own vote before consuming another slot. `submitting` is not enforcement.
- Batches may persist offline while transactions fail offline. Show success
  only after `commit()` resolves; window rules apply at actual commit time.
- A bearer code is transferable: ten slots limit the code, not a real person.
  Verified auth or a backend one-time redemption flow is required for identity.

## Counter alternative

If a counter is mandatory, use a trusted callable/backend transaction: read the
code and deterministic vote ID, reject `usedVotes >= 10` or an existing vote,
then create the vote and increment in one transaction. For direct Web SDK,
batch both writes and rules must enforce `getAfter(code).usedVotes ==
get(code).usedVotes + 1`, immutable counter fields, matching vote ID, and
`usedVotes <= 10`; test 9/10 contention in the emulator. Naive read-then-write,
separate writes, or bare `increment(1)` does not enforce an upper bound.

## Seed, reset, and migration

- Seed exactly 16 code docs and 160 slot docs (177 writes with the round), then
  publish `activeRoundId` only after seeding succeeds. Return raw tokens once,
  to admins only; do not expose the list in public config.
- Reset by closing the old round first, then create a new round/generation and
  fresh slots. Do not zero a live counter; retain old votes and delete later in
  scoped batches of at most 500 operations if required.
- Current admin reset is too broad for mixed data: it removes legacy and new
  root votes and does not reset code state. Scope deletion by round; do not
  delete `vote_{uid}` merely to seed a new round.
- Preserve old votes unchanged; new IDs cannot collide with `vote_{uid}` and
  old `optionId`/`optionIds` results can remain admin-counted. Never infer a
  code from an old UID. Add an explicit `votingMode`/round gate: legacy creates
  may remain only before cutover, then must be denied. Update types/blueprint
  later with optional fields for mixed documents.

## Required emulator/rules tests

1. Non-admin, duplicate/guessable keys, wrong count, and missing slot `0..9`
   fail; exactly 16x10 seed succeeds.
2. Valid open-window batch succeeds; slot-only/vote-only, malformed fields,
   wrong UID/code/round, invalid options, update, and delete fail.
3. Ten slots succeed; slot `10`, negative, non-integer, and an eleventh fail.
   Run 20 concurrent clients at counts 0, 9, and 10; count never exceeds ten.
4. Two browsers racing one slot yield one vote. Same slot/submission retry is
   idempotent; a new submission consumes at most another slot.
5. Start boundary succeeds and end boundary fails; inactive/closed/wrong-round
   and disabled-code writes fail. Old round fails after reset; new round works.
6. Legacy reads/results remain compatible, legacy create is denied after
   cutover, `voter-claims` cannot authorize a new vote, and non-admins cannot
   list votes/codes or seed/reset. If a counter remains, assert it equals the
   number of used slots after every test and after an interrupted reset.

## Sources

- [Transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Security Rules conditions and getAfter](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Field-level validation with diff/affectedKeys](https://firebase.google.com/docs/firestore/security/rules-fields)
- [Atomic numeric increments](https://firebase.google.com/docs/firestore/manage-data/add-data#increment_a_numeric_value)
- [Firestore quotas and rules/write limits](https://firebase.google.com/docs/firestore/quotas)

**Status:** DONE_WITH_CONCERNS
**Summary:** Research complete; fixed per-code slots with getAfter-paired atomic writes are the direct-WebSDK recommendation; counters require a trusted transaction or stricter emulator proof.
**Concerns/Blockers:** Firebase CLI/emulator is absent, so rule syntax, concurrency behavior, and deployed enforcement remain unverified until emulator/deployment tests run.
