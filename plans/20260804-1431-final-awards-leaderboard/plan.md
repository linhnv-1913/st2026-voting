# Final awards leaderboard

## Goal

Combine existing Team Building scores with the final vote-rank points and present a responsive ceremony-style leaderboard on `/results` after the poll closes.

## Phases

- [x] [Phase 01 — Data and scoring](./phase-01-data-and-scoring.md)
- [x] [Phase 02 — Awards UI](./phase-02-awards-ui.md)
- [x] [Phase 03 — Verification](./phase-03-verification.md)

## Dependencies

- Existing `team-building/scores` Firestore document.
- Existing vote dense-ranking rule and `40/30/20/10` points.
- Hub artwork supplied by the user.

## Key decisions

- Final score = Team Building score + vote-rank points.
- Final rank uses dense ranking (`1,1,2,3`) with canonical Hub order as a stable tie-breaker for display only.
- All-zero totals remain unranked.
- The standalone awards stage replaces the live results surface only after the poll deadline and a post-deadline server refresh confirms all required data.
