import '../App.css';

export default function Welcome({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) {
  return (
    <div className="screen screen-center">
      <div className="welcome-icon">🧭</div>
      <h1 className="welcome-title">מצפן הבחירות</h1>
      <p className="welcome-subtitle">
        גלה לאיזו מפלגה אתה הכי קרוב — על סמך מה שחשוב לך, לא על סמך סיסמאות
      </p>
      <div className="time-badge">🕐 5-7 דקות</div>
      <ul className="feature-list">
        <li><span className="feature-check">✓</span>שאלון ניטרלי — ללא הטיה לכיוון כלשהו</li>
        <li><span className="feature-check">✓</span>מבוסס על מעשים, לא רק על הצהרות</li>
        <li><span className="feature-check">✓</span>שקוף — כל ציון ניתן להסבר</li>
        <li><span className="feature-check">✓</span>לא אוספים מידע אישי</li>
      </ul>
      <div style={{ width: '100%', maxWidth: 320, marginTop: 24 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onStart}>
          בואו נתחיל ←
        </button>
        <button className="btn-ghost" style={{ width: '100%', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }} onClick={onAdmin}>
          עדכון נתונים
        </button>
      </div>
    </div>
  );
}
