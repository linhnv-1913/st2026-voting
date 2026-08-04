# Phase 01 — Data and scoring

## Overview

- Priority: High
- Status: Complete
- Load Team Building scores alongside config and votes, then derive final totals without writing calculated scores back to Firestore.

## Requirements

- Reuse vote ranks and `40/30/20/10` points.
- Match options to Hub IDs by normalized labels, never array position.
- Rank totals densely and deterministically.
- Treat a missing score document as four zero scores; surface subscription errors.

## Related files

- `src/components/ResultsDisplay.tsx`
- `src/components/results-scoring.ts`
- `src/hubOptions.ts`
- `src/types.ts`

## Implementation

1. Export a Hub-label-to-ID helper.
2. Add final leaderboard score types and calculation.
3. Subscribe to `team-building/scores` from the results screen.
4. Gate the final awards data on poll completion and successful data loading.

## Success criteria

- Total and dense final rank are correct for normal, tied, and all-zero results.
- Existing vote documents and Team Building documents remain unchanged.
