#!/usr/bin/env node
// Reads רשימת_יעדים_להפצה.csv and reports what needs action today:
// overdue follow-ups on contacts already reached, and not-yet-sent targets
// whose wave has opened. For each, drafts ready-to-send email text using the
// templates from pipeline_הפצה_לעיתונאים_וארגונים.md, written to
// outreach-drafts.md for review (nothing is sent automatically).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'רשימת_יעדים_להפצה.csv');
const OUT_PATH = path.join(ROOT, 'outreach-drafts.md');

const CONTACT_URL = 'matzpen-bchirot.vercel.app';
const SIGNATURE = 'תודה,\nעומרי נובק\nomri.novak@gmail.com';

// Wave windows from the pipeline doc (dates as of 2026 election cycle).
const WAVE_OPENS = {
  1: new Date(2026, 7, 8),   // 08.08
  2: new Date(2026, 7, 20),  // 20.8
  3: new Date(2026, 8, 15),  // אמצע ספטמבר
  4: new Date(2026, 9, 7),   // 7.10
};

// Lenient CSV parser: a field is only "quoted" if it starts with a `"`.
// A `"` appearing mid-field (as in the malformed 'ת"א' cell in this file) is
// then just a literal character, not a quote toggle — this tolerates the
// unescaped quotes already present in the source data without corrupting
// the rest of the parse.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let fieldStarted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else if (text[i + 1] === ',' || text[i + 1] === '\n' || text[i + 1] === '\r' || i + 1 === text.length) {
          inQuotes = false;
        } else field += c; // stray quote mid-field: keep literally
      } else field += c;
    } else if (!fieldStarted && c === '"') { inQuotes = true; fieldStarted = true; }
    else if (c === ',') { row.push(field); field = ''; fieldStarted = false; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; fieldStarted = false; }
    else if (c === '\r') { /* skip */ }
    else { field += c; fieldStarted = true; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

function parseDate(s) {
  if (!s || !s.trim()) return null;
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

function daysBetween(a, b) {
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

const TEMPLATES = {
  press: {
    subject: 'כלי דאטה חדש למצפן הבחירות — מבוסס הצבעות בפועל בכנסת, לא רק מצעים',
    body: (org) => `שלום,

אני עומרי נובק, בן 23 מתל אביב. בניתי כלי בשם "מצפן הבחירות" (${CONTACT_URL}) — שאלון ניטרלי וחינמי שמתאים משתמשים למפלגות לקראת הבחירות ב-27.10.2026.

ההבדל מהמצפנים הקיימים: 65% מהציון של כל מפלגה מבוסס על ניתוח של כ-22,000 הצבעות אמיתיות בכנסת (מ-API הפתוח של הכנסת), ולא רק על הצהרות ומצעים. כל המתודולוגיה גלויה בכלי עצמו, אין שרת ואין איסוף מידע אישי, ואין לכלי כל זיקה מפלגתית או מסחרית.

מצרף one-pager קצר. אשמח לשתף עוד פרטים או לענות על שאלות אם זה מעניין לכתבה ${org ? `ב${org}` : ''}.

${SIGNATURE}`,
  },
  civic: {
    subject: 'כלי חינמי וניטרלי לעידוד הצבעה מודעת — הצעה לשיתוף עם הקהל שלכם',
    body: (org) => `שלום,

אני עומרי נובק, בן 23 מתל אביב. בניתי כלי בשם "מצפן הבחירות" (${CONTACT_URL}) — שאלון ניטרלי וחינמי שעוזר למשתמש להבין לאיזו מפלגה הוא הכי קרוב לקראת הבחירות ב-27.10.2026, תוך כ-5-7 דקות.

הכלי משקלל הצהרות מפלגתיות עם הצבעות בפועל בכנסת, כדי לתת תמונה מהימנה יותר. אין לו זיקה מפלגתית או מסחרית, הוא רץ כולו בדפדפן בלי איסוף מידע אישי, וכל המתודולוגיה גלויה בתוך הכלי.

חשבתי שזה יכול להתאים לקהל שאתם עובדים איתו ${org ? `ב${org}` : ''} — [להתאים: ראשוני מצביעים / קהל מתלבט / וכו']. מצרף one-pager קצר. אשמח אם תרצו לבחון שיתוף או קישור אליו.

${SIGNATURE}`,
  },
  youth: {
    subject: 'כלי הכנה לקלפי הראשונה — מצפן בחירות ניטרלי לחניכים/ות שמצביעים לראשונה',
    body: () => `שלום,

אני עומרי נובק, בן 23 מתל אביב. בניתי כלי בשם "מצפן הבחירות" (${CONTACT_URL}) — שאלון ניטרלי וחינמי, שלוקח כ-5-7 דקות, ומראה למשתמש לאיזו מפלגה הוא הכי קרוב לקראת הבחירות ב-27.10.2026.

חשבתי עליכם כי חלק ניכר מהחניכים/ות שלכם יצביעו לראשונה בחייהם בדיוק בבחירות האלה. הכלי לא מפלגתי ולא מסחרי, שקוף לגמרי לגבי המתודולוגיה (משלב הצהרות מפלגתיות עם הצבעות בפועל בכנסת), ורץ כולו בדפדפן בלי איסוף מידע אישי — כך שאפשר להשתמש בו בבטחה כבסיס לדיון קבוצתי או שיעור אזרחות, לא כתעמולה.

מצרף one-pager קצר. אשמח אם תרצו לשלב אותו בפעילות, או סתם להעביר לחניכים/ות לפני הקלפי.

${SIGNATURE}`,
  },
};

function pickTemplate(category) {
  if (category.includes('עיתונות') || category.includes('ביקורת תקשורת')) return TEMPLATES.press;
  if (category.includes('נוער') || category.includes('תלמידים')) return TEMPLATES.youth;
  return TEMPLATES.civic;
}

function followUpDraft(name, org, sentDate, today) {
  const weeks = Math.max(1, Math.round(daysBetween(today, sentDate) / 7));
  return `שלום,

לפני כ-${weeks} שבועות שלחתי מייל לגבי "מצפן הבחירות" (${CONTACT_URL}) — כלי ניטרלי וחינמי לקראת הבחירות ב-27.10.2026. מצרף שוב בקצרה, למקרה שהמייל הקודם הלך לאיבוד. אשמח לכל תגובה, גם שלילית.

${SIGNATURE}`;
}

const raw = readFileSync(CSV_PATH, 'utf-8');
const rows = parseCsv(raw);
const header = rows[0];
const records = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));

const today = new Date();
today.setHours(0, 0, 0, 0);

const overdue = [];
const readyToSend = [];
const upcoming = [];
const waiting = [];

for (const rec of records) {
  const status = rec['סטטוס'].trim();
  const wave = parseInt(rec['גל הפצה'], 10) || 1;
  const followUpDate = parseDate(rec['תאריך מעקב']);
  const sentDate = parseDate(rec['תאריך פנייה']);

  if (status.startsWith('נשלח')) {
    if (followUpDate && followUpDate <= today) {
      overdue.push({ rec, daysLate: daysBetween(today, followUpDate), sentDate });
    } else if (followUpDate) {
      waiting.push({ rec, dueIn: daysBetween(followUpDate, today) });
    }
  } else if (status === 'לא נשלח') {
    const opensAt = WAVE_OPENS[wave] ?? today;
    if (opensAt <= today) readyToSend.push({ rec, wave });
    else upcoming.push({ rec, wave, opensAt });
  }
}

let out = `# סטטוס פייפליין הפצה — ${today.toLocaleDateString('he-IL')}\n\n`;

out += `## 🔴 מעקב באיחור (${overdue.length})\n`;
if (overdue.length === 0) out += 'אין.\n\n';
else {
  for (const { rec, daysLate } of overdue) {
    out += `- **${rec['שם הגורם']}** (${rec['קטגוריה']}) — ${daysLate} ימים אחרי תאריך המעקב. כתובת: ${rec['כתובת ליצירת קשר']}\n`;
  }
  out += '\n';
}

out += `## 🟡 מוכן לשליחה ראשונית — גל פתוח, טרם נשלח (${readyToSend.length})\n`;
if (readyToSend.length === 0) out += 'אין.\n\n';
else {
  for (const { rec, wave } of readyToSend) {
    out += `- **${rec['שם הגורם']}** (${rec['קטגוריה']}, גל ${wave}) — כתובת: ${rec['כתובת ליצירת קשר']}\n`;
  }
  out += '\n';
}

out += `## ⚪ בהמתנה לתשובה, טרם הגיע מועד מעקב (${waiting.length})\n`;
for (const { rec, dueIn } of waiting) {
  out += `- ${rec['שם הגורם']} — מעקב בעוד ${dueIn} ימים\n`;
}
out += '\n';

out += `## 🔵 גל עתידי, טרם נפתח (${upcoming.length})\n`;
for (const { rec, wave, opensAt } of upcoming) {
  out += `- ${rec['שם הגורם']} (גל ${wave}, נפתח ${opensAt.toLocaleDateString('he-IL')})\n`;
}
out += '\n';

if (overdue.length || readyToSend.length) {
  out += `---\n\n# טיוטות מיילים\n\n`;

  for (const { rec, sentDate } of overdue) {
    out += `## תזכורת — ${rec['שם הגורם']}\n`;
    out += `**אל:** ${rec['כתובת ליצירת קשר']}\n**נושא:** תזכורת — מצפן הבחירות\n\n`;
    out += '```\n' + followUpDraft(rec['שם הגורם'], rec['קטגוריה'], sentDate, today) + '\n```\n\n';
  }

  for (const { rec } of readyToSend) {
    const t = pickTemplate(rec['קטגוריה']);
    out += `## פנייה ראשונית — ${rec['שם הגורם']}\n`;
    out += `**אל:** ${rec['כתובת ליצירת קשר']}\n**נושא:** ${t.subject}\n`;
    out += `**זווית מותאמת (מהקובץ):** ${rec['זווית מותאמת']}\n\n`;
    out += '```\n' + t.body(rec['שם הגורם']) + '\n```\n\n';
  }
}

writeFileSync(OUT_PATH, out, 'utf-8');
console.log(out);
console.log(`\nנשמר גם לקובץ: ${path.relative(ROOT, OUT_PATH)}`);
