# מצפן הבחירות — working notes for Claude Code

## Canonical data sources — don't hand-copy these

- **Axis keys** (the 21 political axes): `src/utils/matching.ts`'s exported `AXIS_LABELS`. Import
  it; never re-type the key list elsewhere.
- **Party ids**: `src/data/parties.json`. Read ids off it at runtime/build time where possible
  instead of maintaining a separate hardcoded list.

If you're about to write a `Record<string, ...>` literal keyed by an axis name or a party id,
stop and check whether it should import `AXIS_LABELS` or read `parties.json` instead. This
codebase had five separate bugs from exactly that shortcut — see
[.claude/agents/data-integrity-guardian.md](.claude/agents/data-integrity-guardian.md) for the
full postmortem.

## After any change to parties.json's party list

Adding, removing, renaming, or merging a party (disbanded lists, new entrants, threshold
crossings) is the single most common trigger for stale-reference bugs in this repo. Invoke the
**data-integrity-guardian** agent, or at minimum run:

```bash
npm run check
```

and grep the repo for the affected party's id/name to catch any prose in `About.tsx` or similar
that still needs updating (the check script only covers structured data, not Hebrew copy).

## Before considering any change done

```bash
npm run lint
npm run build
npm run check
```

All three run in CI (`.github/workflows/ci.yml`) on every push/PR — but don't wait for CI to find
out, since none of the bugs this project has had actually failed `build` or `lint` on their own.

## Project shape

- Vite + React 19 + TypeScript SPA, no router — `src/App.tsx` switches screens by local state,
  not URL. Two URL params are in use: `?cmp=` for the "compare with friend" feature
  (`src/utils/compareLink.ts`) and `?saved=` for the "email me my results" restore-on-open link
  (`src/utils/savedResultsLink.ts`), which reopens straight into the results screen from a
  reconstructed per-axis profile instead of re-running the questionnaire.
- Scoring logic lives entirely in `src/utils/matching.ts`. Party-level and candidate-level scoring
  share the `blendDeclaredActual` helper — don't reimplement the declared/actual blend inline
  elsewhere, that's exactly how it drifted apart before.
- `src/data/parties.json` is hand-authored/edited (via `src/components/Admin.tsx`'s export flow,
  or directly). `src/data/anchor-votes.json` feeds `scripts/update-actual-scores.mjs`, which
  computes and writes each party's `actual` axis scores — it's the only thing that should write to
  `parties.json`'s `actual` block.
- The site deploys via Vercel's own git integration (not `.github/workflows/deploy.yml.disabled`,
  which is a leftover GitHub Pages workflow — leave it disabled unless you're deliberately
  switching hosting).
