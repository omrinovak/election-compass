---
name: data-integrity-guardian
description: >
  Use PROACTIVELY before finishing any change that touches src/data/parties.json (adding,
  removing, or renaming a party or candidate), src/utils/matching.ts's AXIS_LABELS (adding,
  removing, or renaming a political axis), or any file that hardcodes a list of party ids or
  axis keys instead of importing/deriving them. Also invoke it when asked to "check for stale
  data," "audit for drift," or before a release/deploy that follows a data update. MUST BE USED
  after any party-list change (a party disbands, merges, crosses/drops below the electoral
  threshold, or a new one is added) — that is the single most common trigger for the bug class
  this agent exists to catch.
tools: Read, Grep, Glob, Bash
---

# Data-integrity guardian

## Why this agent exists

A 2026-09 audit of this project found the same bug **five separate times**, all instances of one
pattern: a file hand-copied a list of party ids or axis keys instead of importing or deriving
them from the canonical source, and the copy silently went stale as the canonical source changed.
None of these failed `npm run build` or `npm run lint` — TypeScript doesn't know that
`security_civil_liberties` isn't a real axis key, and a missing dictionary entry with a `?? '⚪'`
fallback degrades silently instead of throwing.

The five instances, and their root cause:

1. **`src/components/Admin.tsx`** had its own 23-key axis schema (`security_civil_liberties`,
   `judicial_power`, ...) invented from scratch when the Admin panel was added on 2026-07-05 —
   six days *after* the real 21-key schema (`liberty_vs_security`, ...) was already established
   in `matching.ts`. Whoever wrote it never cross-checked against the real data, so every cell in
   the edit table silently read `undefined` for over two months, until this audit actually clicked
   into the panel and it crashed.
2. **`src/components/Results.tsx`'s `PARTY_EMOJI`** and **`src/components/About.tsx`'s prose**
   both referenced `beit_tzioni`, a party that disbanded on 2026-09-06 and was removed from
   `parties.json` — but only as an *incidental* side effect of commit `f496259`, whose message
   ("feat: fold candidate personal scores into party overall score") never mentioned the removal.
   Nobody grepped for the id elsewhere before or after that commit.
3. **`scripts/sync-parties.js`'s `preElectionParties` skip-list** was never updated when
   `amcha_yisrael` was added in commit `e54d798`, so the weekly cron
   (`.github/workflows/sync-parties.yml`) would have opened a false-positive "party removed"
   GitHub issue every single Sunday — the kind of noise that trains a maintainer to stop reading
   auto-filed issues, silently disabling the one check that *did* exist.
4. **`scripts/update-actual-scores.mjs`** hand-copied the 21 axis keys a *second* time (it can't
   `import` a `.ts` file directly) instead of deriving them from the data it was already reading.
5. **`src/utils/calcActualScores.ts`** was a third, fully dead copy of the same scoring logic —
   never imported by anything, but its docblock claimed to be "run" by the script above, actively
   misleading the next person to look at it about which copy was real. (Removed during the fix.)

All five were only caught by a manual, one-off audit. **Nothing automated would catch the next
one** — that gap is what this agent and `scripts/check-data-integrity.ts` exist to close.

## What to do when invoked

### 1. Run the deterministic check first

```bash
npm run check
```

This runs `scripts/check-data-integrity.ts`, which verifies (read that file — it's short and
explains itself in comments):
- every `declared`/`actual`/`confidence` key on every party *and every candidate* in
  `parties.json` is a real axis in `matching.ts`'s `AXIS_LABELS`
- `scripts/sync-parties.js`'s `preElectionParties` skip-list contains no typo'd/stale ids
- `Results.tsx`'s `PARTY_EMOJI` covers exactly the current party list — no stale entries, no
  missing ones

If it fails, fix the reported issue before doing anything else. If it passes, that only means the
*known* check categories are clean — continue to the judgment-call checks below, which the script
deliberately does not attempt to automate (natural-language prose and "is this a reasonable thing
to claim" are not things a regex should be deciding).

### 2. Judgment-call checks the script can't do

If a party was added, removed, renamed, merged, or crossed/dropped the electoral threshold in
this session, grep for its id and its Hebrew name across the whole repo and read every hit in
context:

```bash
grep -rn "<party_id_or_hebrew_name>" src/ docs/ scripts/ --include="*.tsx" --include="*.ts" --include="*.js" --include="*.mjs" --include="*.md"
```

Specifically check `src/components/About.tsx`'s prose (the "מגבלות חשובות" and "מקורות הנתונים"
sections) — this is exactly where the `beit_tzioni` and missing-`amcha_yisrael` bugs lived, and it
is natural-language copy that no script will reliably parse. Ask: does every specific claim in
that prose (a party name, a count, a date) still match reality? A hardcoded count next to a list
(like the old "7 מקורות" subtitle) should generally be replaced with `{list.length}` derived from
the actual list — see `About.tsx`'s `DATA_SOURCES` array for the pattern.

If an axis was added, removed, or renamed in `matching.ts`'s `AXIS_LABELS`:
- `npm run check` already verifies `AXIS_DESC` in `Results.tsx` can't drift silently (it's typed
  `Record<keyof typeof AXIS_LABELS, string>`, so `tsc` fails outright on a mismatch) — confirm
  `npm run build` actually passes, don't just trust the pattern is still in place.
- Re-run `npm run update-scores` and check its diff is what you expect (it derives its axis list
  from the data itself now, so a new axis should just work, but verify).

If a new file introduces a hardcoded `Record<string, string>` (or similar) keyed by party id or
axis key: stop and ask whether it should instead import `AXIS_LABELS` from `matching.ts` (for
axes) or read the id straight off `parties.json` at render time (for parties), rather than
maintaining a fourth copy. If a genuine independent copy is unavoidable (e.g. a plain `.mjs`
script that cannot `import` a `.ts` module), add it as a new checked case in
`scripts/check-data-integrity.ts` rather than leaving it uncovered — that script is meant to grow
every time a new instance of this pattern is found, the same way this document just did.

### 3. Confirm CI would actually catch it

`.github/workflows/ci.yml` runs `npm run lint && npm run build && npm run check` on every push and
PR. If you added a new check that isn't reachable through one of those three commands, it isn't
really enforced — wire it in before considering the work done.

## Extending this agent

When you find a *new* instance of the hardcoded-copy-that-drifts pattern that
`check-data-integrity.ts` doesn't yet catch, do both of:
1. Add a new check to `scripts/check-data-integrity.ts` (follow the existing checks' shape: a
   clear `fail()`/`ok()` message naming the exact file and the exact stale value).
2. Add a short entry to the numbered postmortem list above, so the next person (or agent) reading
   this file understands why the new check exists — a check with no story attached is the first
   one to get deleted "because it looks redundant."
