# Phase 02: Rebalance Leaderboard Responsively

## Context Links

- [Plan overview](./plan.md)
- [Phase 01](./phase-01-key-visual-backdrop.md)
- `src/components/final-awards-leaderboard.tsx`
- `src/components/final-awards-leaderboard.css`
- `src/components/final-awards-leaderboard-responsive.css`
- Existing Hub artwork under `public/images/results/`

## Overview

- Priority: P1
- Status: Pending
- Goal: keep all four teams prominent and legible over the brighter key visual at every target width.

## Key Insights

- Current desktop visual placement already reads second / first / third / fourth and should be preserved.
- Four narrow columns at phone widths make names, medals, and scores too small; mobile needs a structural fallback.
- Rank color alone is insufficient; number, Hub artwork, and score plate remain required.

## Requirements

- Desktop ≥900px: four bottom-aligned podiums; first place remains tallest and slightly wider.
- Tablet 621–899px: two-column card grid with rank order preserved.
- Phone ≤620px: one-column compact award cards; no horizontal scroll at 320px.
- Dense ties retain actual rank labels and equal rank treatment; presentation must not recalculate data.
- Preserve Hub artwork aspect ratio and eager loading behavior for the final reveal.

## Architecture

Base CSS owns tokens, podium/panel/medal/plate/ribbon styles. Responsive CSS alone changes grid, card geometry, background asset, spacing, and type scale. Rank data remains in TSX classes; CSS never infers rank from array position.

## Related Code Files

- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.css`
- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard-responsive.css`
- Verify only: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.tsx`
- Create/Delete: none

## Implementation Steps

1. Replace red-stage tokens with semantic sky blue, navy, torii red, festival gold, and cream plate tokens.
2. Keep desktop slot placement and static rank offsets; use `clamp()` for gaps, medals, scores, and panel width.
3. Add a 2×2 tablet layout and remove slot-based grid-column overrides there.
4. Convert phone panels to compact single-column cards with readable artwork, medal, and score plate regions.
5. Switch to `/matsuri-key-visual-mobile.jpg` on narrow screens and size it as a finite masthead, not a fixed full-page crop.
6. Keep score text at WCAG AA contrast and tabular numeral alignment.
7. Limit reveal motion to the existing panel entrance; reduced motion retains static hierarchy.

## Todo List

- [ ] Desktop podium hierarchy remains clear.
- [ ] Tablet uses a readable 2×2 grid.
- [ ] Phone uses compact stacked cards without overflow.
- [ ] Scores and ranks remain textually explicit.
- [ ] Base/responsive CSS responsibilities stay DRY.

## Success Criteria

- Hub art and scores remain readable at 200% zoom and all target widths.
- No document-level horizontal scrollbar.
- Equal dense ranks receive equal visual treatment.
- All touched code files remain below 200 lines.

## Risk Assessment

- Risk: breakpoint reshaping changes perceived rank order. Mitigation: retain semantic DOM order and explicit rank labels.
- Risk: mobile masthead consumes too much height. Mitigation: cap its height and transition into scrolling content.

## Security Considerations

- CSS/layout only; no auth or data-contract changes.
- Keep decorative imagery hidden from assistive technology.

## Next Steps

- Continue with [Phase 03](./phase-03-verification.md).
