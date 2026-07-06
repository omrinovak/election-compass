import { useState } from 'react';
import type { PartyResult } from '../utils/matching';
import { getAxisLabel } from '../utils/matching';
import '../App.css';

function pct(n: number): string {
  return Math.round(n * 100) + '%';
}

const PARTY_EMOJI: Record<string, string> = {
  likud: '🔵',
  yesh_atid: '🟠',
  mahaneh_mamlahti: '🔷',
  shas: '🕍',
  yahadut_hatorah: '⬛',
  israel_beiteinu: '🔹',
  hademokratim: '🌹',
  beyahad: '🟣',
  hazionyut_hadatit: '🟧',
  otzma_yehudit: '🔥',
  hadash_taal: '🔴',
  raam: '🟢',
  yisrael_yashar: '⭐',
};

const AXIS_DESC: Record<string, string> = {
  liberty_vs_security: 'האיזון בין סמכויות ביטחוניות לבין זכויות אזרח וחופש אישי',
  equality_vs_free_market: 'עד כמה המדינה מתערבת בכלכלה כדי לצמצם פערים בהכנסות ועושר',
  authority_vs_checks: 'כוח הממשלה המרכזית מול מנגנוני ביקורת ופיקוח כמו בית משפט ומבקר',
  individual_vs_state: 'האם האחריות לרווחת האזרח מוטלת בעיקר על הפרט או על המדינה',
  tradition_vs_liberalism: 'האיזון בין שמירה על ערכים ומסורת יהודית לבין חירויות אינדיבידואליות וליברליות',
  security: 'גישה למדיניות ביטחון — מכוחנות ועד דיפלומטיה',
  economy: 'מדיניות כלכלית — מיסוי, גירעון, תמיכה בעסקים',
  cost_of_living: 'מדיניות להורדת יוקר המחיה — מזון, חשמל, תחבורה',
  rule_of_law: 'תמיכה בעצמאות מערכת המשפט, היועמ"ש ועקרון שלטון החוק',
  religion_state: 'יחסי דת ומדינה — שבת, נישואין, שירות חרדים',
  education: 'מדיניות חינוך — תוכנית לימודים, מימון, שוויון הזדמנויות',
  health: 'השקעה במערכת בריאות ציבורית והנגשתה',
  welfare: 'מדיניות רווחה — קצבאות, ביטוח לאומי, עזרה לחלשים',
  environment: 'מדיניות סביבתית — אנרגיה ירוקה, תעשייה מזהמת, אקלים',
  settlement: 'עידוד התיישבות יהודית ביהודה ושומרון',
  foreign_relations: 'מדיניות חוץ — יחסים עם ארה"ב, ברית הנאט"ו, מזרח התיכון',
  transport: 'השקעה בתחבורה ציבורית מול תשתיות כבישים',
  housing: 'פתרונות לדיור — שחרור קרקעות, דיור ציבורי, מחירים',
  ideology_vs_pragmatism: 'סגנון הנהגה — עקרונות קבועים מול גמישות ופרגמטיות',
  stability_vs_opposition: 'העדפה ליציבות שלטונית מול נכונות לאופוזיציה ולהחלפת ממשלה',
  experience_vs_renewal: 'ניסיון ממשלתי מול פנים חדשות ורעיונות חדשים',
};

function generateSummary(result: PartyResult, rank: number): string {
  const topAxes = Object.entries(result.axisScores)
    .filter(([, d]) => d.score >= 0.72)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 2)
    .map(([axis]) => getAxisLabel(axis));
  const lowAxes = Object.entries(result.axisScores)
    .filter(([, d]) => d.score < 0.38)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 1)
    .map(([axis]) => getAxisLabel(axis));

  if (rank === 0) {
    let s = `זוהי ההתאמה הגבוהה ביותר שלך — ${pct(result.overallScore)}.`;
    if (topAxes.length >= 2) s += ` עמדותיך קרובות במיוחד בנושאי ${topAxes[0]} ו${topAxes[1]}.`;
    else if (topAxes.length === 1) s += ` עמדותיך קרובות במיוחד בנושא ${topAxes[0]}.`;
    if (lowAxes.length > 0) s += ` הפער הבולט ביותר הוא בנושא ${lowAxes[0]}.`;
    return s;
  } else if (rank === 1) {
    let s = `האלטרנטיבה הקרובה ביותר — ${pct(result.overallScore)}.`;
    if (topAxes.length >= 1) s += ` ישנה תאימות גבוהה בנושא ${topAxes[0]}${topAxes[1] ? ` ו${topAxes[1]}` : ''}.`;
    if (lowAxes.length > 0) s += ` פער ב${lowAxes[0]}.`;
    return s;
  } else {
    let s = `${pct(result.overallScore)} התאמה כוללת.`;
    if (topAxes.length >= 1) s += ` נקודות חפיפה ב${topAxes[0]}.`;
    if (lowAxes.length > 0) s += ` פערים ב${lowAxes[0]}.`;
    return s;
  }
}

function AxisChip({ axis, data, className }: {
  axis: string;
  data: { score: number; partyDeclared: number; partyActual: number; userValue: number };
  className: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'inline-block', marginBottom: 6, marginLeft: 6 }}>
      <button
        className={`axis-chip ${className}`}
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer' }}
      >
        {getAxisLabel(axis)} {pct(data.score)} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px',
          marginTop: 4, lineHeight: 1.7, maxWidth: 280,
        }}>
          <div style={{ marginBottom: 4 }}>{AXIS_DESC[axis] || ''}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>עמדתך: {data.userValue.toFixed(1)}</span>
            <span>מצע: {data.partyDeclared.toFixed(1)}</span>
            <span>בפועל: {data.partyActual.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RankingTab({ results }: { results: PartyResult[] }) {
  const top = results[0];
  return (
    <div>
      {results.map((r, i) => {
        const isTop = i === 0;
        const showDetail = i < 3;
        const topAxes = Object.entries(r.axisScores)
          .sort(([, a], [, b]) => b.score - a.score)
          .slice(0, 4);
        const bottomAxes = Object.entries(r.axisScores)
          .sort(([, a], [, b]) => a.score - b.score)
          .slice(0, 2);
        const emoji = PARTY_EMOJI[r.id] ?? '⚪';

        return (
          <div key={r.id} className={`result-card ${isTop ? 'top-result' : ''}`}>
            {isTop && (
              <div className="top-result-badge">
                ✦ ההתאמה הטובה ביותר שלך
              </div>
            )}
            <div className="party-header">
              <span className="party-name">{emoji} {r.name}</span>
              <span className="party-score" style={{ color: isTop ? r.color : 'var(--text-secondary)' }}>
                {pct(r.overallScore)}
              </span>
            </div>
            <div className="score-bar">
              <div
                className="score-bar-fill"
                style={{ width: pct(r.overallScore), background: isTop ? r.color : 'var(--text-muted)' }}
              />
            </div>
            <div className="score-split">
              <span>ערכים: {pct(r.declaredScore)}</span>
              <span>בפועל: {pct(r.actualScore)}</span>
            </div>
            {showDetail && (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '10px 0' }}>
                  {generateSummary(r, i)}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {topAxes.map(([axis, data]) => (
                    <AxisChip key={axis} axis={axis} data={data} className={data.score >= 0.7 ? 'high' : ''} />
                  ))}
                  {bottomAxes.map(([axis, data]) => (
                    <AxisChip key={axis} axis={axis} data={data} className={data.score < 0.4 ? 'low' : ''} />
                  ))}
                  {isTop && r.unavailableAxes.slice(0, 2).map((u) => (
                    <span key={u.axis} className="axis-chip na">
                      {getAxisLabel(u.axis)} —
                    </span>
                  ))}
                </div>
                {isTop && r.gaps.map((gap) => (
                  <div key={gap.axis} className="gap-note">
                    ⚠ {getAxisLabel(gap.axis)} — {gap.description}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}

      {top && (
        <div className="dims-note">
          <strong>נכלל בחישוב:</strong> {top.includedAxes.map(getAxisLabel).join(', ')}
          {top.unavailableAxes.length > 0 && (
            <>
              <br />
              <strong>לא נכלל:</strong> {top.unavailableAxes.map((u) => `${getAxisLabel(u.axis)} (${u.reason})`).join(', ')}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DetailTab({ result }: { result: PartyResult }) {
  const sorted = Object.entries(result.axisScores).sort(([, a], [, b]) => b.score - a.score);
  const emoji = PARTY_EMOJI[result.id] ?? '⚪';

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        {emoji} {result.name} — למה {pct(result.overallScore)}?
      </h3>
      {sorted.map(([axis, data]) => {
        let className = 'insight';
        let text = '';
        if (data.score >= 0.7) {
          text = `${getAxisLabel(axis)} — התאמה גבוהה (${pct(data.score)}). עמדותיך קרובות לעמדות המפלגה.`;
        } else if (data.score >= 0.4) {
          text = `${getAxisLabel(axis)} — התאמה חלקית (${pct(data.score)}). `;
          if (Math.abs(data.partyDeclared - data.partyActual) > 1) {
            text += 'המצע קרוב לעמדתך אך ההתנהלות בפועל שונה.';
          } else {
            text += 'קיים פער מסוים בין עמדותיך לעמדות המפלגה.';
          }
        } else {
          className += ' low-match';
          text = `${getAxisLabel(axis)} — פער משמעותי (${pct(data.score)}). עמדתך שונה מהותית מעמדת המפלגה.`;
        }
        if (data.confidence === 'partial') text += ' (מבוסס על נתונים חלקיים)';
        return <div key={axis} className={className}>{text}</div>;
      })}
      {result.unavailableAxes.map((u) => (
        <div key={u.axis} className="insight na-match">
          {getAxisLabel(u.axis)} — לא נכלל. {u.reason}.
        </div>
      ))}
    </div>
  );
}

function TransparencyTab({ result, priorities }: { result: PartyResult; priorities: string[] }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>איך זה חושב?</h3>
      <div className="insight">
        התשובות שלך הפכו לפרופיל אידאולוגי על {result.includedAxes.length + result.unavailableAxes.length} צירים.
        כל מפלגה קיבלה פרופיל דומה — מבוסס על מצעים, הצבעות בכנסת, והחלטות ממשלה.
      </div>
      <div className="insight">
        ההתאמה חושבה בנפרד: פעם לפי הצהרות (35%), פעם לפי מעשים (65%).
        הציון הסופי משקלל את שניהם עם דגש על מעשים.
      </div>
      {priorities.length > 0 && (
        <div className="insight">
          {priorities.length} נושאים שסימנת כחשובים קיבלו משקל כפול:
          {' '}{priorities.map(getAxisLabel).join(', ')}.
        </div>
      )}
      {result.unavailableAxes.length > 0 && (
        <div className="insight">
          {result.unavailableAxes.length} תחומים הוצאו מהחישוב כי לא היו מספיק ראיות —
          הציון מבוסס על {result.includedAxes.length} תחומים.
        </div>
      )}
      {result.reliability && (
        <div className="insight">
          אמינות המפלגה: עמידה בהבטחות {result.reliability.promise_keeping.score !== null ? pct(result.reliability.promise_keeping.score) : 'לא זמין'}
          {' · '}יציבות עמדות {pct(result.reliability.consistency.score ?? 0)}
          {' · '}יכולת ביצוע {result.reliability.execution.score !== null ? pct(result.reliability.execution.score) : 'לא זמין'}
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
        methodology v1.0 · data 2026-07 · hybrid algorithm
      </p>
    </div>
  );
}

export default function Results({
  results,
  priorities,
  onRestart,
}: {
  results: PartyResult[];
  priorities: string[];
  onRestart: () => void;
}) {
  const [tab, setTab] = useState(0);
  const top = results[0];

  function handleShare() {
    const text = `מצפן הבחירות — התוצאות שלי:\n${results.slice(0, 3).map((r, i) => `${i + 1}. ${r.name}: ${pct(r.overallScore)}`).join('\n')}`;
    if (navigator.share) {
      navigator.share({ title: 'מצפן הבחירות', text });
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  return (
    <div className="screen" style={{ minHeight: 'auto' }}>
      <div className="content">
        <h2 className="results-title">התוצאות שלך</h2>
        <p className="results-meta">
          מבוסס על {top?.includedAxes.length} מתוך {(top?.includedAxes.length ?? 0) + (top?.unavailableAxes.length ?? 0)} תחומים
        </p>

        <div className="tab-row">
          {['דירוג', 'פירוט', 'שקיפות'].map((label, i) => (
            <button key={i} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 0 && <RankingTab results={results} />}
        {tab === 1 && top && <DetailTab result={top} />}
        {tab === 2 && top && <TransparencyTab result={top} priorities={priorities} />}

        <div className="share-row">
          <button className="share-btn" onClick={handleShare}>📤 שיתוף</button>
          <button className="share-btn" onClick={onRestart}>🔄 מחדש</button>
        </div>
      </div>
    </div>
  );
}
