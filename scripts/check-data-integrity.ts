/**
 * Checks that hardcoded party-id and axis-key references across the codebase stay in sync with
 * the two canonical sources: src/data/parties.json (party ids) and src/utils/matching.ts's
 * AXIS_LABELS export (axis keys).
 *
 * Why this exists: a 2026-09 audit found the same bug five separate times — a file hand-copied
 * a list of party ids or axis keys instead of importing/deriving them, and the copy silently
 * drifted (Admin.tsx had an invented 23-key axis schema that never matched reality; Results.tsx's
 * PARTY_EMOJI was missing a live party; About.tsx's prose referenced a disbanded party and an
 * unverifiable vote count; scripts/sync-parties.js's skip-list was missing a live party;
 * scripts/update-actual-scores.mjs hand-copied the axis list a second time). None of these broke
 * `npm run build` or `npm run lint`. This script is the structural fix: it runs in CI
 * (.github/workflows/ci.yml) and locally via `npm run check` on every push/PR, so the next
 * instance of this pattern fails loudly instead of waiting for a manual audit.
 *
 * See .claude/agents/data-integrity-guardian.md for the full postmortem and for how to extend
 * this script when a new instance of the pattern is found.
 *
 * Usage: npx tsx scripts/check-data-integrity.ts
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AXIS_LABELS } from '../src/utils/matching.ts';
import partiesData from '../src/data/parties.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failures = 0;
function fail(msg: string): void {
  console.error(`✗ ${msg}`);
  failures++;
}
function ok(msg: string): void {
  console.log(`✓ ${msg}`);
}

const partyIds = new Set((partiesData as { id: string }[]).map((p) => p.id));
const axisKeys = new Set(Object.keys(AXIS_LABELS));

// --- 1. Every party's (and every candidate's) declared/actual/confidence keys are real axes ---
// This is the check that would have caught Admin.tsx's invented axis schema immediately, had it
// been checking party-level data directly instead of a copy of the axis list.
{
  let checked = 0;
  for (const party of partiesData as any[]) {
    for (const field of ['declared', 'actual', 'confidence']) {
      for (const key of Object.keys(party[field] ?? {})) {
        checked++;
        if (!axisKeys.has(key)) {
          fail(`parties.json: "${party.id}".${field} has unknown axis key "${key}" (not in matching.ts's AXIS_LABELS)`);
        }
      }
    }
    for (const candidate of party.candidates ?? []) {
      for (const field of ['declared', 'actual', 'confidence']) {
        for (const key of Object.keys(candidate[field] ?? {})) {
          checked++;
          if (!axisKeys.has(key)) {
            fail(`parties.json: "${party.id}" candidate #${candidate.position} (${candidate.name}).${field} has unknown axis key "${key}"`);
          }
        }
      }
    }
  }
  if (failures === 0) ok(`all ${checked} axis-key references in parties.json (parties + candidates) match AXIS_LABELS`);
}

// --- 2. scripts/sync-parties.js's preElectionParties skip-list only names real party ids ---
// Catches a typo immediately; does NOT catch a live party missing from the list (that needs the
// live Knesset API, which this script deliberately doesn't call) — the agent handles that half.
{
  const src = readFileSync(join(root, 'scripts/sync-parties.js'), 'utf8');
  const match = src.match(/preElectionParties\s*=\s*\[([^\]]*)\]/);
  if (!match) {
    fail('scripts/sync-parties.js: could not find preElectionParties list — did its shape change? Update this check.');
  } else {
    const ids = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const bad = ids.filter((id) => !partyIds.has(id));
    if (bad.length > 0) {
      fail(`scripts/sync-parties.js's preElectionParties lists unknown id(s): ${bad.join(', ')}`);
    } else {
      ok(`scripts/sync-parties.js's preElectionParties (${ids.length} entries) are all real party ids`);
    }
  }
}

// --- 3. Results.tsx's PARTY_EMOJI covers every current party, with no stale entries ---
{
  const src = readFileSync(join(root, 'src/components/Results.tsx'), 'utf8');
  const match = src.match(/const PARTY_EMOJI:[^{]*\{([^}]*)\}/s);
  if (!match) {
    fail('src/components/Results.tsx: could not find PARTY_EMOJI — did its shape change? Update this check.');
  } else {
    const mapped = [...match[1].matchAll(/(\w+):\s*'/g)].map((m) => m[1]);
    const stale = mapped.filter((id) => !partyIds.has(id));
    const missing = [...partyIds].filter((id) => !mapped.includes(id));
    for (const id of stale) fail(`Results.tsx's PARTY_EMOJI has a stale entry for "${id}" (no longer in parties.json)`);
    for (const id of missing) fail(`Results.tsx's PARTY_EMOJI is missing an entry for current party "${id}" (falls back to the generic ⚪)`);
    if (stale.length === 0 && missing.length === 0) ok(`Results.tsx's PARTY_EMOJI covers exactly the current ${partyIds.size} parties`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} data-integrity check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll data-integrity checks passed.');
}
