import '../App.css';

export default function VotePage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="vote-page">

      {/* Hero */}
      <div className="vp-hero">
        <div className="vp-illustration">
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer glow ring */}
            <circle cx="80" cy="80" r="72" fill="rgba(255,255,255,0.07)" />
            <circle cx="80" cy="80" r="56" fill="rgba(255,255,255,0.10)" />
            {/* Ballot box body */}
            <rect x="34" y="88" width="92" height="52" rx="8" fill="white" opacity="0.92"/>
            {/* Box shade */}
            <rect x="34" y="108" width="92" height="32" rx="0" fill="rgba(0,0,0,0.04)"/>
            {/* Slot */}
            <rect x="55" y="86" width="50" height="6" rx="3" fill="rgba(52,81,209,0.25)"/>
            {/* Ballot paper */}
            <g transform="rotate(-6, 80, 65)">
              <rect x="58" y="36" width="44" height="56" rx="5" fill="white" opacity="0.97"/>
              {/* Lines on paper */}
              <rect x="66" y="47" width="28" height="2.5" rx="1.2" fill="#c5cce8"/>
              <rect x="66" y="54" width="20" height="2.5" rx="1.2" fill="#c5cce8"/>
              {/* Checkmark */}
              <path d="M66 70 l6 6 12-14" stroke="#3451d1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            {/* Sparkles */}
            <circle cx="28" cy="50" r="3" fill="rgba(255,255,255,0.5)"/>
            <circle cx="134" cy="62" r="2" fill="rgba(255,255,255,0.4)"/>
            <circle cx="38" cy="118" r="2" fill="rgba(255,255,255,0.3)"/>
            <circle cx="126" cy="105" r="3.5" fill="rgba(255,255,255,0.35)"/>
            <line x1="28" y1="36" x2="28" y2="44" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="40" x2="32" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="130" y1="44" x2="130" y2="50" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="127" y1="47" x2="133" y2="47" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="vp-title">עכשיו — לך להצביע</h1>
        <p className="vp-subtitle">
          זכות שאנשים נאבקו עליה במשך דורות.
          יום הבחירות הוא היום שבו קולך שווה בדיוק לקולו של ראש הממשלה.
        </p>
      </div>

      {/* Content */}
      <div className="vp-content">

        <blockquote className="vp-quote">
          <div className="vp-quote-mark">"</div>
          <p>דמוקרטיה היא שיטת המשטר הגרועה ביותר — פרט לכל האחרות.</p>
          <cite>ווינסטון צ'רצ'יל</cite>
        </blockquote>

        <blockquote className="vp-quote">
          <div className="vp-quote-mark">"</div>
          <p>מי שלא מצביע אינו מוותר על מדיניות — הוא מוותר על השפעה.</p>
          <cite>אמרה ידועה בתורת הדמוקרטיה</cite>
        </blockquote>

        <div className="vp-divider" />

        <div className="vp-info">
          <div className="vp-info-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="var(--accent)" strokeWidth="1.6"/>
              <path d="M10 9v6M10 6v.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h4 className="vp-info-title">אחוז החסימה — 3.25%</h4>
            <p className="vp-info-text">
              מפלגה שלא עוברת את הסף לא מקבלת אף מנדט.
              הקולות שלה מתפזרים לשאר המפלגות.
              אם מפלגה שאוהב נמצאת קרוב לסף — שווה לחשוב אם הצבעה לה היא ההחלטה הנכונה.
            </p>
          </div>
        </div>

        <div className="vp-info">
          <div className="vp-info-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l2.4 4.8 5.3.77-3.85 3.75.91 5.3L10 14.1l-4.76 2.52.91-5.3L2.3 7.57l5.3-.77L10 2z" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h4 className="vp-info-title">לא כל המפלגות בשאלון</h4>
            <p className="vp-info-text">
              השאלון כולל את המפלגות המרכזיות — אבל לא את כולן.
              מפלגה שלא מופיעה אינה פחות לגיטימית.
              אנחנו מעודדים מחקר עצמאי — קרא מצעים, בדוק הצבעות בכנסת, <strong>כל עוד הוא מבוסס על עובדות ונתונים</strong>.
            </p>
          </div>
        </div>

        <p className="vp-footer">
          הדמוקרטיה מתקיימת כשאנשים מגיעים לקלפי.<br />
          <strong>תהיה אחד מהם.</strong>
        </p>

        <button className="btn btn-primary vp-cta" onClick={onContinue}>
          לתוצאות שלי →
        </button>

      </div>
    </div>
  );
}
