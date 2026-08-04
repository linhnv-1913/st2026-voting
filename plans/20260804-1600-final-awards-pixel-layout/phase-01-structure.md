# Phase 01: Establish Final-State Structure

## Context Links

- [Plan overview](./plan.md)
- `src/components/ResultsDisplay.tsx`
- `src/components/final-awards-leaderboard.tsx`

## Overview

- Priority: P1
- Status: Complete
- Goal: make the final awards experience a standalone stage without changing its data contract.

## Key Insights

- `ResultsDisplay` remains the owner of access, loading, snapshots, countdown, and final-state confirmation.
- Presentation order and podium geometry must not mutate ranking or scoring results.
- Normal no-tie layout uses visual slots `2nd / 1st / 3rd / 4th`; ties retain their real dense-rank labels and equal rank treatment.

## Requirements

- Return the awards stage as the final-state surface; keep live results and summary unchanged before finalization.
- Preserve all values passed into `FinalAwardsLeaderboard`.
- Keep DOM reading order meaningful; use CSS placement for desktop composition where possible.
- Render the existing four Hub images without changing their semantic mapping.

## Architecture

`ResultsDisplay` final-state branch -> `FinalAwardsLeaderboard` -> header/torii, podium list, score plates, footer ribbon. Data continues to flow one way from existing final-result derivation.

## Related Code Files

- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\ResultsDisplay.tsx`
- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.tsx`
- Create/Delete: none

## Implementation Steps

1. Isolate final rendering from `.results-screen__header` and live two-column content.
2. Keep loading, denied, and live branches intact.
3. Give the awards component clear stage, header, podium, panel, score-plate, and ribbon regions.
4. Attach rank/slot data attributes needed for styling; do not recalculate ranks or points.
5. Keep each code file below 200 lines; extract only if the limit would be exceeded.

## Todo List

- [x] Final state renders as one standalone stage.
- [x] Live and access states remain unchanged.
- [x] Four panels consume existing Hub artwork and data.
- [x] Dense ties retain authoritative labels and scores.

## Success Criteria

- Final-state DOM contains no live dashboard wrapper.
- Existing scoring/data tests pass without expectation changes.
- Screen-reader order communicates teams, ranks, and scores coherently.

## Risk Assessment

- Risk: visual reordering implies altered ranking. Mitigation: keep source data immutable and separate slot styling from rank values.
- Risk: final branch regresses loading/auth. Mitigation: change only the already-confirmed final path.

## Security Considerations

- No auth, Firestore, or permission changes.
- Do not expose additional vote/user data in markup.

## Next Steps

- Proceed to [Phase 02](./phase-02-styling.md) after structural tests pass.
