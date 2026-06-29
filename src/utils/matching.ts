import parties from '../data/parties.json';

export interface Answer {
  questionId: string;
  value: number;
  confidence: number;
  axes: string[];
  layer: string;
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
  axisScores: Record<string, { score: number; partyDeclared: number; partyActual: number; userValue: number; confidence: string }>;
  includedAxes: string[];
  unavailableAxes: { axis: string; reason: string }[];
  gaps: { axis: string; description: string }[];
  reliability: Record<string, { score: number | null; confidence: number }>;
}

const CONFIDENCE_THRESHOLD = 0.4;
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
  party: typeof parties[0],
  mode: 'declared' | 'actual'
): { score: number; axisScores: Record<string, number>; included: string[]; unavailable: { axis: string; reason: string }[] } {
  const partyPositions = mode === 'declared' ? party.declared : party.actual;
  const partyConfidence = party.confidence;
  let weightedSum = 0;
  let totalWeight = 0;
  const axisScores: Record<string, number> = {};
  const included: string[] = [];
  const unavailable: { axis: string; reason: string }[] = [];

  for (const axis of Object.keys(userProfile)) {
    const partyVal = partyPositions[axis as keyof typeof partyPositions];
    const partyConf = partyConfidence[axis as keyof typeof partyConfidence];

    if (partyVal === undefined || partyConf === undefined || partyConf < CONFIDENCE_THRESHOLD) {
      unavailable.push({
        axis,
        reason: partyConf !== undefined && partyConf < CONFIDENCE_THRESHOLD
          ? 'אין מספיק נתונים'
          : 'ציר לא רלוונטי למפלגה',
      });
      continue;
    }

    if (userProfile[axis].count === 0) continue;

    const sim = axisSimilarity(userProfile[axis].value, partyVal);
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

export function calculateResults(answers: Answer[], priorities: string[]): PartyResult[] {
  const userProfile = buildUserProfile(answers, priorities);

  const results: PartyResult[] = parties.map((party) => {
    const declared = computeMatch(userProfile, party, 'declared');
    const actual = computeMatch(userProfile, party, 'actual');

    const allIncluded = [...new Set([...declared.included, ...actual.included])];
    const allUnavailable = declared.unavailable.filter(
      (u) => actual.unavailable.some((a) => a.axis === u.axis)
    );

    const overallScore = declared.score * 0.35 + actual.score * 0.65;

    const axisScores: PartyResult['axisScores'] = {};
    for (const axis of allIncluded) {
      const dScore = declared.axisScores[axis] ?? 0;
      const aScore = actual.axisScores[axis] ?? 0;
      const combined = dScore * 0.35 + aScore * 0.65;
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
      axisScores,
      includedAxes: allIncluded,
      unavailableAxes: allUnavailable,
      gaps: party.gaps as PartyResult['gaps'],
      reliability: party.reliability as PartyResult['reliability'],
    };
  });

  results.sort((a, b) => b.overallScore - a.overallScore);
  return results;
}
