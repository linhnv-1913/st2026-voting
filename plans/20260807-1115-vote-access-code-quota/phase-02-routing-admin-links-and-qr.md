# Phase 02 — routing, admin links, and QR

## Scope

- Keep static routes protected and add the one-segment `/:accessCode` route.
- Show link validity, used/max quota, and vote-full feedback to voters.
- Let admins seed and inspect all 16 links, reset counters, and copy base-aware URLs.
- Replace the old single generic QR with the 16 token-specific QR codes.

## Files

- `src/App.tsx`
- `src/components/UserVote.tsx`
- `src/components/AdminPanel.tsx`
- `src/components/results-qr-dialog.tsx`
- `src/components/results-qr-dialog.css`

## Success criteria

`/admin`, `/results`, `/final-awards`, and `/score` remain static routes;
`/<valid-code>` loads the vote surface; unknown codes show an invalid-link state.
