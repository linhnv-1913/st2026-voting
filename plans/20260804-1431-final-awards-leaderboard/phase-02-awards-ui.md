# Phase 02 — Awards UI

## Overview

- Priority: High
- Status: Complete
- Recreate the supplied red-and-gold Japanese festival awards composition using responsive HTML/CSS and the four supplied Hub images.

## Requirements

- Title: `TRAO GIẢI CHUNG CUỘC`.
- Each Hub visually shows final rank and total score to match the approved reference; the Team Building/vote breakdown remains in its accessible label.
- Tied teams receive identical rank styling.
- Desktop uses a podium composition; mobile preserves score order without horizontal scrolling.
- Images have fixed aspect ratios, meaningful alt text, and optimized WebP files.
- Motion respects `prefers-reduced-motion`.

## Related files

- `src/components/final-awards-leaderboard.tsx`
- `src/components/final-awards-leaderboard.css`
- `src/components/ResultsDisplay.tsx`
- `public/images/results/*`

## Implementation

1. Optimize supplied Hub images to WebP.
2. Build a semantic ordered leaderboard component.
3. Add podium positioning, rank medals, score plates, and festival atmosphere.
4. Replace the live results cards with the standalone awards stage when the poll is final.

## Success criteria

- Four Hub panels render with correct artwork and data.
- Rank hierarchy remains clear at desktop, tablet, and mobile widths.
