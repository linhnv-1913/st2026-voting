# Phase 02: Match Stage Styling

## Context Links

- [Plan overview](./plan.md)
- [Phase 01](./phase-01-structure.md)
- Reference screenshot: `C:\Users\nguyen.van.linhc\Downloads\ChatGPT Image Jul 31, 2026, 04_47_17 PM.png`
- `src/components/final-awards-leaderboard.css`
- `src/components/final-awards-leaderboard-responsive.css`

## Overview

- Priority: P1
- Status: Complete
- Goal: reproduce the reference hierarchy and stage proportions with maintainable CSS.

## Key Insights

- Desktop is one 16:9 composition, not a dashboard card grid.
- The torii/header owns the upper third; podiums align to one shared baseline.
- Artwork must preserve intrinsic aspect ratio; podium shells create height differences.

## Requirements

- Red-to-crimson layered backdrop with gold trim and restrained festival decorations.
- Large centered torii/header and title, clear below the viewport edge.
- Four panels in one row: second, first, third, fourth; first is highest and widest.
- Rank medals overlap panel tops; cream score plates sit inside each podium; ribbon anchors the bottom.
- Use existing semantic Hub artwork/colors; do not recolor or stretch raster images.

## Architecture

Base CSS owns stage tokens, 16:9 geometry, z-index layers, podium shells, medals, plates, and ribbon. Responsive CSS owns breakpoint-only overrides and must not duplicate base declarations.

## Related Code Files

- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.css`
- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard-responsive.css`
- Create/Delete: none

## Implementation Steps

1. Define local CSS custom properties for stage red, crimson, gold, cream, shadow, and fluid scale.
2. Constrain desktop with `aspect-ratio: 16 / 9`, viewport-aware max dimensions, and hidden decorative overflow only inside the stage.
3. Build background, torii/header, podium baseline, and ribbon as ordered layers.
4. Size panel geometry by rank/slot; keep tied ranks visually equivalent.
5. Use `object-fit`/`object-position` and explicit image boxes to preserve Hub image ratios.
6. Use `clamp()` for title, medals, scores, gaps, and inset spacing.
7. Keep both CSS files below 200 lines by removing obsolete rules before adding replacements.

## Todo List

- [x] Reference-size desktop composition matches the hierarchy.
- [x] First-place emphasis is unmistakable.
- [x] Score plates and footer ribbon remain legible.
- [x] No image distortion or positional color mapping.
- [x] Base and responsive rules stay DRY.

## Success Criteria

- At 1920×1080 and 1440×900, all four podiums remain on one baseline without page-level overflow.
- Reference elements appear in the same visual zones and prominence order.
- Text contrast meets WCAG AA on score plates and ribbons.

## Risk Assessment

- Risk: exact 16:9 scaling clips at shorter browser chrome heights. Mitigation: use viewport-aware width and height constraints.
- Risk: ornamental layers obscure data. Mitigation: keep decorations behind content and cap opacity.

## Security Considerations

- CSS-only phase; no data or authorization impact.
- Continue using local trusted assets; add no remote image dependencies.

## Next Steps

- Proceed to [Phase 03](./phase-03-verification.md) after desktop visual comparison.
