---
title: "Final Awards Key Visual Redesign"
description: "Restyle the four-team final awards leaderboard around the existing blue C3 Matsuri key visual while preserving data and readability."
status: completed
priority: P1
effort: 5h
branch: main
tags: [feature, frontend]
blockedBy: []
blocks: []
work_type: feature
spec_waived: "SDD mode disabled (takumi.sddMode: off)"
created: 2026-08-04
---

# Final Awards Key Visual Redesign

## Overview

Replace the current red curtain stage with the initial C3 Matsuri visual language: bright blue radial sky, red torii, lanterns, fireworks, clouds, and cream/red/blue waves. Keep the current four-team awards data, dense ranks, scores, semantics, and reveal behavior unchanged.

## Design Direction

- Reuse `/matsuri-key-visual.jpg` (2048×1024) and `/matsuri-key-visual-mobile.jpg` (960×480); do not copy the 17 MB source PNG into runtime assets.
- Treat the key visual as a decorative masthead/backdrop, with a blue-to-navy foreground veil behind podium content.
- Avoid duplicate branding by replacing the visible HTML title with a compact final-awards label while retaining one semantic `<h1>`.
- Preserve desktop podium order and rank hierarchy; switch to readable cards on narrow screens.
- Keep Hub artwork, medal values, score formatting, and existing motion behavior.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Integrate Key Visual Backdrop](./phase-01-key-visual-backdrop.md) | Complete |
| 2 | [Rebalance Leaderboard Responsively](./phase-02-responsive-leaderboard.md) | Complete |
| 3 | [Verify Fidelity and Regressions](./phase-03-verification.md) | Complete |

## Dependencies

- Reference: `C:\Users\nguyen.van.linhc\Downloads\key-visual.png`
- Existing optimized key-visual and Hub assets under `public/`.
- Existing `FinalLeaderboardEntry` and `HUB_DEFINITIONS` contracts.

## Out of Scope

- Ranking, scoring, tie handling, Firebase, auth, routing, and vote lifecycle.
- New illustration generation, new dependencies, or Hub artwork changes.
- Redesign of live results or admin pages.

## Success Criteria

- Final awards visibly belongs to the supplied blue C3 Matsuri key visual.
- Four teams remain readable at 1440px, 1024px, 768px, 375px, and 320px.
- No duplicated torii/lantern/firework layers or horizontal page overflow.
- WCAG AA score text, meaningful reading order, and reduced-motion behavior hold.
- Tests, lint, build, and `git diff --check` pass.

## Handoff

Run `/tkm:takumi --auto C:\Users\nguyen.van.linhc\Documents\linhnv\st2026-voting\plans\20260804-1744-final-awards-key-visual\plan.md`.
