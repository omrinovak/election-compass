import { useState, useMemo } from 'react';
import questionsData from '../data/questions.json';
import type { Answer } from '../utils/matching';
import '../App.css';

interface Question {
  id: string;
  layer: string;
  axes: string[];
  text: string;
  scaleMin: string;
  scaleMax: string;
  example?: string;
}

const LAYER_LABELS: Record<string, string> = {
  values: 'ערכים',
  policy: 'מדיניות',
  leadership: 'סגנון הנהגה',
};

const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7];

const SwapIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 4.5h9M8.5 2l2.5 2.5L8.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 8.5H2M4.5 6l-2.5 2.5L4.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Questionnaire({ onComplete }: { onComplete: (answers: Answer[]) => void }) {
  const allQuestions = useMemo<Question[]>(() => [
    ...questionsData.values,
    ...questionsData.policy,
    ...questionsData.leadership,
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { value: number; confidence: number }>>(new Map());
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  // 'example' = show real-life dilemma (default), 'abstract' = show principle
  const [mode, setMode] = useState<'example' | 'abstract'>('example');

  const question = allQuestions[currentIndex];
  const total = allQuestions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const existing = answers.get(question.id);
  const displayValue = selectedValue ?? existing?.value ?? null;

  // Decide what to show as the main question text
  const hasExample = Boolean(question.example);
  const mainText = (hasExample && mode === 'example') ? question.example! : question.text;
  const showToggle = hasExample;

  function saveAndAdvance() {
    if (displayValue !== null) {
      const updated = new Map(answers);
      const confidence = displayValue === 4 ? 0.3 : (displayValue === 3 || displayValue === 5) ? 0.6 : 1.0;
      updated.set(question.id, { value: displayValue, confidence });
      setAnswers(updated);

      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
        const nextExisting = updated.get(allQuestions[currentIndex + 1].id);
        setSelectedValue(nextExisting?.value ?? null);
        setMode('example');
      } else {
        const finalAnswers: Answer[] = [];
        for (const q of allQuestions) {
          const a = updated.get(q.id);
          if (a) {
            finalAnswers.push({
              questionId: q.id,
              value: a.value,
              confidence: a.confidence,
              axes: q.axes,
              layer: q.layer,
            });
          }
        }
        onComplete(finalAnswers);
      }
    }
  }

  function skip() {
    const nextIndex = currentIndex + 1;
    if (nextIndex < total) {
      setCurrentIndex(nextIndex);
      const nextExisting = answers.get(allQuestions[nextIndex].id);
      setSelectedValue(nextExisting?.value ?? null);
      setMode('example');
    } else {
      const finalAnswers: Answer[] = [];
      for (const q of allQuestions) {
        const a = answers.get(q.id);
        if (a) {
          finalAnswers.push({
            questionId: q.id,
            value: a.value,
            confidence: a.confidence,
            axes: q.axes,
            layer: q.layer,
          });
        }
      }
      onComplete(finalAnswers);
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevExisting = answers.get(allQuestions[prevIndex].id);
      setSelectedValue(prevExisting?.value ?? null);
      setMode('example');
    }
  }

  return (
    <div className="screen q-screen">
      {/* Top bar */}
      <div className="top-bar">
        {currentIndex > 0 ? (
          <button className="q-back-btn" onClick={goBack} aria-label="חזרה">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <span style={{ width: 32 }} />
        )}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="step-label">{currentIndex + 1} / {total}</span>
      </div>

      {/* Hero question header */}
      <div className={`q-hero q-hero--${question.layer}`}>
        <div className="q-hero-top">
          <span className="q-layer-chip">{LAYER_LABELS[question.layer]}</span>
          {showToggle && (
            <button
              className="q-swap-btn"
              onClick={() => setMode(mode === 'example' ? 'abstract' : 'example')}
              title={mode === 'example' ? 'הצג כשאלה עקרונית' : 'הצג כדילמה אמיתית'}
            >
              <SwapIcon />
              {mode === 'example' ? 'שאלה עקרונית' : 'דילמה אמיתית'}
            </button>
          )}
        </div>
        <h2 className="q-question-text">{mainText}</h2>
        {/* Secondary context: show abstract principle lightly when in example mode */}
        {hasExample && mode === 'example' && (
          <p className="q-abstract-hint">{question.text}</p>
        )}
        <div className="q-poles">
          <span className="q-pole q-pole--min">{question.scaleMin}</span>
          <span className="q-pole-sep">↔</span>
          <span className="q-pole q-pole--max">{question.scaleMax}</span>
        </div>
      </div>

      {/* Scale */}
      <div className="q-content">
        <div className="q-scale-wrap">
          <div className="q-scale-hint">
            <span>1 = קצה אחד</span>
            <span>4 = באמצע / לא בטוח</span>
            <span>7 = קצה שני</span>
          </div>
          <div className="q-scale-row">
            {SCALE_VALUES.map((n) => (
              <button
                key={n}
                className={`q-scale-btn ${displayValue === n ? 'q-scale-btn--selected' : ''}`}
                onClick={() => setSelectedValue(n)}
                aria-label={`${n} מתוך 7`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="q-scale-poles">
            <span className="q-scale-pole-min">{question.scaleMin}</span>
            <span className="q-scale-pole-max">{question.scaleMax}</span>
          </div>
        </div>

        <button className="q-skip-btn" onClick={skip}>
          לא יודע / לא רלוונטי — דלג
        </button>
      </div>

      {/* Bottom action */}
      <div className="bottom-bar">
        <button
          className="btn btn-primary"
          onClick={saveAndAdvance}
          style={{ opacity: displayValue === null ? 0.45 : 1 }}
          disabled={displayValue === null}
        >
          {currentIndex < total - 1 ? 'הבא' : 'לתוצאות'}
        </button>
      </div>
    </div>
  );
}
