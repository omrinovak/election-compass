import parties from '../data/parties.json';

export interface Answer {
  questionId: string;
  value: number;
  confidence: number;
  axes: string[];
  layer: string;
}

export interface CandidateExternalView {
  quote: string;
  speaker: string;
  source: string;
  date: string;
  url?: string;
}

export interface CandidateResult {
  position: number;
  name: string;
  score: number;
  declaredScore: number;
  actualScore: number;
  /** Whether declaredScore/actualScore reflect real evidence — false means "no data", not "0% match". */
  hasDeclaredData: boolean;
  hasActualData: boolean;
  axisScores: Record<string, { score: number; declared: number | null; actual: number | null; userValue: number; source?: string }>;
  unavailableAxes: { axis: string; reason: string }[];
  /** False once too few personal axes have real data — drives the "limited track record" transparency notice instead of a misleadingly precise score. */
  dataAvailable: boolean;
  /** Sourced quotes of named third parties assessing this candidate, one supportive and one critical — shown regardless of dataAvailable since these are attributed primary quotes, not a synthesized score. */
  externalViews?: { positive?: CandidateExternalView; negative?: CandidateExternalView };
}

export interface PartyResult {
  id: string;
  name: string;
  leader: string;
  color: string;
  seats: number;
  overallScore: number;
  declaredScore: number;
  actualScore: number;
  /** Weighted average of dataAvailable candidates' personal `score`, folded into overallScore. Null when no candidate on the list has enough personal data yet. */
  candidateScore: number | null;
  hasCandidateData: boolean;
  axisScores: Record<string, { score: number; partyDeclared: number; partyActual: number; userValue: number; confidence: string }>;
  includedAxes: string[];
  unavailableAxes: { axis: string; reason: string }[];
  gaps: { axis: string; description: string }[];
  reliability: Record<string, { score: number | null; confidence: number }>;
  /**
   * Personal evaluation of individual candidates on this party's list. Sorted by list position;
   * empty until candidate-level research exists for this party. Position 1 is normally the
   * list's PM candidate, but list order can and does change (mergers, splits) so don't assume
   * position 1 == `leader`. Candidates with real data feed into overallScore (see candidateScore)
   * so the party's headline score reflects the people on the list, not only the platform.
   */
  candidates: CandidateResult[];
}

const CONFIDENCE_THRESHOLD = 0.4;
// Below this many well-sourced axes, a candidate's personal profile is too thin to report as a real score.
const MIN_CANDIDATE_AXES = 4;
// Share of a party's overallScore driven by its platform (declared+actual) vs. its candidates'
// personal scores — only applied when at least one candidate has enough personal data.
const PARTY_PLATFORM_WEIGHT = 0.75;
const PARTY_CANDIDATE_WEIGHT = 1 - PARTY_PLATFORM_WEIGHT;
// Declared (interviews/quotes) vs. actual (personal Knesset votes) weighting, shared by both
// candidate- and party-level scoring so the ratio can't drift out of sync between the two.
const DECLARED_WEIGHT = 0.35;
const ACTUAL_WEIGHT = 1 - DECLARED_WEIGHT;
const AXIS_LABELS: Record<string, string> = {
  liberty_vs_security: 'חירות מול ביטחון',
  equality_vs_free_market: 'שוויון מול שוק חופשי',
  authority_vs_checks: 'סמכות מול איזונים',
  individual_vs_state: 'פרט מול מדינה',
  tradition_vs_liberalism: 'מסורת מול ליברליזם',
  security: 'ביטחון',
  economy: 'כלכלה',
  cost_of_living: 'יוקר מחיה',
  rule_of_law: 'מערכת המשפט',
  religion_state: 'דת ומדינה',
  education: 'חינוך',
  health: 'בריאות',
  welfare: 'רווחה',
  environment: 'סביבה',
  settlement: 'התיישבות',
  foreign_relations: 'יחסי חוץ',
  transport: 'תחבורה',
  housing: 'דיור',
  ideology_vs_pragmatism: 'אידאולוגיה מול פרגמטיות',
  stability_vs_opposition: 'יציבות מול אופוזיציה',
  experience_vs_renewal: 'ניסיון מול התחדשות',
};

export function getAxisLabel(axis: string): string {
  return AXIS_LABELS[axis] || axis;
}

export function getAxisProfile(answers: Answer[], priorities: string[]): Record<string, number> {
  return axisProfileFromUserProfile(buildUserProfile(answers, priorities));
}

function axisProfileFromUserProfile(profile: Record<string, { value: number; weight: number; count: number }>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const axis of Object.keys(profile)) {
    if (profile[axis].count > 0) result[axis] = Math.round(profile[axis].value * 10) / 10;
  }
  return result;
}

// Computes both the ranked party results and the caller's axis profile from a single
// buildUserProfile pass, since App.tsx always needs both from the same (answers, priorities).
export function calculateResultsAndProfile(
  answers: Answer[],
  priorities: string[]
): { results: PartyResult[]; axisProfile: Record<string, number> } {
  const userProfile = buildUserProfile(answers, priorities);
  return {
    results: calculateResultsFromProfile(userProfile),
    axisProfile: axisProfileFromUserProfile(userProfile),
  };
}

export function compareProfiles(
  a: Record<string, number>,
  b: Record<string, number>
): { compatibility: number; perAxis: Record<string, number>; sharedAxes: string[] } {
  const shared = Object.keys(a).filter((axis) => axis in b);
  const perAxis: Record<string, number> = {};
  let sum = 0;
  for (const axis of shared) {
    const sim = axisSimilarity(a[axis], b[axis]);
    perAxis[axis] = sim;
    sum += sim;
  }
  return {
    compatibility: shared.length > 0 ? sum / shared.length : 0,
    perAxis,
    sharedAxes: shared,
  };
}

function buildUserProfile(answers: Answer[], priorities: string[]): Record<string, { value: number; weight: number; count: number }> {
  const profile: Record<string, { value: number; weight: number; count: number }> = {};

  for (const answer of answers) {
    for (const axis of answer.axes) {
      if (!profile[axis]) {
        profile[axis] = { value: 0, weight: 0, count: 0 };
      }
      const w = answer.confidence;
      profile[axis].value += answer.value * w;
      profile[axis].weight += w;
      profile[axis].count += 1;
    }
  }

  for (const axis of Object.keys(profile)) {
    if (profile[axis].weight > 0) {
      profile[axis].value = profile[axis].value / profile[axis].weight;
    }
    if (priorities.includes(axis)) {
      profile[axis].weight *= 2;
    }
  }

  return profile;
}

function axisSimilarity(userVal: number, partyVal: number): number {
  const maxDist = 6;
  const dist = Math.abs(userVal - partyVal);
  return Math.max(0, 1 - dist / maxDist);
}

function computeMatch(
  userProfile: Record<string, { value: number; weight: number; count: number }>,
  positions: Record<string, number>,
  confidence: Record<string, number>,
  unavailableReason: string
): { score: number; axisScores: Record<string, number>; included: string[]; unavailable: { axis: string; reason: string }[] } {
  let weightedSum = 0;
  let totalWeight = 0;
  const axisScores: Record<string, number> = {};
  const included: string[] = [];
  const unavailable: { axis: string; reason: string }[] = [];

  for (const axis of Object.keys(userProfile)) {
    const val = positions[axis];
    const conf = confidence[axis];

    if (val === undefined || conf === undefined || conf < CONFIDENCE_THRESHOLD) {
      unavailable.push({
        axis,
        reason: conf !== undefined && conf < CONFIDENCE_THRESHOLD ? 'אין מספיק נתונים' : unavailableReason,
      });
      continue;
    }

    if (userProfile[axis].count === 0) continue;

    const sim = axisSimilarity(userProfile[axis].value, val);
    const w = userProfile[axis].weight;
    weightedSum += sim * w;
    totalWeight += w;
    axisScores[axis] = sim;
    included.push(axis);
  }

  return {
    score: totalWeight > 0 ? weightedSum / totalWeight : 0,
    axisScores,
    included,
    unavailable,
  };
}

function computeCandidateResult(
  userProfile: Record<string, { value: number; weight: number; count: number }>,
  candidate: {
    position: number;
    name: string;
    declared: Record<string, number>;
    actual: Record<string, number>;
    confidence: Record<string, number>;
    sources?: Record<string, string>;
    externalViews?: CandidateResult['externalViews'];
  }
): CandidateResult {
  // Defensive: candidate entries are hand-authored JSON (unlike the longer-established
  // party-level fields), so a future entry omitting declared/actual/confidence shouldn't
  // throw and take down every party's results, just score this candidate as "no data".
  const declaredPositions = candidate.declared ?? {};
  const actualPositions = candidate.actual ?? {};
  const confidence = candidate.confidence ?? {};

  const declared = computeMatch(userProfile, declaredPositions, confidence, 'לא נמצא מקור לעמדת המועמד בנושא זה');
  const actual = computeMatch(userProfile, actualPositions, confidence, 'אין הצבעה אישית רלוונטית');
  const allIncluded = [...new Set([...declared.included, ...actual.included])];
  const allUnavailable = declared.unavailable.filter((u) => actual.unavailable.some((a) => a.axis === u.axis));

  // Personal vote records aren't collected for most candidates yet, so an axis frequently has
  // ONLY a declared (interview/op-ed) score and no actual (voting-record) score at all. Blending
  // that as 65% weight on a missing data point would silently read as "0% match" and crush the
  // score — instead, an axis missing one side is scored 100% on whichever side is actually there.
  const axisScores: CandidateResult['axisScores'] = {};
  for (const axis of allIncluded) {
    const hasD = axis in declared.axisScores;
    const hasA = axis in actual.axisScores;
    const dScore = declared.axisScores[axis] ?? 0;
    const aScore = actual.axisScores[axis] ?? 0;
    const score = hasD && hasA ? dScore * DECLARED_WEIGHT + aScore * ACTUAL_WEIGHT : hasD ? dScore : aScore;
    axisScores[axis] = {
      score,
      declared: hasD ? declaredPositions[axis] : null,
      actual: hasA ? actualPositions[axis] : null,
      userValue: userProfile[axis]?.value ?? 0,
      source: candidate.sources?.[axis],
    };
  }

  const hasDeclaredData = declared.included.length > 0;
  const hasActualData = actual.included.length > 0;
  const overallScore =
    hasDeclaredData && hasActualData ? declared.score * DECLARED_WEIGHT + actual.score * ACTUAL_WEIGHT
    : hasDeclaredData ? declared.score
    : hasActualData ? actual.score
    : 0;

  // Whether this candidate "has enough data" must be a property of how much they've actually
  // been researched — not of how many of THIS user's answered axes happen to overlap with that
  // research. Using allIncluded.length here would mean the same well-researched candidate flips
  // between "no data" and "full score" depending on which unrelated questions a user skipped,
  // and would silently change whether they're folded into the party's overallScore at all.
  const researchedAxes = new Set<string>();
  for (const axis of Object.keys(declaredPositions)) {
    if ((confidence[axis] ?? 0) >= CONFIDENCE_THRESHOLD) researchedAxes.add(axis);
  }
  for (const axis of Object.keys(actualPositions)) {
    if ((confidence[axis] ?? 0) >= CONFIDENCE_THRESHOLD) researchedAxes.add(axis);
  }
  // Still require at least one axis that actually overlaps with this user's answers, so a
  // well-researched candidate never shows a hollow "0% match" when nothing overlapped.
  const dataAvailable = researchedAxes.size >= MIN_CANDIDATE_AXES && allIncluded.length > 0;

  return {
    position: candidate.position,
    name: candidate.name,
    score: overallScore,
    declaredScore: declared.score,
    actualScore: actual.score,
    hasDeclaredData,
    hasActualData,
    axisScores,
    unavailableAxes: allUnavailable,
    dataAvailable,
    externalViews: candidate.externalViews,
  };
}

// Weighted average of a party's candidates' personal scores, so a fuller list (not just the
// leader) can inform the party score once research exists for more than #1. Weight falls off
// with list position (1/position) since lower-list candidates have less influence on how the
// party actually governs. Candidates without enough personal data (dataAvailable === false)
// are excluded rather than counted as a low score, for the same reason a "no data" candidate
// score isn't shown as 0% in the UI.
function aggregateCandidateScore(candidates: CandidateResult[]): { score: number | null } {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of candidates) {
    if (!c.dataAvailable || c.position <= 0) continue;
    const w = 1 / c.position;
    weightedSum += c.score * w;
    totalWeight += w;
  }
  return { score: totalWeight > 0 ? weightedSum / totalWeight : null };
}

export function calculateResults(answers: Answer[], priorities: string[]): PartyResult[] {
  return calculateResultsFromProfile(buildUserProfile(answers, priorities));
}

function calculateResultsFromProfile(userProfile: Record<string, { value: number; weight: number; count: number }>): PartyResult[] {
  const results: PartyResult[] = parties.map((party) => {
    const declared = computeMatch(userProfile, party.declared, party.confidence, 'ציר לא רלוונטי למפלגה');
    const actual = computeMatch(userProfile, party.actual, party.confidence, 'ציר לא רלוונטי למפלגה');

    const allIncluded = [...new Set([...declared.included, ...actual.included])];
    const allUnavailable = declared.unavailable.filter(
      (u) => actual.unavailable.some((a) => a.axis === u.axis)
    );

    const platformScore = declared.score * DECLARED_WEIGHT + actual.score * ACTUAL_WEIGHT;

    const candidates = ((party.candidates ?? []) as Parameters<typeof computeCandidateResult>[1][])
      .map((c) => computeCandidateResult(userProfile, c))
      .sort((a, b) => a.position - b.position);
    const candidateAgg = aggregateCandidateScore(candidates);

    const overallScore =
      candidateAgg.score !== null
        ? platformScore * PARTY_PLATFORM_WEIGHT + candidateAgg.score * PARTY_CANDIDATE_WEIGHT
        : platformScore;

    const axisScores: PartyResult['axisScores'] = {};
    for (const axis of allIncluded) {
      const dScore = declared.axisScores[axis] ?? 0;
      const aScore = actual.axisScores[axis] ?? 0;
      const combined = dScore * DECLARED_WEIGHT + aScore * ACTUAL_WEIGHT;
      const partyConf = party.confidence[axis as keyof typeof party.confidence];
      let confLabel = 'available';
      if (partyConf < 0.75 && partyConf >= CONFIDENCE_THRESHOLD) confLabel = 'partial';

      axisScores[axis] = {
        score: combined,
        partyDeclared: party.declared[axis as keyof typeof party.declared] as number,
        partyActual: party.actual[axis as keyof typeof party.actual] as number,
        userValue: userProfile[axis]?.value ?? 0,
        confidence: confLabel,
      };
    }

    return {
      id: party.id,
      name: party.name,
      leader: party.leader,
      color: party.color,
      seats: party.seats,
      overallScore,
      declaredScore: declared.score,
      actualScore: actual.score,
      candidateScore: candidateAgg.score,
      hasCandidateData: candidateAgg.score !== null,
      axisScores,
      includedAxes: allIncluded,
      unavailableAxes: allUnavailable,
      gaps: party.gaps as PartyResult['gaps'],
      reliability: party.reliability as PartyResult['reliability'],
      candidates,
    };
  });

  results.sort((a, b) => b.overallScore - a.overallScore);
  return results;
}
