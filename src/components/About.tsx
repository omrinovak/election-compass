import '../App.css';

export default function About({ onClose }: { onClose: () => void }) {
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-sheet" onClick={e => e.stopPropagation()}>
        <div className="about-handle" />

        <div className="about-header">
          <h2 className="about-title">אודות המצפן</h2>
          <button className="about-close" onClick={onClose} aria-label="סגור">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="about-body">

          <section className="about-section">
            <h3 className="about-section-title">מה הכלי עושה?</h3>
            <p>מצפן הבחירות מחשב כמה כל מפלגה קרובה לעמדותיך — על סמך שאלות ניטרליות בנושאי ערכים, מדיניות וסגנון הנהגה.</p>
          </section>

          <section className="about-section">
            <h3 className="about-section-title">מתודולוגיה</h3>
            <div className="about-method-row">
              <div className="about-method-block about-method-declared">
                <span className="about-method-pct">35%</span>
                <span className="about-method-label">מצע מוצהר</span>
                <span className="about-method-sub">מה המפלגה מבטיחה</span>
              </div>
              <div className="about-method-block about-method-actual">
                <span className="about-method-pct">65%</span>
                <span className="about-method-label">מעשים בפועל</span>
                <span className="about-method-sub">איך הצביעה והתנהלה</span>
              </div>
            </div>
            <p style={{ marginTop: 12 }}>נושאים שסימנת כחשובים לך מקבלים <strong>משקל כפול</strong> בחישוב הסופי.</p>
          </section>

          <section className="about-section">
            <h3 className="about-section-title">מקורות הנתונים</h3>
            <ul className="about-sources">
              <li>מצעי המפלגות (אתרים רשמיים, 2025–2026)</li>
              <li>הצבעות כנסות 20–24 — מאגר הכנסת הפתוח (API רשמי, ~22,000 הצבעות)</li>
              <li>מצעי המפלגות ועמדותיהן בכנסת ה-25 — ניתוח ידני ועיתונאי</li>
              <li>דוחות מרכז המידע והמחקר של הכנסת</li>
              <li>ניתוחי המכון הישראלי לדמוקרטיה</li>
              <li>כתבות עיתונאיות מתועדות על מדיניות בפועל</li>
            </ul>
          </section>

          <section className="about-section">
            <h3 className="about-section-title">מגבלות חשובות</h3>
            <ul className="about-sources">
              <li>הנתונים מבוססים על שיקול דעת — ויתכנו טעויות</li>
              <li>מפלגות חדשות (ביחד, ישר) מוערכות בחסר בשל היסטוריה מוגבלת</li>
              <li>הכלי אינו מחליף קריאה עצמאית של המצעים</li>
              <li>הנתונים עודכנו לאחרונה: יולי 2026</li>
            </ul>
          </section>

          <section className="about-section">
            <h3 className="about-section-title">שאלות על הנתונים?</h3>
            <p>כל הנתונים פתוחים לעיון בקוד המקור של הפרויקט.</p>
          </section>

          <section className="about-section about-disclaimer">
            <h3 className="about-section-title">כתב ויתור</h3>
            <p>
              הכלי מוצע כשירות חינמי למטרות אינפורמטיביות בלבד ואינו מהווה ייעוץ פוליטי, משפטי או אחר מכל סוג שהוא.
            </p>
            <p>
              הנתונים, הציונים והתוצאות מבוססים על שיקול דעת סובייקטיבי של היוצר ועל מקורות ציבוריים — ועלולים להכיל אי-דיוקים, שגיאות או פרשנויות שנויות במחלוקת. אין לראות בהם עובדה מוחלטת.
            </p>
            <p>
              היוצר אינו אחראי לכל נזק ישיר, עקיף, מקרי או תוצאתי הנובע מהסתמכות על תוצאות הכלי, לרבות החלטות הצבעה. האחריות על בחירת המפלגה היא של המשתמש בלבד.
            </p>
            <p>
              אין לכלי זה כל שיוך, מימון, תמיכה או קשר רשמי לאיזושהי מפלגה, תנועה פוליטית, גוף ממשלתי או ארגון חיצוני.
            </p>
          </section>

        </div>

        <div style={{ padding: '0 20px 24px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
}
