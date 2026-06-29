import { useState } from 'react';
import type { PartyResult } from '../utils/matching';
import { getAxisLabel } from '../utils/matching';
import '../App.css';

function pct(n: number): string {
  return Math.round(n * 100) + '%';
}

function RankingTab({ results }: { results: PartyResult[] }) {
  const top = results[0];
  return (
    <div>
      {results.map((r, i) => {
        const isTop = i === 0;
        const topAxes = Object.entries(r.axisScores)
          .sort(([, a], [, b]) => b.score - a.score)
          .slice(0, 4);
        const bottomAxes = Object.entries(r.axisScores)
          .sort(([, a], [, b]) => a.score - b.score)
          .slice(0, 2);

        return (
          <div key={r.id} className={`result-card ${isTop ? 'top-result' : ''}`}>
            <div className="party-header">
              <span className="party-name">{r.name}</span>
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
            {isTop && (
              <>
                <div className="axis-chips">
                  {topAxes.map(([axis, data]) => (
                    <span key={axis} className={`axis-chip ${data.score >= 0.7 ? 'high' : ''}`}>
                      {getAxisLabel(axis)} {pct(data.score)}
                    </span>
                  ))}
                  {bottomAxes.map(([axis, data]) => (
                    <span key={axis} className={`axis-chip ${data.score < 0.4 ? 'low' : ''}`}>
                      {getAxisLabel(axis)} {pct(data.score)}
                    </span>
                  ))}
                  {r.unavailableAxes.slice(0, 2).map((u) => (
                    <span key={u.axis} className="axis-chip na">
                      {getAxisLabel(u.axis)} —
                    </span>
                  ))}
                </div>
                {r.gaps.map((gap) => (
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

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        {result.name} — למה {pct(result.overallScore)}?
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
        if (data.confidence === 'partial') {
          text += ' (מבוסס על נתונים חלקיים)';
        }
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
    const text = `מצפן הבחירות — התוצאות שלי:\n${results.slice(0, 3).map((r) => `${r.name}: ${pct(r.overallScore)}`).join('\n')}`;
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
