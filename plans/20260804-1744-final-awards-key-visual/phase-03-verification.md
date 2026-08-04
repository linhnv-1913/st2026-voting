# Phase 03: Verify Fidelity and Regressions

## Context Links

- [Plan overview](./plan.md)
- [Phase 01](./phase-01-key-visual-backdrop.md)
- [Phase 02](./phase-02-responsive-leaderboard.md)
- Reference: `C:\Users\nguyen.van.linhc\Downloads\key-visual.png`

## Overview

- Priority: P1
- Status: Pending
- Goal: verify key-visual fidelity, leaderboard readability, accessibility, and unchanged scoring behavior.

## Key Insights

- Visual comparison must cover both masthead identity and data contrast.
- The two source images are 2:1; portrait behavior must be verified separately from desktop fidelity.
- Automated checks do not detect motif duplication, artwork cropping, or weak score contrast.

## Requirements

- Validate desktop, tablet, phone portrait, and short landscape viewports.
- Exercise normal ranks, dense ties, unranked/all-zero, loading, and error states.
- Confirm reduced motion removes entrance animation without flattening static rank offsets.
- Confirm heading/ordered-list semantics and announcements remain understandable.

## Architecture

Verification combines current unit/lint/build gates with browser screenshots and accessibility inspection. No test expectations may be weakened to accommodate the redesign.

## Related Code Files

- Verify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.tsx`
- Verify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard.css`
- Verify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-decorations.css`
- Verify: `C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\src\components\final-awards-leaderboard-responsive.css`

## Implementation Steps

1. Capture 1440×900, 1024×768, 768×1024, 375×812, 320×568, and short-landscape screenshots.
2. Compare sky, torii, lantern, firework, and wave placement against the supplied key visual.
3. Check all score plates for at least 4.5:1 normal-text contrast and readable thousands separators.
4. Test zoom, screen-reader order, reduced motion, and absence of horizontal overflow.
5. Confirm dense ties/unranked entries remain truthful and no scoring code changed.
6. Run `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.

## Todo List

- [ ] Key-visual comparison accepted.
- [ ] Desktop/tablet/mobile screenshots remain readable.
- [ ] Tie, unranked, loading, and error states pass.
- [ ] Accessibility and reduced-motion checks pass.
- [ ] Tests, lint, build, and diff check pass.

## Success Criteria

- Final awards matches the supplied visual language without hiding leaderboard data.
- No runtime asset duplication or unnecessary new dependency.
- Scoring/data behavior is unchanged and existing tests remain green.

## Risk Assessment

- Risk: visual acceptance is subjective. Mitigation: compare named motifs, crop boundaries, contrast, and viewport screenshots explicitly.
- Risk: regression appears only on small-height devices. Mitigation: include landscape and 320×568 checks.

## Security Considerations

- Confirm no individual vote/user data is newly rendered.
- Keep existing route authorization and finalization guards unchanged.

## Next Steps

- Send the completed implementation through tester and reviewer; record docs impact at handoff.
