import { useRef, useState } from 'react';
import { QUESTIONNAIRE_URL } from '../utils/site';
import '../App.css';

const SHARE_TEXT = 'מצפן הבחירות — שאלון ניטרלי וכנה שעוזר לך למצוא לאיזו מפלגה אתה הכי קרוב, בלי סיסמאות ובלי הטיה';

function trackShare(method: string) {
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track('welcome_share_clicked', { method });
  }
}

export default function ShareMenu({ onClose }: { onClose: () => void }) {
  const [toast, setToast] = useState<string | null>(null);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const manualCopyInputRef = useRef<HTMLInputElement>(null);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const shareBody = `${SHARE_TEXT}\n${QUESTIONNAIRE_URL}`;

  // When the native share button is shown, the per-platform buttons are a secondary fallback and
  // get shrunk down together so a future addition/removal of one doesn't drift from its siblings.
  function optionClass(variant: string): string {
    return `share-menu-option share-menu-option-${variant}${canNativeShare ? ' share-menu-option-compact' : ''}`;
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  // navigator.clipboard.writeText throws on a denied permission, a non-secure context, or an
  // unsupported browser — most likely exactly inside Instagram/Facebook's in-app browser, which
  // also frequently no-ops window.prompt()/alert()/confirm() (no WKUIDelegate wired up for JS
  // dialogs), so a prompt() fallback would leave the user with nothing. A persistent, always-DOM
  // readonly input works everywhere: the user can still select-and-copy it with the OS's native
  // text selection, no JS clipboard permission or dialog support required.
  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function revealManualCopy() {
    setShowManualCopy(true);
    setTimeout(() => {
      manualCopyInputRef.current?.focus();
      manualCopyInputRef.current?.select();
    }, 0);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: 'מצפן הבחירות', text: SHARE_TEXT, url: QUESTIONNAIRE_URL });
      trackShare('native');
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  }

  async function handleCopy() {
    const copied = await copyToClipboard(shareBody);
    if (copied) {
      showToast('✓ הקישור הועתק ללוח');
    } else {
      revealManualCopy();
    }
    trackShare('copy');
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareBody)}`, '_blank', 'noopener,noreferrer');
    trackShare('whatsapp');
  }

  function handleFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(QUESTIONNAIRE_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    trackShare('facebook');
  }

  // Instagram has no web share-intent that accepts a prefilled link (unlike WhatsApp/Facebook),
  // so the fallback is: hand off to Instagram and copy the link for the user to paste into a
  // story, bio, or DM themselves. window.open() runs first and synchronously (before any await)
  // so it still counts as a direct response to the click — Safari drops "user activation" across
  // an awaited clipboard write and would otherwise silently block the popup.
  function handleInstagram() {
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    trackShare('instagram');
    copyToClipboard(shareBody).then((copied) => {
      if (copied) {
        showToast('✓ הקישור הועתק — הדביקו אותו בסטורי, בביו או בהודעה באינסטגרם');
      } else {
        revealManualCopy();
      }
    });
  }

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="about-handle" />

        <div className="about-header">
          <h2 className="about-title">שתפו את מצפן הבחירות</h2>
          <button className="about-close" onClick={onClose} aria-label="סגור">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="share-menu-body">
          <p className="share-menu-intro">כל שיתוף עוזר לעוד מישהו למצוא את המפלגה שמייצגת אותו</p>

          {canNativeShare && (
            <>
              <button className="btn btn-primary share-menu-native" onClick={handleNativeShare}>
                📤 שיתוף מהמכשיר
              </button>
              <p className="share-menu-native-hint">
                מומלץ — פותח את תפריט השיתוף של המכשיר, כולל שליחה ישירה בהודעה באינסטגרם או במסנג'ר
              </p>
              <p className="share-menu-divider">או שתפו ישירות ל:</p>
            </>
          )}

          <button className={optionClass('wa')} onClick={handleWhatsApp}>
            💬 וואטסאפ
          </button>
          <button className={optionClass('fb')} onClick={handleFacebook}>
            📘 פייסבוק
          </button>
          <button className={optionClass('ig')} onClick={handleInstagram}>
            📸 אינסטגרם
          </button>
          <button className="share-menu-option share-menu-option-copy" onClick={handleCopy}>
            🔗 העתקת קישור
          </button>

          {showManualCopy && (
            <div className="share-menu-manual">
              <p className="share-menu-manual-label">ההעתקה האוטומטית לא הצליחה — העתיקו את הקישור ידנית:</p>
              <input
                ref={manualCopyInputRef}
                className="share-menu-manual-input"
                readOnly
                value={QUESTIONNAIRE_URL}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          )}
        </div>

        {toast && <div className="share-toast">{toast}</div>}
      </div>
    </div>
  );
}
