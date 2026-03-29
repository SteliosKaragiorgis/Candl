/**
 * TickerInput — lightweight ticker search with price + change badge.
 * No chart. Used in the Post composer tab.
 */
import { useEffect, useState } from 'react';
import {
  fetchSearch,
  fetchQuote,
  useDebounce,
  type TickerMeta,
  type SearchResult,
} from './TickerChart';

interface Props {
  onConfirm: (symbol: string, meta: TickerMeta) => void;
  onClear: () => void;
}

function fmtPrice(p: number) {
  if (p >= 100) return p.toFixed(2);
  if (p >= 10)  return p.toFixed(3);
  return p.toFixed(4);
}

export default function TickerInput({ onConfirm, onClear }: Props) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [meta, setMeta] = useState<TickerMeta | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const debounced = useDebounce(input.trim().toUpperCase(), 300);

  // Search suggestions
  useEffect(() => {
    if (!debounced || confirmed) { setSuggestions([]); return; }
    let cancelled = false;
    fetchSearch(debounced)
      .then(r => { if (!cancelled) setSuggestions(r); })
      .catch(() => { if (!cancelled) setSuggestions([]); });
    return () => { cancelled = true; };
  }, [debounced, confirmed]);

  // Quote fetch
  useEffect(() => {
    if (!debounced || confirmed) return;
    let cancelled = false;
    setStatus('loading');
    fetchQuote(debounced)
      .then(q  => { if (!cancelled) { setMeta(q);  setStatus('found'); } })
      .catch(() => { if (!cancelled) { setMeta(null); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [debounced, confirmed]);

  function selectSuggestion(s: SearchResult) {
    setInput(s.symbol);
    setSuggestions([]);
    setFocused(false);
  }

  function confirm() {
    if (!meta) return;
    setConfirmed(true);
    setSuggestions([]);
    onConfirm(meta.symbol, meta);
  }

  function clear() {
    setInput('');
    setMeta(null);
    setConfirmed(false);
    setStatus('idle');
    setSuggestions([]);
    onClear();
  }

  const isUp = (meta?.changePercent ?? 0) >= 0;

  // ── Confirmed badge ───────────────────────────────────────────────────────────
  if (confirmed && meta) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 10px 6px 12px',
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 10,
      }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          ${meta.symbol}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text4)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.name}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text)' }}>
          {fmtPrice(meta.close)}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          color: isUp ? 'var(--green)' : 'var(--red)',
          background: isUp ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          padding: '2px 6px', borderRadius: 5,
        }}>
          {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{meta.changePercent.toFixed(2)}%
        </span>
        <button
          onClick={clear}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text4)', fontSize: 14, lineHeight: 1, borderRadius: 4 }}
          title="Remove ticker"
        >
          ×
        </button>
      </div>
    );
  }

  // ── Search input ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--text4)', pointerEvents: 'none',
            fontFamily: 'JetBrains Mono, monospace',
          }}>$</span>
          <input
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase()); setConfirmed(false); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search ticker…"
            maxLength={12}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface)',
              border: `1.5px solid ${status === 'error' ? 'var(--red)' : status === 'found' ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: focused && suggestions.length > 0 ? '8px 8px 0 0' : 8,
              padding: '8px 10px 8px 24px',
              fontSize: 13, color: 'var(--text)',
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
            }}
          />
          {/* Loading spinner */}
          {status === 'loading' && (
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text4)' }}>…</span>
          )}
        </div>

        {/* Confirm button — only show when we have a valid quote */}
        {status === 'found' && meta && (
          <button
            onClick={confirm}
            style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: isUp ? 'var(--green)' : 'var(--red)', color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>${meta.symbol}</span>
            <span style={{ opacity: 0.85 }}>{isUp ? '▲' : '▼'} {isUp ? '+' : ''}{meta.changePercent.toFixed(2)}%</span>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {focused && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
          background: 'var(--surface)', border: '1.5px solid var(--green)',
          borderTop: 'none', borderRadius: '0 0 8px 8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => selectSuggestion(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border2)' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 60 }}>
                {s.symbol}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.instrument_name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                {s.exchange}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
