import { useState } from 'react';
import type { PendingTrade } from '../../hooks/usePendingTrade';

const EMOTIONS = ['Patient', 'Calm', 'Confident', 'FOMO', 'Anxious', 'Revenge', 'Disciplined'];

export interface ShareTradeFormData {
  narrative: string;
  emotions: string[];
  lesson: string;
  isPublic: boolean;
}

interface Props {
  trade: PendingTrade;
  onClose: () => void;
  onPublish: (data: ShareTradeFormData) => void;
}

export default function ShareTradeModal({ trade, onClose, onPublish }: Props) {
  const [narrative, setNarrative] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [lesson, setLesson] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const pnlStr = trade.net_profit >= 0 ? `+$${trade.net_profit.toFixed(2)}` : `-$${Math.abs(trade.net_profit).toFixed(2)}`;
  const closedMs = Date.now() - new Date(trade.close_time).getTime();
  const detectedMinsAgo = Math.round(closedMs / 60000);
  const timeLabel = detectedMinsAgo < 1
    ? 'just now'
    : detectedMinsAgo < 60
      ? `${detectedMinsAgo} min ago`
      : (() => {
          const h = Math.floor(detectedMinsAgo / 60);
          const m = detectedMinsAgo % 60;
          return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
        })();

  function toggleEmotion(e: string) {
    setSelectedEmotions(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  }

  function handlePublish(pub: boolean) {
    onPublish({ narrative, emotions: selectedEmotions, lesson, isPublic: pub });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Share this trade</span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--surface2)', border: 'none',
              color: 'var(--text3)', fontSize: 18, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '16px 20px 24px' }}>
          {/* Detected banner */}
          <div style={{
            background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 16,
          }}>
            <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', position: 'absolute', top: 0, left: 0 }} />
              <div className="ping-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', position: 'absolute', top: 0, left: 0 }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{trade.symbol}</span>
              {' · '}{trade.direction} detected from MetaTrader 5 · closed {timeLabel}
            </span>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'P&L',    value: pnlStr,                              color: trade.net_profit >= 0 ? '#22c55e' : 'var(--red)' },
              { label: 'ENTRY',  value: trade.entry_price.toFixed(4),        color: 'var(--text)' },
              { label: 'EXIT',   value: trade.exit_price.toFixed(4),         color: 'var(--text)' },
              { label: 'R MULT', value: `${trade.r_multiple}R`,              color: 'var(--blue)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Source badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)',
            }}>✓ MT5 verified</span>
          </div>

          {/* Narrative */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
              Your narrative (what was your thesis?)
            </label>
            <textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              placeholder="e.g. Clean breakout above key resistance with volume confirmation…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px',
                fontSize: 13, color: 'var(--text)', resize: 'none', outline: 'none',
                fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7F77DD'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Emotion chips */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 8 }}>
              Emotion tag
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EMOTIONS.map(emotion => {
                const selected = selectedEmotions.includes(emotion);
                return (
                  <button
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    style={{
                      padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: selected ? '1.5px solid #7F77DD' : '1px solid var(--border)',
                      background: selected ? '#534AB7' : 'var(--surface2)',
                      color: selected ? '#fff' : 'var(--text3)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lesson */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
              One lesson from this trade
            </label>
            <textarea
              value={lesson}
              onChange={e => setLesson(e.target.value)}
              placeholder="e.g. Wait for the retest — entry quality matters more than entry speed…"
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px',
                fontSize: 13, color: 'var(--text)', resize: 'none', outline: 'none',
                fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7F77DD'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 16, borderTop: '1px solid var(--border)',
            gap: 12,
          }}>
            {/* Privacy toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setIsPublic(p => !p)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: isPublic ? '#534AB7' : 'var(--surface3)',
                  border: 'none', position: 'relative', cursor: 'pointer',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: '#e8e8e8',
                  position: 'absolute', top: 3,
                  left: isPublic ? 19 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }} />
              </button>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {isPublic ? 'Public post' : 'Private'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handlePublish(false)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 14px',
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--text3)', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Save private
              </button>
              <button
                onClick={() => handlePublish(true)}
                style={{
                  background: '#534AB7',
                  border: 'none',
                  borderRadius: 8, padding: '8px 18px',
                  fontSize: 12, fontWeight: 700,
                  color: '#fff', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Publish to feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
