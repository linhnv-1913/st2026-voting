---
title: "Final Awards Pixel Layout"
description: "Recompose the final results view as a standalone 16:9 red-gold awards stage matching the supplied reference."
status: reverted
priority: P1
effort: 6h
branch: main
tags: [frontend, feature]
blockedBy: []
blocks: []
work_type: feature
spec_waived: "SDD mode disabled (takumi.sddMode: off)"
created: 2026-08-04
---

# Final Awards Pixel Layout

## Overview

Rebuild only the final-state composition on `/results`. Keep current ranking, dense-tie, scoring, Firebase, loading, access, and live-result behavior unchanged.

## Target Composition

- Standalone awards viewport; no live dashboard chrome in final state.
- Desktop stage targets 16:9 and mirrors the reference: red-gold backdrop, large torii/header, four podium panels, score plates, bottom ribbon.
- Standard visual order: second / first / third / fourth; first place is tallest and most prominent.
- Hub artwork comes from the image mapping already used by the awards component.
- Narrow screens retain the four-panel stage composition with no horizontal overflow.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Establish Final-State Structure](./phase-01-structure.md) | Complete |
| 2 | [Match Stage Styling](./phase-02-styling.md) | Complete |
| 3 | [Verify Responsive Fidelity](./phase-03-verification.md) | Complete |

## Dependencies

- Reference: `C:\Users\nguyen.van.linhc\Downloads\ChatGPT Image Jul 31, 2026, 04_47_17 PM.png`
- Existing `FinalAwardsLeaderboard` data contract and Hub image mapping.
- Existing dense ranking and awarded-points logic remain authoritative.

## Out of Scope

- Scoring, sorting, tie rules, Firebase reads, authentication, and poll lifecycle.
- New asset generation, new runtime dependencies, or redesign of live results.
- Copy changes unrelated to the final awards stage.

## Success Criteria

- Desktop 16:9 visually follows the supplied composition and hierarchy.
- Final state is independent from the live results layout.
- Four Hub panels remain legible; scores and rank labels come from existing data.
- 375px mobile and tablet widths do not clip or overflow.
- Lint, tests, build, reduced-motion, keyboard, and visual checks pass.

## Handoff

The standalone awards presentation was removed from `/results` at the user's request. The page now uses the previous chart, summary, final reveal, and QR layout.
