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
}

const LAYER_LABELS: Record<string, string> = {
  values: 'ערכים',
  policy: 'מדיניות',
  leadership: 'סגנון הנהגה',
};

const CONFIDENCE_OPTIONS = [
  { value: 0.3, label: 'לא בטוח' },
  { value: 0.6, label: 'נוטה לכיוון הזה' },
  { value: 1.0, label: 'בטוח מאוד' },
];

export default function Questionnaire({ onComplete }: { onComplete: (answers: Answer[]) => void }) {
  const allQuestions = useMemo<Question[]>(() => [
    ...questionsData.values,
    ...questionsData.policy,
    ...questionsData.leadership,
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { value: number; confidence: number }>>(new Map());
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState(0.6);

  const question = allQuestions[currentIndex];
  const total = allQuestions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const existing = answers.get(question.id);
  const displayValue = selectedValue ?? existing?.value ?? null;
  const displayConf = existing ? existing.confidence : selectedConfidence;

  function saveAndAdvance() {
    if (displayValue !== null) {
      const updated = new Map(answers);
      updated.set(question.id, { value: displayValue, confidence: displayConf });
      setAnswers(updated);

      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
        const nextExisting = updated.get(allQuestions[currentIndex + 1].id);
        setSelectedValue(nextExisting?.value ?? null);
        setSelectedConfidence(nextExisting?.confidence ?? 0.6);
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
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextExisting = answers.get(allQuestions[currentIndex + 1].id);
      setSelectedValue(nextExisting?.value ?? null);
      setSelectedConfidence(nextExisting?.confidence ?? 0.6);
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
      setSelectedConfidence(prevExisting?.confidence ?? 0.6);
    }
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="step-label">{currentIndex + 1} / {total}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="layer-label">{LAYER_LABELS[question.layer]}</span>
      </div>

      <div className="content">
        <p className="question-text">{question.text}</p>

        <div className="scale-labels">
          <span className="scale-label">{question.scaleMin}</span>
          <span className="scale-label scale-label-end">{question.scaleMax}</span>
        </div>

        <div className="scale-options">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              className={`scale-btn ${displayValue === n ? 'selected' : ''}`}
              onClick={() => {
                setSelectedValue(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="confidence-label">עד כמה אתה בטוח?</p>
        <div className="confidence-row">
          {CONFIDENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`conf-btn ${displayConf === opt.value ? 'selected' : ''}`}
              onClick={() => setSelectedConfidence(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button className="btn-ghost" onClick={skip} style={{ width: '100%' }}>
            לא יודע / לא רלוונטי — דלג
          </button>
        </div>
      </div>

      <div className="bottom-bar">
        {currentIndex > 0 && (
          <button className="btn btn-secondary" onClick={goBack}>→ חזרה</button>
        )}
        <button
          className="btn btn-primary"
          onClick={saveAndAdvance}
          style={{ opacity: displayValue === null ? 0.5 : 1 }}
          disabled={displayValue === null}
        >
          {currentIndex < total - 1 ? 'הבא ←' : 'לתעדוף ←'}
        </button>
      </div>
    </div>
  );
}
