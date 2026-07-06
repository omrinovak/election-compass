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

const LightbulbIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1a4 4 0 0 1 2.5 7.1V9.5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5V8.1A4 4 0 0 1 7 1z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5.5 11h3M6 12.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
  const [showExample, setShowExample] = useState(false);

  const question = allQuestions[currentIndex];
  const total = allQuestions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const existing = answers.get(question.id);
  const displayValue = selectedValue ?? existing?.value ?? null;

  function saveAndAdvance() {
    if (displayValue !== null) {
      const updated = new Map(answers);
      // confidence derived from how extreme the answer is
      const confidence = displayValue === 4 ? 0.3 : (displayValue === 3 || displayValue === 5) ? 0.6 : 1.0;
      updated.set(question.id, { value: displayValue, confidence });
      setAnswers(updated);

      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
        const nextExisting = updated.get(allQuestions[currentIndex + 1].id);
        setSelectedValue(nextExisting?.value ?? null);
        setShowExample(false);
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
      setShowExample(false);
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
      setShowExample(false);
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
        <span className="q-layer-chip">{LAYER_LABELS[question.layer]}</span>
        <h2 className="q-question-text">{question.text}</h2>
        <div className="q-poles">
          <span className="q-pole q-pole--min">{question.scaleMin}</span>
          <span className="q-pole-sep">↔</span>
          <span className="q-pole q-pole--max">{question.scaleMax}</span>
        </div>
      </div>

      {/* Answers */}
      <div className="q-content">
        <div className="q-scale-wrap">
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

        {question.example && (
          <div className="q-example-wrap">
            <button
              className="example-toggle"
              onClick={() => setShowExample(!showExample)}
            >
              <LightbulbIcon />
              {showExample ? 'הסתר דוגמה' : 'דוגמה מהחיים'}
              <ChevronIcon open={showExample} />
            </button>
            {showExample && (
              <div className="example-box">{question.example}</div>
            )}
          </div>
        )}

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
