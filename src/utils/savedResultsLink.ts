import { toBase64Url, fromBase64Url } from './compareLink';
import type { WeightedUserProfile } from './matching';
import { AXIS_LABELS } from './matching';

interface SavedResultsPayload {
  v: 1;
  p: Record<string, [value: number, weight: number]>;
  pr: string[]; // priorities
}

// Encodes the exact per-axis {value, weight} pair calculateResultsFromProfile needs — not just
// the rounded display value axisProfile carries — so reopening this link reproduces the same
// party ranking (including priority-doubled axes) instead of silently re-weighting every axis
// equally, which could change the top match the user originally saw.
export function encodeSavedResults(profile: WeightedUserProfile, priorities: string[]): string {
  const p: Record<string, [number, number]> = {};
  for (const axis of Object.keys(profile)) {
    if (profile[axis].count > 0) {
      // 4 decimals (not 2) keeps the rounding error far below what could ever flip a party
      // ranking through axisSimilarity's /6 distance — `value` isn't always a terminating
      // decimal (it's a confidence-weighted average), so some rounding is unavoidable, but at
      // 4 places the residual is orders of magnitude smaller than any realistic score gap.
      p[axis] = [Math.round(profile[axis].value * 10000) / 10000, Math.round(profile[axis].weight * 10000) / 10000];
    }
  }
  const payload: SavedResultsPayload = { v: 1, p, pr: priorities };
  return toBase64Url(btoa(encodeURIComponent(JSON.stringify(payload))));
}

function isValidPayload(parsed: unknown): parsed is SavedResultsPayload {
  if (!parsed || typeof parsed !== 'object') return false;
  const o = parsed as Record<string, unknown>;
  if (o.v !== 1 || !o.p || typeof o.p !== 'object') return false;
  if (!Array.isArray(o.pr) || !o.pr.every((x) => typeof x === 'string')) return false;
  const entries = Object.entries(o.p as Record<string, unknown>);
  return entries.every(
    // Axis keys must come from matching.ts's AXIS_LABELS (the canonical axis-key source — see
    // CLAUDE.md) rather than being trusted as-is, so a corrupted/hand-edited link with a typo'd
    // or made-up axis key is rejected outright instead of silently decoding into a profile that
    // every party then quietly ignores as "not relevant."
    ([axis, v]) =>
      axis in AXIS_LABELS &&
      Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

export function decodeSavedResults(raw: string): { profile: WeightedUserProfile; priorities: string[] } | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(fromBase64Url(raw))));
    if (!isValidPayload(parsed)) return null;
    const profile: WeightedUserProfile = {};
    for (const [axis, pair] of Object.entries(parsed.p)) {
      const [value, weight] = pair as [number, number];
      // `count` only ever gates "does this axis have data" downstream (never read as a real
      // tally) — see axisProfileFromUserProfile/computeMatch in matching.ts — so 1 is a safe
      // sentinel here. Don't repurpose this field for anything that needs a genuine answer count.
      profile[axis] = { value, weight, count: 1 };
    }
    return { profile, priorities: parsed.pr };
  } catch {
    return null;
  }
}
