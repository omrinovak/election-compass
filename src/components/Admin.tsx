import { useState } from 'react';
import partiesData from '../data/parties.json';

type PartyId = string;
type AxisKey = string;

interface EditState {
  partyId: PartyId;
  axis: AxisKey;
  field: 'declared' | 'actual' | 'confidence';
  currentValue: number;
}

const AXIS_LABELS: Record<string, string> = {
  security_civil_liberties: 'ביטחון vs. חירויות אזרח',
  state_religion: 'מדינה ודת',
  economic_left_right: 'שמאל-ימין כלכלי',
  welfare_state: 'מדינת רווחה',
  judicial_power: 'כוח שיפוטי',
  executive_oversight: 'פיקוח על הרשות המבצעת',
  peace_process: 'תהליך השלום',
  settlements: 'התנחלויות',
  two_state_solution: 'פתרון שתי מדינות',
  minority_rights: 'זכויות מיעוטים',
  lgbtq_rights: 'זכויות להט"ב',
  housing_urban: 'דיור ועיר',
  environment_climate: 'סביבה ואקלים',
  education_policy: 'מדיניות חינוך',
  foreign_policy: 'מדיניות חוץ',
  electoral_reform: 'רפורמה בבחירות',
  anti_corruption: 'מאבק בשחיתות',
  police_reform: 'רפורמת משטרה',
  haredim_military: 'חרדים וצבא',
  national_identity: 'זהות לאומית',
  coalition_flexibility: 'גמישות קואליציונית',
  consensus_vs_decisive: 'קונסנזוס vs. החלטיות',
  transparency: 'שקיפות',
};

const PASSWORD = 'admin2024';

export default function Admin({ onClose }: { onClose: () => void }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PartyId | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editValue, setEditValue] = useState('');
  const [parties, setParties] = useState<Record<string, any>>(partiesData as Record<string, any>);
  const [saved, setSaved] = useState(false);

  function handleLogin() {
    if (passwordInput === PASSWORD) {
      setAuthenticated(true);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 1500);
    }
  }

  function startEdit(partyId: PartyId, axis: AxisKey, field: 'declared' | 'actual' | 'confidence') {
    const party = parties[partyId];
    const current = party[field][axis] ?? 0;
    setEditState({ partyId, axis, field, currentValue: current });
    setEditValue(String(current));
  }

  function applyEdit() {
    if (!editState) return;
    const num = parseFloat(editValue);
    if (isNaN(num)) return;

    const clamped = editState.field === 'confidence' ? Math.min(1, Math.max(0, num)) : Math.min(7, Math.max(1, num));

    setParties(prev => ({
      ...prev,
      [editState.partyId]: {
        ...prev[editState.partyId],
        [editState.field]: {
          ...prev[editState.partyId][editState.field],
          [editState.axis]: clamped,
        },
      },
    }));
    setEditState(null);
    setSaved(false);
  }

  function exportJSON() {
    const json = JSON.stringify(parties, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parties-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🔐</div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>פאנל ניהול</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>לעדכון נתוני מפלגות בעקבות התפתחויות פוליטיות</p>
        <input
          type="password"
          value={passwordInput}
          onChange={e => setPasswordInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="סיסמה"
          style={{
            width: '100%', maxWidth: 280, padding: '12px 16px', fontSize: 16,
            border: `1px solid ${passwordError ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
            color: 'var(--text)', outline: 'none', textAlign: 'right',
            transition: 'border-color 0.2s',
          }}
          autoFocus
        />
        {passwordError && <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>סיסמה שגויה</p>}
        <button className="btn btn-primary" style={{ width: '100%', maxWidth: 280 }} onClick={handleLogin}>כניסה</button>
        <button className="btn-ghost" onClick={onClose}>← חזרה לאתר</button>
      </div>
    );
  }

  const partyList = Object.values(parties) as any[];
  const activeParty = selectedParty ? parties[selectedParty] : null;
  const axes = Object.keys(AXIS_LABELS);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="top-bar" style={{ padding: '16px 20px', justifyContent: 'space-between' }}>
        <button className="btn-ghost" onClick={onClose} style={{ padding: '8px 0' }}>← יציאה</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>🔐 ניהול נתונים</span>
        <button
          className="btn btn-primary"
          style={{ flex: 0, padding: '8px 16px', fontSize: 14 }}
          onClick={exportJSON}
        >
          {saved ? '✓ יוצא' : 'ייצוא JSON'}
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {!selectedParty ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>בחר מפלגה לעריכה:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {partyList.map(party => (
                <button
                  key={party.id}
                  className="result-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'right' }}
                  onClick={() => setSelectedParty(party.id as PartyId)}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{party.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{party.leader} · {party.seats} מנדטים</div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>←</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: 14, background: 'var(--surface-dim)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong>הוראות שימוש:</strong><br />
              1. ערוך ערכים (1-7 לעמדות, 0-1 לאמינות)<br />
              2. לחץ "ייצוא JSON"<br />
              3. החלף את קובץ <code>src/data/parties.json</code> בפרויקט<br />
              4. עשה commit ו-push — האתר יתעדכן אוטומטית
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button className="btn-ghost" onClick={() => setSelectedParty(null)} style={{ padding: '8px 0' }}>→ חזרה</button>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{activeParty.name}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{activeParty.seats} מנדטים</span>
            </div>

            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--accent)' }}>
              עמדות: 1-7 · אמינות: 0-1 (ביטחון: {'>'}0.4 = פעיל)
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>ציר</th>
                    <th style={{ textAlign: 'center', padding: '8px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>הצהרה</th>
                    <th style={{ textAlign: 'center', padding: '8px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>מעשה</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>ביטחון</th>
                  </tr>
                </thead>
                <tbody>
                  {axes.map(axis => {
                    const declared = activeParty.declared[axis];
                    const actual = activeParty.actual[axis];
                    const confidence = activeParty.confidence[axis];
                    const isLowConf = confidence !== undefined && confidence < 0.4;

                    return (
                      <tr key={axis} style={{
                        borderBottom: '1px solid var(--border)',
                        opacity: isLowConf ? 0.5 : 1,
                      }}>
                        <td style={{ padding: '10px 4px', fontSize: 12, maxWidth: 120, lineHeight: 1.3 }}>
                          {AXIS_LABELS[axis] || axis}
                          {isLowConf && <span style={{ color: 'var(--warning)', marginRight: 4 }}>⚠</span>}
                        </td>
                        <EditCell
                          value={declared}
                          isEditing={editState?.partyId === selectedParty && editState.axis === axis && editState.field === 'declared'}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          onStart={() => startEdit(selectedParty, axis, 'declared')}
                          onApply={applyEdit}
                          onCancel={() => setEditState(null)}
                        />
                        <EditCell
                          value={actual}
                          isEditing={editState?.partyId === selectedParty && editState.axis === axis && editState.field === 'actual'}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          onStart={() => startEdit(selectedParty, axis, 'actual')}
                          onApply={applyEdit}
                          onCancel={() => setEditState(null)}
                        />
                        <EditCell
                          value={confidence}
                          isEditing={editState?.partyId === selectedParty && editState.axis === axis && editState.field === 'confidence'}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          onStart={() => startEdit(selectedParty, axis, 'confidence')}
                          onApply={applyEdit}
                          onCancel={() => setEditState(null)}
                          isConfidence
                        />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditCell({ value, isEditing, editValue, onEditValueChange, onStart, onApply, onCancel, isConfidence }: {
  value: number | undefined;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (v: string) => void;
  onStart: () => void;
  onApply: () => void;
  onCancel: () => void;
  isConfidence?: boolean;
}) {
  const display = value !== undefined ? (isConfidence ? value.toFixed(2) : value) : '—';
  const bgColor = isConfidence && value !== undefined
    ? value >= 0.4 ? 'var(--success-light)' : 'var(--danger-light)'
    : 'transparent';

  if (isEditing) {
    return (
      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
        <input
          type="number"
          value={editValue}
          onChange={e => onEditValueChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onApply(); if (e.key === 'Escape') onCancel(); }}
          step={isConfidence ? 0.05 : 0.5}
          min={isConfidence ? 0 : 1}
          max={isConfidence ? 1 : 7}
          style={{
            width: 56, textAlign: 'center', padding: '4px', fontSize: 13,
            border: '2px solid var(--accent)', borderRadius: 6,
            background: 'var(--surface)', color: 'var(--text)', outline: 'none',
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
          <button onClick={onApply} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--accent)', color: 'white', borderRadius: 4 }}>✓</button>
          <button onClick={onCancel} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface-dim)', color: 'var(--text-muted)', borderRadius: 4 }}>✕</button>
        </div>
      </td>
    );
  }

  return (
    <td
      style={{ padding: '10px 8px', textAlign: 'center', cursor: 'pointer', background: bgColor, borderRadius: 4 }}
      onClick={onStart}
    >
      <span style={{ fontSize: 13, fontWeight: 500 }}>{String(display)}</span>
    </td>
  );
}
