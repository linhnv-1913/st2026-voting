# Team Building Score + Poll Closing Study

Date: 2026-07-31
Mode: read-only repo study, no source edits

## Recommendation

1. Store Team building scores in a dedicated doc, not `config/main`.
Best fit: `teamBuildingScores/main` with fixed fields:
`hub1Score`, `hub2Score`, `hub4Score`, `hub5Score`, `updatedAt`, `updatedBy`.
Why: current admin save uses `setDoc(doc(db, 'config', 'main'), {...})` and would overwrite unrelated fields on that doc (`src/components/AdminPanel.tsx:241-246`; Firebase `setDoc` overwrites unless merge is used: https://firebase.google.com/docs/firestore/manage-data/add-data).

2. Add a separate `/scoreboard` route for display.
Best auth model: public read for the dedicated Team building score doc, admin-only write via the existing `admins/{uid}` model. This fits projector/display use without forcing admin login on the display browser. Do not relax `votes` list access for a public screen; if public poll totals are needed later, publish an aggregate doc instead of exposing raw `votes`.

3. Treat poll close as an effective state, not only a stored flag:
`effectiveOpen = isActive && (!endTime || now < endTime)`.
Current rules already hard-stop new votes after `endTime`; if you need the stored doc to flip to closed even with no client open, add a scheduled backend job.

## Evidence

- Routes are only `/`, `/admin/*`, `/results` today (`src/App.tsx:13-18`).
- Admin auth is Firebase Auth + presence of `admins/{uid}` (`src/components/AdminPanel.tsx:20-36`, `76-85`, `150-170`; `firestore.rules:76-82`).
- Admin poll config is loaded from and saved back to `config/main` (`src/components/AdminPanel.tsx:191-214`, `216-246`).
- Votes are read from raw `votes` collection in admin/results (`src/components/AdminPanel.tsx:204-208`, `297-300`; `src/components/ResultsDisplay.tsx:53-57`, `99-105`).
- Vote creation is blocked by Firestore rules when `request.time > endTime` (`firestore.rules:45-49`, `69-70`; Firestore rules conditions doc: https://firebase.google.com/docs/firestore/security/rules-conditions).
- Firebase scheduled functions exist for durable time-based state mutation if needed: https://firebase.google.com/docs/functions/schedule-functions.

## Answers

### 1. Minimal safe Firestore schema and rules

Use a separate document:

```ts
teamBuildingScores/main {
  hub1Score: number
  hub2Score: number
  hub4Score: number
  hub5Score: number
  updatedAt: number
  updatedBy: string
}
```

Why this shape:
- Fixed keys are easy to validate in rules.
- It matches the canonical hub mapping already normalized in `src/hubOptions.ts:3-27`.
- It avoids coupling Team building data to poll lifecycle fields in `Config` (`src/types.ts:6-12`).

Minimal rules:
- `allow read: if true` for the scoreboard doc if the screen is public.
- `allow create, update: if isAdmin()` and require exactly the 6 keys above, all four scores numeric and non-negative, `updatedBy == request.auth.uid`.
- `allow delete: if false` or admin-only; safer default is no delete.

### 2. Best route and authorization model

Recommended:
- New display route: `/scoreboard`
- Read model: public scoreboard doc only
- Edit model: keep editing inside `/admin` under existing `admins/{uid}` checks

Why this is the best fit:
- `/results` is admin-gated today (`src/components/ResultsDisplay.tsx:20-33`, `83-97`), so it is awkward for a projector or MC screen.
- `config/main` is already public-read (`firestore.rules:37-42`), but raw `votes` are intentionally admin-only (`firestore.rules:65-73`).
- Team building scores are public event data; raw vote documents are not.

### 3. Exact admin touchpoints

Current touchpoints that matter:
- Auth gate: `src/components/AdminPanel.tsx:20-36`, `150-170`
- Dashboard state: `src/components/AdminPanel.tsx:174-183`
- Config subscription: `src/components/AdminPanel.tsx:191-202`
- Votes subscription: `src/components/AdminPanel.tsx:204-208`
- Poll save path: `src/components/AdminPanel.tsx:216-246`
- Admin form/actions UI: `src/components/AdminPanel.tsx:323-420`

Safe implementation direction:
- Add separate Team building score state beside existing poll state.
- Add a second snapshot listener for the new score doc; do not piggyback on `config/main`.
- Add a dedicated save handler for the score doc; do not extend `handleSaveConfig` unless it is changed to avoid doc overwrite.
- Keep results link behavior separate; scoreboard can have its own route/button near `src/components/AdminPanel.tsx:312-315`.

### 4. Reliable automatic close semantics

What is already enforced now:
- Client UX closes by local clock in voter UI (`src/components/UserVote.tsx:102-120`, `197-268`).
- Results screen shows closed when local time passes `endTime` (`src/components/ResultsDisplay.tsx:99-105`, `165-167`).
- Firestore rules block any new vote create after `endTime` using server-side `request.time`, even if no client is open (`firestore.rules:45-49`, `69-70`).

What is not enforced now:
- Nothing automatically writes `config/main.isActive = false` when time expires.
- Admin status badge still depends only on `config?.isActive` (`src/components/AdminPanel.tsx:454-455`), so it can look open after expiry.

Reliable conclusion:
- If the goal is "no more votes after endTime", current rules already enforce it server-side.
- If the goal is "persistently flip the poll doc to closed for every screen/admin even with no client open", current code does not do that. Use a scheduled backend job or equivalent server writer.

### 5. Compatibility and migration/default behavior

- Separate score doc is lowest-risk: no migration needed for existing `config/main`.
- Default behavior if score doc is absent: render `0` for all four hubs and treat the scoreboard as initialized-but-empty.
- Existing vote compatibility is already mixed-mode: admin/results count both legacy `optionId` and new `optionIds` (`src/components/AdminPanel.tsx:297-300`, `src/components/ResultsDisplay.tsx:102-105`), and voter self-read also falls back to legacy (`src/components/UserVote.tsx:89-94`).
- Existing admin authorization remains doc-based; no custom-claim migration is required.

### 6. Files likely to change and verification risks

Likely file changes:
- `src/App.tsx`
- `src/components/AdminPanel.tsx`
- `src/components/ResultsDisplay.tsx` or a new scoreboard display component
- `src/types.ts`
- `firestore.rules`
- Possibly `src/components/UserVote.tsx` for consistent expired-state messaging
- Possibly `package.json` only if a scheduled backend/functions workspace is introduced

Likely unchanged:
- `src/firebase.ts` unless a separate backend/app setup is added
- `src/hubOptions.ts` unless the scoreboard needs new label helpers

Main risks:
- Source rules may differ from deployed rules.
- A public scoreboard must not require opening raw `votes` list access.
- New route must still work with the existing GitHub Pages basename/deep-link setup.
- If durable auto-close is added later, timezone/idempotency/schedule lag need verification.

## Recommendation Rank

1. Separate `teamBuildingScores/main` + public `/scoreboard` + admin-only writes via `admins/{uid}`.
2. Keep scoreboard admin-only under `/admin` if public display is not needed.
3. Reuse `config/main` for scores or expose raw `votes` publicly: not recommended.

## Unresolved

- Whether the new scoreboard should show only Team building scores, or also public poll aggregates.
- Whether "automatic close" only means blocking late votes, or also requires a durable persisted state transition.

**Status:** DONE_WITH_CONCERNS
**Summary:** Current architecture supports a safe Team building score feature with a separate Firestore doc and separate `/scoreboard` route. Poll closing is already enforced for new vote writes by Firestore rules after `endTime`, but no code currently persists `isActive=false` automatically.
**Concerns/Blockers:** Deployed Firestore rules were not verified in this read-only pass; if production rules lag behind source, live behavior can differ from the conclusions above.
