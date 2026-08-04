# Phase 01: Integrate Key Visual Backdrop

## Context Links

- [Plan overview](./plan.md)
- `C:\Users\nguyen.van.linhc\Downloads\key-visual.png`
- `public/matsuri-key-visual.jpg`
- `public/matsuri-key-visual-mobile.jpg`
- `src/index.css` key-visual usage patterns

## Overview

- Priority: P1
- Status: Pending
- Goal: make the optimized key visual the single decorative source for the final awards stage.

## Key Insights

- The supplied PNG and existing desktop JPEG share the same 2:1 composition.
- Current CSS reconstructs torii, lanterns, fireworks, curtains, and waves over a red background; retaining both systems would duplicate motifs.
- `src/index.css` already establishes desktop/mobile asset switching and veil patterns worth reusing.

## Requirements

- Preserve one semantic page heading and all existing status/error announcements.
- Use existing optimized assets through `import.meta.env.BASE_URL` or the project’s established public-asset path pattern.
- Preserve the full-width key visual on desktop; avoid cropping the `Sun*` mark and outer lanterns where practical.
- Fade the lower artwork into a stable blue/navy surface before leaderboard text begins.

## Architecture

`FinalAwardsLeaderboard` keeps data rendering. A single decorative backdrop layer owns the key visual; a separate pseudo-element veil controls foreground contrast. CSS-generated duplicate festival objects are removed.

## Related Code Files

- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.tsx`
- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-decorations.css`
- Modify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.css`
- Create/Delete: none

## Implementation Steps

1. Replace the multi-node ornament block with one decorative backdrop hook, or move it entirely to section pseudo-elements.
2. Apply desktop key visual at `center top / 100% auto no-repeat` over a matching blue base.
3. Add a transparent-to-navy vertical veil that protects podium, medal, and score contrast without obscuring the masthead.
4. Prevent visible duplicate `C3 MATSURI` branding; keep the `<h1>` accessible and use only a compact awards label if needed.
5. Remove obsolete curtain/torii/lantern/firework/cloud declarations rather than layering new rules over them.
6. Keep TSX and each CSS file below 200 lines.

## Todo List

- [ ] One key-visual decoration source remains.
- [ ] Existing optimized assets are reused.
- [ ] Lower veil protects leaderboard readability.
- [ ] Semantic heading and announcements remain intact.

## Success Criteria

- Blue radial sky, red torii, matsuri lanterns, and wave motifs read immediately.
- No duplicate festival decorations or branding.
- Background preserves aspect ratio and causes no layout shift.

## Risk Assessment

- Risk: full-width artwork competes with scores. Mitigation: isolate its strongest details above the podium and tune the lower veil.
- Risk: CSS split becomes duplicative. Mitigation: decorations file owns imagery; base file owns leaderboard layout.

## Security Considerations

- Use local public assets only; add no remote image requests.
- Do not change data exposure or authorization behavior.

## Next Steps

- Continue with [Phase 02](./phase-02-responsive-leaderboard.md).
