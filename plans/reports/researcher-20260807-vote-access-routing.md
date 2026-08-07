# Research Report: Tokenized Vote URL Routing and Admin Impact

Date: 2026-08-07  
Scope: read-only inspection of the current working tree; no application source was edited.

## Executive summary

- The checkout now contains an in-progress token slice in untracked `src/vote-access.ts` and `src/vote-access-service.ts`: 16 fixed codes, `vote-links/{code}`, and a default quota of 10 per code. `AdminPanel` and Firestore rules are not integrated with it yet.
- `App.tsx:23` already adds `/:accessCode` after the static routes. `UserVote` validates the allowlist, reads the link, shows used/max counts, and atomically increments the link with a per-code vote document.
- The smallest safe completion is to align rules and the admin UI with this existing shape, fix the generic root QR/root-route mismatch, and keep all votes in the existing top-level `votes` collection.
- Results aggregation can remain unchanged because it counts `optionIds`/legacy `optionId` from every top-level vote. Token metadata is orthogonal to scoring.

## Evidence and current state

- `src/App.tsx:17-23` registers `/`, `/admin/*`, `/results`, `/final-awards`, and `/score`. The router uses `BrowserRouter basename={import.meta.env.BASE_URL}` at line 15.
- `src/components/UserVote.tsx:44-71` creates an anonymous Firebase session; `:73-131` reads `config/main` and the UID-bound vote; `:171-205` writes three option IDs to `votes/vote_<uid>`.
- `src/components/AdminPanel.tsx:194-227` subscribes to `config/main` and all `votes`; `:335-342` counts every vote; `:299-324` resets votes and historical `voter-claims`.
- `src/components/results-qr-dialog.tsx:5-6` hard-codes the non-token URL `https://sal.vn/c3-voting`; its props currently have no URL/code input (`:7-17`).
- `src/components/use-results-data.ts:40-100` reads `config/main`, `votes`, and `team-building/scores`; `:121-153` counts by `optionIds` with legacy `optionId` fallback.
- `src/components/use-final-results-confirmation.ts:39-56` re-reads the same top-level `votes` collection for the final snapshot.
- `src/types.ts:25-40` now has optional `Vote.accessCode` and `VoteAccessLink` (`voteCount`, `maxVotes`, `isActive`).
- `src/vote-access.ts:3-23` defines collection `vote-links`, 16 codes, and `VOTE_ACCESS_MAX_VOTES = 10`; `:31-33` changes vote IDs to `vote_<uid>_<accessCode>`.
- `src/vote-access-service.ts:31-46` has an idempotent missing-link seed helper; `:49-82` uses a client Firestore transaction to check quota, increment `voteCount`, and write the top-level vote.
- `firestore.rules:69-97` still requires `vote_<uid>`, allows only three vote fields, and has no `vote-links` match. The current token transaction will therefore be denied until rules change.
- The working tree is already dirty in several application files. The two token files appeared as untracked files during this read-only inspection; conclusions use the latest contents and no source file was edited by this task.
- Existing plans call the scoreboard `/team-building`, but current code uses `/score` (`App.tsx:22`, `team-building-score-editor.tsx:67`). Treat current code as authoritative and record this plan drift separately.

## Route precedence

React Router 6 ranks route branches by specificity; declaration order is not the main precedence mechanism. A one-segment `/:code` branch will therefore lose to these static branches:

| URL | Current owner | Token impact |
|---|---|---|
| `/` | `UserVote` | Keep as legacy/fallback during rollout, or explicitly show “token required”. |
| `/:accessCode` | `UserVote` (current in-progress route) | Validates exactly one path segment against the 16-code allowlist. |
| `/admin` and `/admin/*` | `AdminPanel` | Static `admin` wins over `:code`; nested admin paths remain safe. |
| `/results` | `ResultsDisplay` | Static `results` wins; admin access hook is unchanged. |
| `/final-awards` | `FinalAwardsDisplay` | Static `final-awards` wins; final aggregation is unchanged. |
| `/score` | `TeamBuildingScoreboard` | Static `score` wins; keep it public and outside token validation. |

The current registration order is correct: static routes first and `/:accessCode` last. Static ranking, not order alone, protects `/admin`, `/results`, `/final-awards`, and `/score`; the dynamic route does not match multi-segment paths. Keep `basename` and the GitHub Pages `404.html` redirect. Generate links from `window.location.origin + import.meta.env.BASE_URL`, not from `/`.

## Smallest frontend changes

1. Routing/param plumbing is already present: `App.tsx:23` and `UserVote.tsx:39`. Keep the static branches unchanged.
2. `UserVote.tsx:104-131` validates the fixed allowlist and subscribes to `vote-links/{code}`; `:309-329` renders invalid-link UI. It currently also loads config/auth before rejecting an invalid code, which is harmless but avoidable.
3. The current root `/` still renders `UserVote` with no `accessCode`, so it ends in the invalid-link state (`UserVote.tsx:309-329`). The existing QR points to that root. Either make `/` a deliberate token-required landing page and change the QR to a selected token URL, or preserve a documented generic fallback.
4. The public card currently displays `voteCount/maxVotes` used (`UserVote.tsx:395-400`), not remaining quota. Import/use `getRemainingVotes()` for explicit “remaining” text; keep the full-state guard.
5. `submitVoteForAccessCode()` already uses a transaction and writes `votes/{uid+code}` with `accessCode`. It enforces one vote per anonymous UID per code, not one real person. Rules must enforce the same relationship and poll window.
6. Keep `ResultsQrDialog` generic by accepting a URL prop, or leave it only for a generic/fallback QR while the admin panel renders token-specific copy/QR controls. One hard-coded root QR cannot represent all 16 links.

## Smallest admin/data changes

Current in-progress collection: `vote-links/{code}`.

```text
{ voteCount: int, maxVotes: int, isActive: bool }
```

- The current 16-code list is in the public bundle (`vote-access.ts:6-23`), with default `maxVotes=10`; there are no slot/label/poll metadata fields.
- `ensureVoteAccessLinks()` seeds missing documents idempotently, but no current caller exists in `AdminPanel.tsx`. Add a dedicated admin-only panel/action, not a public startup side effect.
- Add admin-only list/read/write rules for `vote-links`. Permit a bearer URL to read only its exact document if active; do not permit public collection listing. Enforce positive integer quota, bounded count, and monotonic usage in rules.
- The client transaction is useful for race control but is not security by itself. `firestore.rules` must validate the code, vote ID, `accessCode`, quota increment, and `isPollOpen()` using server-side state.
- Add a dedicated `VoteAccessLinksPanel` rather than expanding the already-large `AdminPanel.tsx`. Display all 16 in the constant order, generate base-aware URLs, and show used/max plus computed remaining, status, copy, and optional QR.
- If the 16 strings are bearer secrets, keeping all of them in the public JS bundle defeats secrecy. The allowlist is UX validation only; authorization must be the exact Firestore document/rule transaction.
- Current reset deletes `votes` and `voter-claims` only (`AdminPanel.tsx:299-324`). It must also reset `voteCount` in all 16 `vote-links` docs, or reset leaves every link exhausted.

## Result aggregation compatibility

- Keep every vote in `votes`. The current service already does this; do not move votes only under `vote-links/{code}` because both result hooks read the top-level collection.
- Do not filter results by code. Existing admin/results aggregation counts `optionIds` and supports legacy `optionId`; `accessCode` is ignored by those calculations.
- The new ID `vote_<uid>_<accessCode>` changes the uniqueness boundary to one vote per anonymous browser/profile per code. It permits up to 10 codes uses across distinct UIDs, but still does not represent one real person.
- `team-building/scores`, final confirmation timing, Hub canonicalization, and `/final-awards` ranking need no token-aware logic if the vote collection and option fields remain unchanged.
- `team-building/scores`, final confirmation timing, Hub canonicalization, and `/final-awards` ranking do not need token-aware logic when the vote collection contract remains unchanged.

## Verification matrix and open decisions

- Route checks: `/base/admin`, `/base/results`, `/base/final-awards`, `/base/score` must never enter token validation; `/base/<valid-code>` must; invalid reserved/unknown codes must fail cleanly.
- Data checks: seed/list all 16 in stable order; verify remaining quota after one use, concurrent use at the last slot, disabled/expired code, and reset of both votes and link counters.
- Regression checks: legacy `optionId`, current `optionIds`, total vote count, final server snapshot, and final awards ranking remain unchanged.
- Decide whether `/` remains a non-token fallback, whether voters or only admins see remaining quota, whether quota is one-use or multi-use, and provide the 16 real codes/labels/limits.

## Summary

The current slice has the right route shape and top-level vote placement, but it is incomplete: `vote-links` needs matching Firestore rules, `AdminPanel` needs seeding/listing/reset support, the voter card needs explicit remaining-quota text, and the root QR must stop sending users to an invalid non-token route. Results readers can remain unchanged.

## Concerns/Blockers

The 16 codes and default quota of 10 are now present in untracked source, but labels/slot metadata and the desired root policy are still undefined. The codes are also publicly bundled. Source-level review does not prove deployed Firestore enforcement; rules/emulator or production verification is required.

**Status:** DONE_WITH_CONCERNS
