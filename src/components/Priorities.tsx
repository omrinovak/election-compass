import { useState } from 'react';
import questionsData from '../data/questions.json';
import '../App.css';

const MAX_PRIORITIES = 5;

export default function Priorities({
  onComplete,
  onBack,
}: {
  onComplete: (priorities: string[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < MAX_PRIORITIES) {
      next.add(id);
    }
    setSelected(next);
  }

  return (
    <div className="screen">
      <div className="content">
        <h2 className="priorities-title">מה הכי חשוב לך?</h2>
        <p className="priorities-subtitle">
          סמן עד {MAX_PRIORITIES} נושאים. הם יקבלו משקל כפול בתוצאות.
          ({selected.size}/{MAX_PRIORITIES})
        </p>
        <div className="topic-grid">
          {questionsData.priorityTopics.map((topic) => {
            const isSelected = selected.has(topic.id);
            return (
              <button
                key={topic.id}
                className={`topic-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(topic.id)}
              >
                <span className="topic-check">
                  {isSelected && '✓'}
                </span>
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-secondary" onClick={onBack}>→ חזרה</button>
        <button
          className="btn btn-primary"
          onClick={() => onComplete([...selected])}
        >
          לתוצאות ←
        </button>
      </div>
    </div>
  );
}
