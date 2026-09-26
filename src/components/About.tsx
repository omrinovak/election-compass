import { useState } from 'react';
import '../App.css';

type SectionKey = 'methodology' | 'sources' | 'limits' | 'disclaimer';

// Rendered as a list below AND counted in the accordion subtitle above it — deriving the count
// from this array's length (instead of a separately hand-typed number) is what keeps the two in
// sync; a hardcoded subtitle count next to a hand-edited list is exactly the class of bug that
// went stale once already (see .claude/agents/data-integrity-guardian.md).
const DATA_SOURCES = [
  'מצעי המפלגות (אתרים רשמיים, 2025–2026)',
  'הצבעות נבחרות מכנסת 25 — נמשכו ואומתו ישירות מ-API הכנסת הפתוח',
  'מצעי המפלגות ועמדותיהן בכנסת ה-25 — ניתוח ידני ועיתונאי',
  'דוחות מרכז המידע והמחקר של הכנסת',
  'ניתוחי המכון הישראלי לדמוקרטיה',
  'כתבות עיתונאיות מתועדות על מדיניות בפועל',
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`about-accordion-chevron${open ? ' open' : ''}`}
      width="16" height="16" viewBox="0 0 24 24" fill="none"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M7 7h10M4 7l3-4 3 4-3 5-3-5zM14 7l3-4 3 4-3 5-3-5zM6 21h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 10v4.5M12 17.2v.1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function AccordionSection({
  id, icon, title, subtitle, open, onToggle, children,
}: {
  id: SectionKey;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="about-accordion">
      <button
        type="button"
        className="about-accordion-header"
        aria-expanded={open}
        aria-controls={`about-panel-${id}`}
        onClick={() => onToggle(id)}
      >
        <span className="about-accordion-icon">{icon}</span>
        <span className="about-accordion-title-wrap">
          <span className="about-accordion-title">{title}</span>
          {subtitle && <span className="about-accordion-subtitle">{subtitle}</span>}
        </span>
        <ChevronIcon open={open} />
      </button>
      <div className={`about-accordion-body-wrap${open ? ' open' : ''}`} id={`about-panel-${id}`}>
        <div className="about-accordion-body-inner">
          <div className="about-accordion-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function About({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    methodology: false,
    sources: false,
    limits: false,
    disclaimer: false,
  });

  const toggle = (id: SectionKey) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

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
            <p>מצפן הבחירות מחשב כמה כל מפלגה קרובה לעמדותיך — על סמך שאלות ניטרליות בנושאי ערכים, מדיניות וסגנון הנהגה. החישוב לא נעצר ברמת המפלגה: לכל מפלגה נחקרים גם המועמדים בפועל ברשימה שלה, כדי שהציון ישקף לא רק מצע על נייר אלא גם את האנשים שיישבו בכנסת.</p>
          </section>

          {/* Scannable headline numbers — the "too long, didn't read" version of the methodology */}
          <section className="about-section">
            <div className="about-method-row">
              <div className="about-method-block about-method-declared">
                <span className="about-method-pct">35%</span>
                <span className="about-method-label">מצע מוצהר</span>
                <span className="about-method-sub">הבטחות ומצע</span>
              </div>
              <div className="about-method-block about-method-actual">
                <span className="about-method-pct">65%</span>
                <span className="about-method-label">מעשים בפועל</span>
                <span className="about-method-sub">הצבעות בכנסת</span>
              </div>
            </div>
            <div className="about-method-row">
              <div className="about-method-block about-method-declared">
                <span className="about-method-pct">75%</span>
                <span className="about-method-label">מצע וסיעה</span>
                <span className="about-method-sub">ציון המפלגה</span>
              </div>
              <div className="about-method-block about-method-actual">
                <span className="about-method-pct">25%</span>
                <span className="about-method-label">מועמדים</span>
                <span className="about-method-sub">כשיש עליהם מידע</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>נושאים שסימנת כחשובים לך מקבלים משקל כפול. ההסבר המלא — למטה.</p>
          </section>

          <AccordionSection
            id="methodology"
            icon={<ScaleIcon />}
            title="מתודולוגיה — איך מחושב הציון"
            subtitle="ההסבר המלא לשלבי החישוב"
            open={open.methodology}
            onToggle={toggle}
          >
            <p>החישוב נבנה בשני שלבים נפרדים שמתחברים בסוף לציון אחד: קודם ציון לרמת המפלגה, אחר כך ציון לכל מועמד/ת שנחקר/ה ברשימה שלה, ולבסוף שילוב של השניים.</p>

            <p className="about-subtitle">1. ציון המפלגה: מצע מול מעשים</p>
            <p>35% מהציון מבוסס על המצע המוצהר (מה המפלגה מבטיחה), ו-65% על מעשים בפועל — איך הצביעה והתנהלה בכנסת. המעשים בפועל מקבלים משקל גבוה יותר, כי הצבעות אמיתיות בכנסת מלמדות יותר על התנהלות אמיתית מאשר הבטחות בעלון בחירות.</p>

            <p className="about-subtitle">2. ציון המועמדים: האנשים ברשימה</p>
            <p>לכל מועמד/ת שנחקר/ה נבנה ציון אישי נפרד, באותו יחס משקלים — 35% הצהרות אישיות (ראיונות, נאומים, ציטוטים מתועדים) ו-65% הצבעות אישיות בכנסת, כשקיימות. בפועל, אצל רוב המועמדים עדיין לא נאספו הצבעות אישיות (להבדיל מהצבעת הסיעה כמקשה אחת), כך שהציון שלהם מבוסס כרגע בעיקר על הצהרות. ציון אישי מוצג רק כשנאסף עליו/ה מספיק מידע מבוסס (לפחות ארבעה צירי ערכים/מדיניות עם מקור); אחרת לא מוצג ציון כלל, כדי לא ליצור רושם מדויק כביכול על סמך ראיות דלות — למשל אצל מועמד/ת חדש/ה בפוליטיקה.</p>

            <p className="about-subtitle">3. שילוב לציון הכולל של המפלגה</p>
            <p>כאשר יש ציון אישי לפחות למועמד/ת אחד/ת ברשימה, 25% מהציון הכולל של המפלגה נגזר מציוני המועמדים עצמם — כשמועמדים גבוהים יותר ברשימה (למשל מקום 1) משפיעים יותר על הממוצע מאשר מועמדים נמוכים (למשל מקום 40), משום שסיכוי הכניסה שלהם לכנסת גבוה יותר. כשעדיין אין מספיק מידע אישי על אף מועמד/ת ברשימה, הציון הכולל מבוסס כולו (100%) על המצע וההצבעות של הסיעה, עד שייאסף מידע מספק.</p>

            <p>בנוסף לכל זה, נושאים שסימנת כחשובים לך מקבלים <strong>משקל כפול</strong> בחישוב ההתאמה שלך לכל מפלגה ומועמד/ת.</p>
          </AccordionSection>

          <AccordionSection
            id="sources"
            icon={<DatabaseIcon />}
            title="מקורות הנתונים"
            subtitle={`${DATA_SOURCES.length} מקורות, כולל API רשמי של הכנסת`}
            open={open.sources}
            onToggle={toggle}
          >
            <ul className="about-sources">
              {DATA_SOURCES.map((source) => <li key={source}>{source}</li>)}
            </ul>
          </AccordionSection>

          <AccordionSection
            id="limits"
            icon={<AlertIcon />}
            title="מגבלות חשובות"
            subtitle="מה כדאי לדעת לפני שסומכים על הציון"
            open={open.limits}
            onToggle={toggle}
          >
            <ul className="about-sources">
              <li>הנתונים מבוססים על שיקול דעת — ויתכנו טעויות</li>
              <li>מפלגות חדשות (ביחד, ישר, עמך ישראל) מוערכות בחסר בשל היסטוריה מוגבלת</li>
              <li>הכלי אינו מחליף קריאה עצמאית של המצעים</li>
              <li>הבחירות לכנסת ה-26 נקבעו ל-27 באוקטובר 2026</li>
              <li>הנתונים עודכנו לאחרונה: ספטמבר 2026</li>
            </ul>
          </AccordionSection>

          <section className="about-section">
            <h3 className="about-section-title">שאלות על הנתונים?</h3>
            <p>כל הנתונים פתוחים לעיון בקוד המקור של הפרויקט.</p>
          </section>

          <AccordionSection
            id="disclaimer"
            icon={<FileTextIcon />}
            title="כתב ויתור"
            subtitle="מידע משפטי"
            open={open.disclaimer}
            onToggle={toggle}
          >
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
              אין לכלי זה כל שיוך, מימון, תמיכה או קשר רשמי לאיזושהי מפלגה, תנועה פוליטית, גוף ממשלתי או ארגון חיצוני. זוהי יוזמה עצמאית וללא מטרות רווח.
            </p>
            <p>
              פיצ'ר שליחת התוצאות במייל פועל כולו בדפדפן שלכם: הכתובת שאתם מקלידים משמשת רק כדי לפתוח את תוכנת המייל שלכם עם המייל מוכן, והיא עצמה אף פעם לא נשלחת אלינו או נשמרת בשום שרת. כמו כל אתר, נעשה כאן שימוש בכלי אנליטיקס בסיסי (עמודים נצפים, לא זהות המשתמש) לצורך הבנת השימוש באתר.
            </p>
          </AccordionSection>

        </div>

        <div style={{ padding: '0 20px 24px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
}
