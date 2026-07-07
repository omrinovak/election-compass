/**
 * Calculates party `actual` scores from anchor-votes.json.
 *
 * Each anchor vote has:
 *  - axes: which political axes it signals, and toward which pole (min=1, max=7)
 *  - factions: each party's position (for / against / abstain / absent)
 *  - weight: signal strength (default 1.0, major votes 2.0)
 *
 * Scoring per vote:
 *  - "for"  + pole "max" → 6.5  (aligns toward 7)
 *  - "for"  + pole "min" → 1.5  (aligns toward 1)
 *  - "against" + pole "max" → 1.5
 *  - "against" + pole "min" → 6.5
 *  - "abstain" → 4.0 (neutral, lower weight × 0.5)
 *  - "absent" → ignored
 *
 * Final blending per axis:
 *  - ≥3 covering votes: 65% anchor + 35% declared
 *  - 1–2 covering votes: 40% anchor + 60% declared
 *  - 0 covering votes: keep existing actual unchanged
 */

export interface AnchorVoteAxis {
  axis: string;
  pole: 'min' | 'max';
}

export interface AnchorVote {
  id: string;
  knesset: number;
  date: string;
  title: string;
  description: string;
  source: string;
  weight: number;
  axes: AnchorVoteAxis[];
  factions: Record<string, 'for' | 'against' | 'abstain' | 'absent'>;
}

type SignalValue = number | null;

function signalScore(
  position: 'for' | 'against' | 'abstain' | 'absent',
  pole: 'min' | 'max'
): { score: SignalValue; weightMult: number } {
  if (position === 'absent') return { score: null, weightMult: 0 };
  if (position === 'abstain') return { score: 4.0, weightMult: 0.5 };
  const isFor = position === 'for';
  const isMax = pole === 'max';
  const score = (isFor === isMax) ? 6.5 : 1.5;
  return { score, weightMult: 1.0 };
}

export function calcAxisScore(
  partyId: string,
  axis: string,
  votes: AnchorVote[]
): { score: number | null; coveringVotes: number } {
  const relevant = votes.filter(v => v.axes.some(a => a.axis === axis));

  let weightedSum = 0;
  let totalWeight = 0;
  let coveringVotes = 0;

  for (const vote of relevant) {
    const position = vote.factions[partyId];
    if (!position) continue;

    const axisEntry = vote.axes.find(a => a.axis === axis)!;
    const { score, weightMult } = signalScore(position, axisEntry.pole);
    if (score === null) continue;

    const effectiveWeight = vote.weight * weightMult;
    weightedSum += score * effectiveWeight;
    totalWeight += effectiveWeight;
    if (position !== 'absent') coveringVotes++;
  }

  if (totalWeight === 0) return { score: null, coveringVotes: 0 };

  const rawScore = weightedSum / totalWeight;
  const clamped = Math.max(1, Math.min(7, rawScore));
  return {
    score: Math.round(clamped * 10) / 10,
    coveringVotes,
  };
}

export function blendScore(
  anchorScore: number,
  declaredScore: number,
  coveringVotes: number
): number {
  const anchorWeight = coveringVotes >= 3 ? 0.65 : 0.40;
  const declaredWeight = 1 - anchorWeight;
  const blended = anchorScore * anchorWeight + declaredScore * declaredWeight;
  return Math.round(Math.max(1, Math.min(7, blended)) * 10) / 10;
}
