# מצפן הבחירות — Election Compass

שאלון אידאולוגי ניטרלי שמראה לאיזו מפלגה אתה הכי קרוב — על סמך ערכים, מדיניות וסגנון הנהגה.

## הרצה מקומית

```bash
npm install
npm run dev
```

הפרויקט ירוץ על `http://localhost:5173/election-compass/`

## Build

```bash
npm run build
```

הפלט נוצר בתיקיית `dist/` — אתר סטטי מוכן להעלאה.

## פרסום ב-GitHub Pages

### אוטומטי (מומלץ)

1. דחוף את הקוד ל-GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/election-compass.git
   git push -u origin main
   ```

2. ב-GitHub, לך ל-**Settings → Pages → Source** ובחר **GitHub Actions**.

3. כל push ל-`main` יפרסם אוטומטית את האתר.

## מבנה הפרויקט

```
src/
  data/
    questions.json    # 32 שאלות ב-3 שכבות
    parties.json      # 10 מפלגות עם פרופילים רב-ממדיים
  utils/
    matching.ts       # אלגוריתם ההתאמה
  components/
    Welcome.tsx       # מסך פתיחה
    Questionnaire.tsx # שאלון
    Priorities.tsx    # תעדוף נושאים
    Loading.tsx       # מסך טעינה
    Results.tsx       # תוצאות + פירוט + שקיפות
  App.tsx             # ניהול מסכים
```

## טכנולוגיה

- React + TypeScript + Vite
- אתר סטטי — ללא backend, ללא database
- כל החישוב רץ בדפדפן
- Mobile-first (375px)
