import { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';

const STEPS = [
  {
    target: 'counter' as const,
    color: '#ef4444',
    label: 'מספר השאלות',
    desc: 'תמיד תדע באיזו שאלה אתה נמצא מתוך הסה"כ',
  },
  {
    target: 'toggle' as const,
    color: '#6366f1',
    label: 'דילמה אמיתית ↔ שאלה עקרונית',
    desc: 'לכל שאלה יש שתי גרסאות — דילמה מחיים אמיתיים ועיקרון מופשט. לחץ להחלפה',
  },
  {
    target: 'question' as const,
    color: '#ca8a04',
    label: 'השאלה עצמה',
    desc: 'קרא את הטקסט ואז בחר מיקום על הסולם שמתחת',
  },
  {
    target: 'poles' as const,
    color: '#16a34a',
    label: 'שני הצדדים להשוואה',
    desc: '1 = הצד הימני, 7 = הצד השמאלי. 4 = אמצע / לא בטוח',
  },
];

type Target = typeof STEPS[number]['target'];
interface Rect { top: number; left: number; width: number; height: number }

/** Computes padded spotlight rect. */
function padRect(r: Rect, pad = 10) {
  return {
    T: r.top    - pad,
    L: r.left   - pad,
    B: r.top  + r.height + pad,
    R: r.left + r.width  + pad,
  };
}

export default function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const counterRef  = useRef<HTMLSpanElement>(null);
  const toggleRef   = useRef<HTMLButtonElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const polesRef    = useRef<HTMLDivElement>(null);

  const refMap = useRef<Record<Target, React.RefObject<HTMLElement | null>>>({
    counter:  counterRef,
    toggle:   toggleRef,
    question: questionRef,
    poles:    polesRef,
  });

  const measure = useCallback((target: Target) => {
    const el = refMap.current[target].current as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    // small delay so layout settles before measuring
    const id = requestAnimationFrame(() => measure(STEPS[step].target));
    const onResize = () => measure(STEPS[step].target);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
    };
  }, [step, measure]);

  function advance() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else onDone();
  }

  const cur = STEPS[step];
  const PAD = 10;

  return (
    <div className="tut-container" onClick={advance} role="dialog" aria-modal="true">

      {/* ── Dark overlay — 4 strips framing the spotlight ── */}
      {rect && (() => {
        const { T, L, B, R } = padRect(rect, PAD);
        const bg: React.CSSProperties = { background: 'rgba(0,0,0,0.82)', position: 'fixed', zIndex: 201, transition: 'all 0.3s ease' };
        return <>
          <div style={{ ...bg, top: 0, left: 0, right: 0, height: T }} />
          <div style={{ ...bg, top: B, left: 0, right: 0, bottom: 0 }} />
          <div style={{ ...bg, top: T, left: 0, width: L, height: B - T }} />
          <div style={{ ...bg, top: T, left: R, right: 0, height: B - T }} />
        </>;
      })()}

      {/* ── Colored spotlight border ── */}
      {rect && (
        <div
          className="tut-spotlight-border"
          style={{
            top:    rect.top    - PAD,
            left:   rect.left   - PAD,
            width:  rect.width  + PAD * 2,
            height: rect.height + PAD * 2,
            outline: `3px solid ${cur.color}`,
            boxShadow: `0 0 12px 2px ${cur.color}40`,
          }}
        />
      )}

      {/* ── Mock questionnaire (non-interactive) ── */}
      <div className="tut-mock" onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="tut-topbar">
          <span className="tut-back-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <div className="tut-progress-bar">
            <div className="tut-progress-fill" />
          </div>
          <span ref={counterRef} className="tut-step-label">32 / 1</span>
        </div>

        {/* Hero card */}
        <div className="tut-hero q-hero q-hero--policy">
          <div className="tut-hero-row">
            <span className="q-layer-chip">ערכים</span>
            <button
              ref={toggleRef as React.RefObject<HTMLButtonElement>}
              className="q-swap-btn"
              type="button"
              onClick={e => e.stopPropagation()}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 4.5h9M8.5 2l2.5 2.5L8.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 8.5H2M4.5 6l-2.5 2.5L4.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              שאלה עקרונית
            </button>
          </div>

          <h2
            ref={questionRef as React.RefObject<HTMLHeadingElement>}
            className="q-question-text tut-qtext"
          >
            הצעת חוק: השב&quot;כ יוכל לנטר שיחות טלפון של חשודים בטרור, גם לפני שהואשמו רשמית. מי שניטר מוקדם הציל חיים בעבר — אי אפשר לחכות לשופט כשמדובר בפיגוע מתקרב. מי שמתנגד: &apos;חשוד&apos; הוא הגדרה רחבה. ניטור ללא פיקוח שיפוטי עלול לפגוע באנשים חפים מפשע.
          </h2>

          <p className="q-abstract-hint">
            כשיש מתח בין חופש אישי לבין ביטחון הציבור, עדיף להעדיף את...
          </p>

          <div
            ref={polesRef as React.RefObject<HTMLDivElement>}
            className="q-poles"
          >
            <span className="q-pole q-pole--min">ביטחון הציבור</span>
            <span className="q-pole-sep">↔</span>
            <span className="q-pole q-pole--max">חופש אישי</span>
          </div>
        </div>

        {/* Scale */}
        <div className="q-content" style={{ paddingTop: 12 }}>
          <div className="q-scale-wrap">
            <div className="q-scale-hint">
              <span>1 = קצה אחד</span>
              <span>4 = באמצע / לא בטוח</span>
              <span>7 = קצה שני</span>
            </div>
            <div className="q-scale-row">
              {[7, 6, 5, 4, 3, 2, 1].map(n => (
                <button key={n} className="q-scale-btn" type="button" onClick={e => e.stopPropagation()}>{n}</button>
              ))}
            </div>
            <div className="q-scale-poles">
              <span className="q-scale-pole-min">חופש אישי</span>
              <span className="q-scale-pole-max">ביטחון הציבור</span>
            </div>
          </div>
        </div>

      </div>{/* end tut-mock */}

      {/* ── Tooltip card ── */}
      <div className="tut-tooltip" onClick={e => { e.stopPropagation(); advance(); }}>
        <div className="tut-tooltip-label" style={{ color: cur.color }}>{cur.label}</div>
        <p className="tut-tooltip-desc">{cur.desc}</p>
        <div className="tut-tooltip-footer">
          <div className="tut-dots">
            {STEPS.map((s, i) => (
              <span
                key={i}
                className={`tut-dot${i === step ? ' tut-dot--active' : ''}`}
                style={i === step ? { backgroundColor: s.color } : {}}
              />
            ))}
          </div>
          <span className="tut-tooltip-next">
            {step < STEPS.length - 1 ? 'לחץ להמשיך →' : 'מתחילים! →'}
          </span>
        </div>
      </div>

    </div>
  );
}
