interface CompareLinkPayload {
  v: 1;
  p: string;           // top party id של השולח
  s: number;            // overallScore מעוגל (0-100)
  ax: Record<string, number>; // axis profile
}

export function encodeCompareProfile(ax: Record<string, number>, partyId: string, score: number): string {
  const payload: CompareLinkPayload = { v: 1, p: partyId, s: Math.round(score * 100), ax };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeCompareProfile(raw: string): CompareLinkPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(raw)));
    if (parsed && parsed.v === 1 && parsed.ax && typeof parsed.p === 'string') {
      return parsed as CompareLinkPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export type { CompareLinkPayload };
