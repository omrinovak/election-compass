interface CompareLinkPayload {
  v: 1;
  p: string;           // top party id של השולח
  s: number;            // overallScore מעוגל (0-100)
  ax: Record<string, number>; // axis profile
}

// Standard base64 (from btoa) uses +, /, and = padding, none of which are safe to drop directly
// into a URL query string: `+` in particular is decoded back as a literal space by
// URLSearchParams (application/x-www-form-urlencoded parsing), silently corrupting the payload
// before JSON.parse ever runs. Producing base64url here — instead of leaving callers to remember
// encodeURIComponent() at every place they build a `?cmp=` link — makes the return value of this
// function safe to interpolate into a URL directly, which is the actual invariant that matters.
function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return padded;
}

export function encodeCompareProfile(ax: Record<string, number>, partyId: string, score: number): string {
  const payload: CompareLinkPayload = { v: 1, p: partyId, s: Math.round(score * 100), ax };
  return toBase64Url(btoa(encodeURIComponent(JSON.stringify(payload))));
}

function isValidPayload(parsed: unknown): parsed is CompareLinkPayload {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as Record<string, unknown>;
  if (p.v !== 1 || typeof p.p !== 'string' || typeof p.s !== 'number' || !Number.isFinite(p.s)) return false;
  if (!p.ax || typeof p.ax !== 'object') return false;
  return Object.values(p.ax as Record<string, unknown>).every((v) => typeof v === 'number' && Number.isFinite(v));
}

export function decodeCompareProfile(raw: string): CompareLinkPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(fromBase64Url(raw))));
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type { CompareLinkPayload };
