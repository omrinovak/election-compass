/**
 * Computes each party's `actual` axis scores from anchor-votes.json and rewrites
 * the `actual` block in parties.json. This is the canonical, live implementation —
 * there is no separate calcActualScores module; an earlier .ts file by that name
 * duplicated this logic but was never actually run by anything and has been removed.
 *
 * Usage: node scripts/update-actual-scores.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const parties = JSON.parse(readFileSync(join(root, 'src/data/parties.json'), 'utf8'));
const votes   = JSON.parse(readFileSync(join(root, 'src/data/anchor-votes.json'), 'utf8'));

// Derived from the data itself rather than hand-copied from matching.ts's AXIS_LABELS (a plain
// .mjs script can't import that .ts module directly) — this way a new axis added to any party's
// `declared` object is picked up automatically instead of silently skipped until someone
// remembers to update a second, separate list. See .claude/agents/data-integrity-guardian.md.
const AXES = [...new Set(parties.flatMap(p => Object.keys(p.declared ?? {})))];

const VALID_POSITIONS = new Set(['for', 'against', 'abstain', 'absent']);

function signalScore(position, pole) {
  if (!VALID_POSITIONS.has(position)) {
    throw new Error(`Unrecognized faction position "${position}" in anchor-votes.json (expected one of: ${[...VALID_POSITIONS].join(', ')})`);
  }
  if (position === 'absent') return null;
  if (position === 'abstain') return { score: 4.0, wMult: 0.5 };
  const isFor = position === 'for';
  const isMax = pole === 'max';
  return { score: (isFor === isMax) ? 6.5 : 1.5, wMult: 1.0 };
}

function calcAxisScore(partyId, axis, votes) {
  const relevant = votes.filter(v => v.axes.some(a => a.axis === axis));
  let wSum = 0, wTotal = 0, covering = 0;

  for (const vote of relevant) {
    const pos = vote.factions[partyId];
    if (!pos) continue;
    const axisEntry = vote.axes.find(a => a.axis === axis);
    const sig = signalScore(pos, axisEntry.pole);
    if (!sig) continue;
    const ew = vote.weight * sig.wMult;
    wSum   += sig.score * ew;
    wTotal += ew;
    covering++;
  }

  if (wTotal === 0) return null;
  return { score: Math.round(Math.max(1, Math.min(7, wSum / wTotal)) * 10) / 10, covering };
}

function blend(anchor, declared, covering) {
  const aw = covering >= 3 ? 0.65 : 0.40;
  return Math.round(Math.max(1, Math.min(7, anchor * aw + declared * (1 - aw))) * 10) / 10;
}

let changed = 0;

for (const party of parties) {
  const updates = {};
  for (const axis of AXES) {
    const result = calcAxisScore(party.id, axis, votes);
    if (!result) continue;                    // no data → keep existing actual
    const newVal = blend(result.score, party.declared[axis] ?? 4, result.covering);
    const oldVal = party.actual[axis];
    if (newVal !== oldVal) {
      updates[axis] = { old: oldVal, new: newVal, covering: result.covering };
      party.actual[axis] = newVal;
      changed++;
    }
  }
  if (Object.keys(updates).length) {
    console.log(`\n${party.name} (${party.id}):`);
    for (const [axis, { old: o, new: n, covering: c }] of Object.entries(updates)) {
      console.log(`  ${axis}: ${o} → ${n}  (${c} votes)`);
    }
  }
}

writeFileSync(join(root, 'src/data/parties.json'), JSON.stringify(parties, null, 2), 'utf8');
console.log(`\n✓ Updated ${changed} axis values across ${parties.length} parties.`);
