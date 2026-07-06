import { useState } from 'react';
import About from './About';
import '../App.css';

const CompassIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="14" stroke="white" strokeWidth="2" strokeOpacity="0.6"/>
    <circle cx="18" cy="18" r="2.5" fill="white"/>
    <path d="M18 6V10M18 26V30M6 18H10M26 18H30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"/>
    <path d="M22 14L19.5 19.5L14 22L16.5 16.5L22 14Z" fill="white"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 4V6.5L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export default function Welcome({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="screen screen-center">
      {showAbout && <About onClose={() => setShowAbout(false)} />}

      <div className="welcome-logo">
        <CompassIcon />
      </div>
      <h1 className="welcome-title">מצפן הבחירות</h1>
      <p className="welcome-subtitle">
        גלה לאיזו מפלגה אתה הכי קרוב — על סמך מה שחשוב לך, לא על סמך סיסמאות
      </p>
      <div className="time-badge">
        <ClockIcon />
        5–7 דקות
      </div>
      <div className="welcome-story">
        <p>
          שלום, אני{' '}
          <a
            href="https://linkedin.com/in/omri-novak-460053414"
            target="_blank"
            rel="noopener noreferrer"
            className="welcome-story-link"
          >
            עומרי נובק
          </a>
          . השאלון הזה נולד מתוך שיחה בשמירה בסבב המילואים האחרון עם חבר טוב מהצוות שלי. שמתי לב לתופעה רחבה שבה רבים מבני דורינו מרגישים אבודים מבחינת ייצוג פוליטי — הם יודעים מה הם חושבים ויש להם דעות, אבל מרוב רעש ושטויות של פוליטיקאים לא ברור מי אומר מה.
        </p>
        <p style={{ marginTop: 10 }}>
          מטרת השאלון היא לעזור לכל אחד ואחת להרגיש שקולם נשמע ויש מי שייצג אותם.
        </p>
      </div>

      <ul className="feature-list">
        <li>
          <span className="feature-check"><CheckIcon /></span>
          שאלון ניטרלי — ללא הטיה לכיוון כלשהו
        </li>
        <li>
          <span className="feature-check"><CheckIcon /></span>
          מבוסס על מעשים, לא רק על הצהרות
        </li>
        <li>
          <span className="feature-check"><CheckIcon /></span>
          שקוף — כל ציון ניתן להסבר
        </li>
        <li>
          <span className="feature-check"><CheckIcon /></span>
          לא אוספים מידע אישי
        </li>
      </ul>
      <div style={{ width: '100%', maxWidth: 300, marginTop: 24 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onStart}>
          בואו נתחיל
        </button>
        <button
          className="btn-ghost"
          style={{ width: '100%', marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}
          onClick={() => setShowAbout(true)}
        >
          אודות המצפן · מתודולוגיה ומקורות
        </button>
        <button
          className="btn-ghost"
          style={{ width: '100%', marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}
          onClick={onAdmin}
        >
          עדכון נתונים
        </button>
      </div>

      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: 1.8,
        marginTop: 20,
        padding: '12px 0',
        borderTop: '1px solid var(--border)',
        width: '100%',
      }}>
        <div>מבוסס על נתונים עד יולי 2026 · הכלי אינו מחליף קריאה עצמאית של מצעי המפלגות</div>
        <div style={{ marginTop: 6 }}>
          נוצר על ידי{' '}
          <a
            href="https://linkedin.com/in/omri-novak-460053414"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            עומרי נובק
          </a>
        </div>
      </div>
    </div>
  );
}
