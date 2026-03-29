import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MY_FORUMS } from './ForumPage';
import { useTheme } from '../context/ThemeContext';

interface SymbolResult {
  symbol: string;
  description: string;
  exchange: string;
  type: string;
  full_name: string;
}

type PostType = 'trade' | 'discussion' | 'analysis';
type Sentiment = 'bullish' | 'neutral' | 'bearish';
type Timeframe = 'scalp' | 'intraday' | 'swing' | 'position' | 'longterm';

const TYPE_CONFIG = {
  trade:      { label: 'Trade idea',  color: '#1D9E75', badgeBg: '#E1F5EE', badgeText: '#0F6E56', postLabel: 'Post trade idea' },
  discussion: { label: 'Discussion',  color: '#185FA5', badgeBg: '#E6F1FB', badgeText: '#0C447C', postLabel: 'Post discussion' },
  analysis:   { label: 'Analysis',    color: '#BA7517', badgeBg: '#FAEEDA', badgeText: '#854F0B', postLabel: 'Publish analysis' },
};

const SUGGESTED_TAGS = ['NVDA', 'AAPL', 'SPY', 'QQQ', 'Options', 'Breakout', 'Earnings', 'Macro', 'Technical', 'Wyckoff', 'Fed', 'Rates'];

export default function ForumNewPostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forumId = searchParams.get('f') ?? MY_FORUMS[0].id;

  const [postType, setPostType] = useState<PostType>('trade');
  const [selectedForum, setSelectedForum] = useState(forumId);

  // Shared fields
  const [title, setTitle] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolResult | null>(null);
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Trade-specific
  const [timeframe, setTimeframe] = useState<Timeframe | null>(null);
  const [entry, setEntry] = useState('');
  const [target, setTarget] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [thesis, setThesis] = useState('');

  // Discussion-specific
  const [body, setBody] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Analysis-specific
  const [summary, setSummary] = useState('');
  const [fullAnalysis, setFullAnalysis] = useState('');

  const tagInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  const currentForum = MY_FORUMS.find(f => f.id === selectedForum) ?? MY_FORUMS[0];
  const dotColor = currentForum.type === 'open' ? '#16a34a' : currentForum.type === 'paid' ? '#ca8a04' : 'var(--text-3)';
  const cfg = TYPE_CONFIG[postType];

  // R:R
  const rrRatio = (() => {
    const e = parseFloat(entry.replace(/[$,]/g, ''));
    const t = parseFloat(target.replace(/[$,]/g, ''));
    const s = parseFloat(stopLoss.replace(/[$,]/g, ''));
    if (!e || !t || !s || s >= e) return null;
    const reward = t - e, risk = e - s;
    if (risk <= 0) return null;
    return (reward / risk).toFixed(1);
  })();
  const rrLabel = rrRatio
    ? parseFloat(rrRatio) >= 3 ? 'Excellent' : parseFloat(rrRatio) >= 2 ? 'Good' : 'Fair'
    : null;

  const removeTag = (t: string) => setTags(p => p.filter(x => x !== t));
  const addTag = (t: string) => {
    const v = t.trim();
    if (v && !tags.includes(v)) setTags(p => [...p, v]);
    setTagInput(''); setShowTagInput(false);
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)',
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };
  const ta: React.CSSProperties = {
    ...inp, resize: 'vertical', lineHeight: 1.6,
  };

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-3)' }}>
        <span onClick={() => navigate('/forum/discover')} style={{ color: cfg.color, cursor: 'pointer' }}>Forums</span>
        <span>›</span>
        <span onClick={() => navigate(`/forum?f=${selectedForum}`)} style={{ color: cfg.color, cursor: 'pointer' }}>{currentForum.name}</span>
        <span>›</span>
        <span>New post</span>
      </div>

      {/* Type switcher pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['trade', 'discussion', 'analysis'] as PostType[]).map((t, i) => {
          const icons = [
            <svg key="t" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
            <svg key="d" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
            <svg key="a" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
          ];
          const active = postType === t;
          return (
            <button
              key={t}
              onClick={() => setPostType(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 20,
                border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                background: active ? 'var(--text)' : 'transparent',
                color: active ? 'var(--bg)' : 'var(--text-3)',
                fontSize: 13, fontWeight: active ? 500 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              {icons[i]}
              {TYPE_CONFIG[t].label}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
            New post
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
              background: cfg.badgeBg, color: cfg.badgeText,
            }}>
              {cfg.label}
            </span>
          </div>
          <button
            onClick={() => navigate(`/forum?f=${selectedForum}`)}
            style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
        </div>

        {/* Post to forum — locked to the group it was opened from */}
        <Field label="Post to group" required>
          <div style={{ position: 'relative' }}>
            <div style={{
              ...inp,
              paddingLeft: 28,
              fontWeight: 500,
              color: 'var(--text)',
              display: 'flex', alignItems: 'center',
              cursor: 'default',
              userSelect: 'none',
            }}>
              {currentForum.name}
            </div>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: dotColor, pointerEvents: 'none' }} />
          </div>
        </Field>

        {/* Title */}
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 200))}
            placeholder={
              postType === 'trade' ? 'e.g. NVDA breakout above $950 — bull run or trap?' :
              postType === 'discussion' ? 'e.g. Fed holding rates longer — how are you repositioning?' :
              'e.g. NVDA technical deep dive: weekly structure & key levels'
            }
            style={inp}
          />
          <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{title.length} / 200</div>
        </Field>

        {/* Ticker search */}
        <Field label="Ticker" optional subLabel="adds a chart to your post">
          <TickerSearch
            value={selectedSymbol}
            onChange={setSelectedSymbol}
            darkMode={darkMode}
            entry={postType === 'trade' ? entry : undefined}
            target={postType === 'trade' ? target : undefined}
            stopLoss={postType === 'trade' ? stopLoss : undefined}
            rrRatio={postType === 'trade' ? rrRatio : undefined}
          />
        </Field>

        {/* ── TRADE IDEA ─────────────────────────────────────────────────── */}
        {postType === 'trade' && <>
          <SentimentField sentiment={sentiment} setSentiment={setSentiment} required />

          {/* Timeframe */}
          <Field label="Timeframe" required>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { id: 'scalp', label: 'Scalp' },
                { id: 'intraday', label: 'Intraday' },
                { id: 'swing', label: 'Swing' },
                { id: 'position', label: 'Position' },
                { id: 'longterm', label: 'Long-term' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTimeframe(id)}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontFamily: 'inherit',
                    border: `1px solid ${timeframe === id ? 'var(--border)' : 'var(--border)'}`,
                    background: timeframe === id ? 'var(--surface-2, var(--bg))' : 'none',
                    color: timeframe === id ? 'var(--text)' : 'var(--text-3)',
                    fontSize: 12, fontWeight: timeframe === id ? 500 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* Trade levels */}
          <Field label="Trade levels" required>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <LevelInput label="Entry"     value={entry}    onChange={setEntry}    accent="var(--border)" />
              <LevelInput label="Target"    value={target}   onChange={setTarget}   accent={target ? '#1D9E75' : 'var(--border)'} />
              <LevelInput label="Stop loss" value={stopLoss} onChange={setStopLoss} accent={stopLoss ? '#E24B4A' : 'var(--border)'} />
            </div>
            {rrRatio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>R:R</span>
                <div style={{
                  background: 'var(--surface-2, var(--bg))', borderRadius: 6, padding: '5px 12px',
                  fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--text)',
                }}>
                  {rrRatio} : 1
                </div>
                <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>{rrLabel}</span>
              </div>
            )}
          </Field>

          {/* Thesis */}
          <Field label="Thesis" required>
            <textarea
              value={thesis}
              onChange={e => setThesis(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Explain your trade setup, entry reasoning, and key levels to watch..."
              style={ta}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{thesis.length} / 2000</div>
          </Field>

          <TagsField tags={tags} tagInput={tagInput} setTagInput={setTagInput} showTagInput={showTagInput} setShowTagInput={setShowTagInput} addTag={addTag} removeTag={removeTag} tagInputRef={tagInputRef} />
        </>}

        {/* ── DISCUSSION ─────────────────────────────────────────────────── */}
        {postType === 'discussion' && <>
          <SentimentField sentiment={sentiment} setSentiment={setSentiment} optional />

          {/* Body */}
          <Field label="Body" required>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value.slice(0, 5000))}
              rows={5}
              placeholder="Ask a question, share a view, or kick off a debate..."
              style={ta}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{body.length} / 5000</div>
          </Field>

          {/* Poll */}
          <Field label="Poll" optional subLabel="add a vote for the community">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pollOptions.map((opt, i) => {
                const dotColors = ['#1D9E75', '#E24B4A', 'var(--border)', 'var(--border)'];
                const dotBg = opt ? dotColors[i] : 'transparent';
                const dotBorder = opt ? dotColors[i] : 'var(--border)';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    border: '1px solid var(--border)', borderRadius: 8, padding: '7px 11px',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${dotBorder}`, background: dotBg, flexShrink: 0 }} />
                    <input
                      type="text"
                      value={opt}
                      onChange={e => setPollOptions(p => p.map((o, j) => j === i ? e.target.value : o))}
                      placeholder={i < 2 ? `Option ${i + 1}` : 'Add option...'}
                      style={{ flex: 1, border: 'none', background: 'none', fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', outline: 'none' }}
                    />
                  </div>
                );
              })}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions(p => [...p, ''])}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                    color: '#185FA5', cursor: 'pointer', padding: '4px 0',
                    background: 'none', border: 'none', fontFamily: 'inherit',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Add option
                </button>
              )}
            </div>
          </Field>

          <TagsField tags={tags} tagInput={tagInput} setTagInput={setTagInput} showTagInput={showTagInput} setShowTagInput={setShowTagInput} addTag={addTag} removeTag={removeTag} tagInputRef={tagInputRef} />
        </>}

        {/* ── ANALYSIS ───────────────────────────────────────────────────── */}
        {postType === 'analysis' && <>
          <SentimentField sentiment={sentiment} setSentiment={setSentiment} required label="Bias" />

          {/* Section divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'var(--surface-2, var(--bg))',
            borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.5px',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            Write your analysis
          </div>

          {/* Summary */}
          <Field label="Summary" required subLabel="1–2 sentences shown in the feed preview">
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value.slice(0, 300))}
              rows={2}
              placeholder="Short summary shown in the thread list..."
              style={ta}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{summary.length} / 300</div>
          </Field>

          {/* Full analysis */}
          <Field label="Full analysis" required>
            <textarea
              value={fullAnalysis}
              onChange={e => setFullAnalysis(e.target.value.slice(0, 10000))}
              rows={10}
              placeholder={'Write your full analysis here. Markdown supported — use ## for headings, **bold**, and - for bullet points...'}
              style={{ ...ta, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{fullAnalysis.length} / 10000</div>
          </Field>

          {/* Attachments */}
          <Field label="Attachments" optional subLabel="charts, screenshots">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Upload chart', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
                { label: 'Add TradingView link', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                    border: '1px dashed var(--border)', background: 'none',
                    fontSize: 12, color: 'var(--text-3)', fontFamily: 'inherit',
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <TagsField tags={tags} tagInput={tagInput} setTagInput={setTagInput} showTagInput={showTagInput} setShowTagInput={setShowTagInput} addTag={addTag} removeTag={removeTag} tagInputRef={tagInputRef} />
        </>}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'var(--surface-2, var(--bg))',
          borderTop: '1px solid var(--border)',
        }}>
          <button style={{
            padding: '7px 14px', borderRadius: 20, fontFamily: 'inherit',
            border: '1px solid var(--border)', background: 'none',
            fontSize: 13, color: 'var(--text-3)', cursor: 'pointer',
          }}>
            Save draft
          </button>
          <button
            onClick={() => navigate(`/forum?f=${selectedForum}`)}
            style={{
              padding: '7px 20px', borderRadius: 20, fontFamily: 'inherit',
              border: 'none', background: cfg.color, color: '#fff',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {cfg.postLabel}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Field({ label, required, optional, subLabel, children }: {
  label: string; required?: boolean; optional?: boolean; subLabel?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.4px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label.toUpperCase()}
        {required && <span style={{ color: '#E24B4A' }}>*</span>}
        {(optional || subLabel) && (
          <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0 }}>
            {subLabel ? `(optional — ${subLabel})` : '(optional)'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SentimentField({ sentiment, setSentiment, required, optional, label = 'Sentiment' }: {
  sentiment: Sentiment | null;
  setSentiment: (s: Sentiment | null) => void;
  required?: boolean;
  optional?: boolean;
  label?: string;
}) {
  return (
    <Field label={label} required={required} optional={optional}>
      <div style={{ display: 'flex', gap: 8 }}>
        {([
          { id: 'bullish' as Sentiment, label: 'Bullish', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>, active: { border: '#1D9E75', bg: '#E1F5EE', color: '#0F6E56' } },
          { id: 'neutral' as Sentiment, label: 'Neutral', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>, active: { border: '#CA8A04', bg: '#FEF9C3', color: '#854D0E' } },
          { id: 'bearish' as Sentiment, label: 'Bearish', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>, active: { border: '#E24B4A', bg: '#FCEBEB', color: '#A32D2D' } },
        ]).map(({ id, label, icon, active: ac }) => {
          const on = sentiment === id;
          return (
            <button
              key={id}
              onClick={() => setSentiment(on ? null : id)}
              style={{
                flex: 1, padding: '7px', borderRadius: 8, fontFamily: 'inherit',
                border: `1px solid ${on ? ac.border : 'var(--border)'}`,
                background: on ? ac.bg : 'none',
                color: on ? ac.color : 'var(--text-3)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {icon}{label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function TagsField({ tags, tagInput, setTagInput, showTagInput, setShowTagInput, addTag, removeTag, tagInputRef }: {
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  showTagInput: boolean;
  setShowTagInput: (v: boolean) => void;
  addTag: (t: string) => void;
  removeTag: (t: string) => void;
  tagInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const suggested = SUGGESTED_TAGS.filter(t => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())).slice(0, 6);
  return (
    <Field label="Tags" optional>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {tags.map(t => (
          <span key={t} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 20, fontSize: 11,
            border: '1px solid var(--border)', background: 'var(--surface-2, var(--bg))',
            color: 'var(--text)', fontWeight: 500,
          }}>
            {t}
            <span onClick={() => removeTag(t)} style={{ cursor: 'pointer', color: 'var(--text-3)', lineHeight: 1 }}>×</span>
          </span>
        ))}
        {showTagInput ? (
          <input
            ref={tagInputRef}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTag(tagInput); if (e.key === 'Escape') { setShowTagInput(false); setTagInput(''); } }}
            onBlur={() => { if (tagInput) addTag(tagInput); else setShowTagInput(false); }}
            placeholder="Tag name"
            style={{ padding: '3px 9px', borderRadius: 20, border: '1px solid var(--blue)', background: 'transparent', color: 'var(--text)', fontSize: 11, width: 80, outline: 'none', fontFamily: 'inherit' }}
          />
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, border: '1px dashed var(--border)', color: 'var(--blue)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Add
          </button>
        )}
      </div>
      {showTagInput && suggested.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {suggested.map(t => (
            <span key={t} onClick={() => addTag(t)} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
      )}
    </Field>
  );
}

const TYPE_LABELS: Record<string, string> = {
  stock: 'Common Stock', dr: 'Depositary Receipt', fund: 'ETF / Fund',
  futures: 'Futures', crypto: 'Crypto', forex: 'Forex', index: 'Index', bond: 'Bond',
};

const TICKER_DB: SymbolResult[] = [
  // Mega-cap tech
  { symbol: 'NVDA',  description: 'NVIDIA Corporation',           exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:NVDA'  },
  { symbol: 'AAPL',  description: 'Apple Inc.',                   exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:AAPL'  },
  { symbol: 'MSFT',  description: 'Microsoft Corporation',        exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:MSFT'  },
  { symbol: 'GOOGL', description: 'Alphabet Inc. Class A',        exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:GOOGL' },
  { symbol: 'GOOG',  description: 'Alphabet Inc. Class C',        exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:GOOG'  },
  { symbol: 'META',  description: 'Meta Platforms Inc.',          exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:META'  },
  { symbol: 'AMZN',  description: 'Amazon.com Inc.',              exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:AMZN'  },
  { symbol: 'TSLA',  description: 'Tesla Inc.',                   exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:TSLA'  },
  { symbol: 'AMD',   description: 'Advanced Micro Devices Inc.',  exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:AMD'   },
  { symbol: 'INTC',  description: 'Intel Corporation',            exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:INTC'  },
  { symbol: 'QCOM',  description: 'Qualcomm Incorporated',        exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:QCOM'  },
  { symbol: 'AVGO',  description: 'Broadcom Inc.',                exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:AVGO'  },
  { symbol: 'CRM',   description: 'Salesforce Inc.',              exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:CRM'     },
  { symbol: 'ADBE',  description: 'Adobe Inc.',                   exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:ADBE'  },
  { symbol: 'ORCL',  description: 'Oracle Corporation',           exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:ORCL'    },
  { symbol: 'IBM',   description: 'IBM Corporation',              exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:IBM'     },
  { symbol: 'NOW',   description: 'ServiceNow Inc.',              exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:NOW'     },
  { symbol: 'SNOW',  description: 'Snowflake Inc.',               exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:SNOW'    },
  { symbol: 'PLTR',  description: 'Palantir Technologies Inc.',   exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:PLTR'    },
  { symbol: 'UBER',  description: 'Uber Technologies Inc.',       exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:UBER'    },
  // Finance
  { symbol: 'JPM',   description: 'JPMorgan Chase & Co.',         exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:JPM'     },
  { symbol: 'BAC',   description: 'Bank of America Corporation',  exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:BAC'     },
  { symbol: 'GS',    description: 'Goldman Sachs Group Inc.',     exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:GS'      },
  { symbol: 'MS',    description: 'Morgan Stanley',               exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:MS'      },
  { symbol: 'V',     description: 'Visa Inc.',                    exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:V'       },
  { symbol: 'MA',    description: 'Mastercard Incorporated',      exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:MA'      },
  { symbol: 'PYPL',  description: 'PayPal Holdings Inc.',         exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:PYPL'  },
  { symbol: 'COIN',  description: 'Coinbase Global Inc.',         exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:COIN'  },
  { symbol: 'SQ',    description: 'Block Inc.',                   exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:SQ'      },
  { symbol: 'BRK.B', description: 'Berkshire Hathaway Inc. B',   exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:BRK.B'   },
  // Healthcare
  { symbol: 'JNJ',   description: 'Johnson & Johnson',            exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:JNJ'     },
  { symbol: 'PFE',   description: 'Pfizer Inc.',                  exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:PFE'     },
  { symbol: 'UNH',   description: 'UnitedHealth Group Inc.',      exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:UNH'     },
  { symbol: 'ABBV',  description: 'AbbVie Inc.',                  exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:ABBV'    },
  { symbol: 'LLY',   description: 'Eli Lilly and Company',        exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:LLY'     },
  { symbol: 'MRK',   description: 'Merck & Co. Inc.',             exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:MRK'     },
  { symbol: 'TMO',   description: 'Thermo Fisher Scientific',     exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:TMO'     },
  // Consumer & Retail
  { symbol: 'WMT',   description: 'Walmart Inc.',                 exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:WMT'     },
  { symbol: 'COST',  description: 'Costco Wholesale Corporation', exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:COST'  },
  { symbol: 'HD',    description: 'Home Depot Inc.',              exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:HD'      },
  { symbol: 'MCD',   description: "McDonald's Corporation",       exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:MCD'     },
  { symbol: 'SBUX',  description: 'Starbucks Corporation',        exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:SBUX'  },
  { symbol: 'NKE',   description: 'Nike Inc.',                    exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:NKE'     },
  { symbol: 'DIS',   description: 'Walt Disney Company',          exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:DIS'     },
  { symbol: 'NFLX',  description: 'Netflix Inc.',                 exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:NFLX'  },
  // Energy
  { symbol: 'XOM',   description: 'Exxon Mobil Corporation',      exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:XOM'     },
  { symbol: 'CVX',   description: 'Chevron Corporation',          exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:CVX'     },
  { symbol: 'COP',   description: 'ConocoPhillips',               exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:COP'     },
  // Popular ETFs
  { symbol: 'SPY',   description: 'SPDR S&P 500 ETF Trust',       exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:SPY'     },
  { symbol: 'QQQ',   description: 'Invesco QQQ Trust',            exchange: 'NASDAQ', type: 'fund',  full_name: 'NASDAQ:QQQ'   },
  { symbol: 'IWM',   description: 'iShares Russell 2000 ETF',     exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:IWM'     },
  { symbol: 'GLD',   description: 'SPDR Gold Shares',             exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:GLD'     },
  { symbol: 'SLV',   description: 'iShares Silver Trust',         exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:SLV'     },
  { symbol: 'VTI',   description: 'Vanguard Total Stock Market',  exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:VTI'     },
  { symbol: 'VOO',   description: 'Vanguard S&P 500 ETF',         exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:VOO'     },
  { symbol: 'ARKK',  description: 'ARK Innovation ETF',           exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:ARKK'    },
  { symbol: 'SMH',   description: 'VanEck Semiconductor ETF',     exchange: 'NASDAQ', type: 'fund',  full_name: 'NASDAQ:SMH'   },
  { symbol: 'XLF',   description: 'Financial Select Sector SPDR', exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:XLF'     },
  { symbol: 'XLE',   description: 'Energy Select Sector SPDR',    exchange: 'NYSE',   type: 'fund',  full_name: 'AMEX:XLE'     },
  // Crypto / Meme
  { symbol: 'MSTR',  description: 'MicroStrategy Incorporated',   exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:MSTR'  },
  { symbol: 'MARA',  description: 'Marathon Digital Holdings',    exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:MARA'  },
  { symbol: 'RIOT',  description: 'Riot Platforms Inc.',          exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:RIOT'  },
  { symbol: 'GME',   description: 'GameStop Corp.',               exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:GME'     },
  { symbol: 'AMC',   description: 'AMC Entertainment Holdings',   exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:AMC'     },
  // Others
  { symbol: 'RBLX',  description: 'Roblox Corporation',           exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:RBLX'    },
  { symbol: 'SNAP',  description: 'Snap Inc.',                    exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:SNAP'    },
  { symbol: 'PINS',  description: 'Pinterest Inc.',               exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:PINS'    },
  { symbol: 'LYFT',  description: 'Lyft Inc.',                    exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:LYFT'  },
  { symbol: 'HOOD',  description: 'Robinhood Markets Inc.',       exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:HOOD'  },
  { symbol: 'SPOT',  description: 'Spotify Technology S.A.',      exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:SPOT'    },
  { symbol: 'SHOP',  description: 'Shopify Inc.',                 exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:SHOP'    },
  { symbol: 'NET',   description: 'Cloudflare Inc.',              exchange: 'NYSE',   type: 'stock', full_name: 'NYSE:NET'     },
  { symbol: 'DDOG',  description: 'Datadog Inc.',                 exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:DDOG'  },
  { symbol: 'ZS',    description: 'Zscaler Inc.',                 exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:ZS'    },
  { symbol: 'CRWD',  description: 'CrowdStrike Holdings Inc.',    exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:CRWD'  },
  { symbol: 'SMCI',  description: 'Super Micro Computer Inc.',    exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:SMCI'  },
  { symbol: 'ARM',   description: 'Arm Holdings plc',             exchange: 'NASDAQ', type: 'stock', full_name: 'NASDAQ:ARM'   },
];

function searchTickers(q: string): SymbolResult[] {
  if (!q) return [];
  const upper = q.toUpperCase();
  const exact = TICKER_DB.filter(t => t.symbol.startsWith(upper));
  const desc  = TICKER_DB.filter(t => !t.symbol.startsWith(upper) && t.description.toUpperCase().includes(upper));
  return [...exact, ...desc].slice(0, 8);
}

const INTERVALS: { label: string; value: string }[] = [
  { label: '15m', value: '15' },
  { label: '1H',  value: '60' },
  { label: '4H',  value: '240' },
  { label: '1D',  value: 'D' },
  { label: '1W',  value: 'W' },
];

interface QuoteData { price: number; change: number; changePct: number; }

function TickerSearch({ value, onChange, darkMode, entry, target, stopLoss, rrRatio }: {
  value: SymbolResult | null;
  onChange: (s: SymbolResult | null) => void;
  darkMode: boolean;
  entry?: string;
  target?: string;
  stopLoss?: string;
  rrRatio?: string | null;
}) {
  const [query, setQuery] = useState(value?.symbol ?? '');
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState('D');
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTradeMode = entry !== undefined;

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Local search
  useEffect(() => {
    if (!query || value?.symbol === query) { setResults([]); setOpen(false); return; }
    const arr = searchTickers(query);
    setResults(arr);
    setOpen(arr.length > 0);
  }, [query, value]);

  // Fetch quote when confirmed
  useEffect(() => {
    if (!value) { setQuote(null); return; }
    const sym = value.full_name.includes(':') ? value.full_name.split(':')[1] : value.symbol;
    fetch(`/api/yf/v8/finance/chart/${sym}?interval=1d&range=2d`)
      .then(r => r.json())
      .then(json => {
        const meta = json?.chart?.result?.[0]?.meta;
        if (!meta) return;
        const price = meta.regularMarketPrice;
        const prev  = meta.chartPreviousClose ?? meta.previousClose;
        if (price && prev) {
          const change = price - prev;
          setQuote({ price, change, changePct: (change / prev) * 100 });
        }
      })
      .catch(() => {});
  }, [value?.symbol]);

  const select = (s: SymbolResult) => {
    onChange(s); setQuery(s.symbol); setOpen(false); setResults([]);
  };

  const confirmed = !!value && value.symbol === query;

  const rrLabel = rrRatio
    ? parseFloat(rrRatio) >= 3 ? 'Excellent' : parseFloat(rrRatio) >= 2 ? 'Good' : 'Fair'
    : null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* Search input */}
      {!confirmed && (
        <div style={{
          display: 'flex', alignItems: 'center',
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)',
        }}>
          <span style={{ padding: '0 6px 0 11px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>$</span>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '')); onChange(null); }}
            onFocus={() => { if (results.length) setOpen(true); }}
            placeholder="Search ticker..."
            style={{ flex: 1, border: 'none', background: 'none', padding: '8px 0', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text)', outline: 'none', letterSpacing: '0.5px' }}
          />
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {results.map((s, i) => (
            <div key={i} onMouseDown={() => select(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2, var(--bg))')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)', minWidth: 52 }}>{s.symbol}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-2, var(--text))' }}>{s.description}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.exchange}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 110, textAlign: 'right' }}>{TYPE_LABELS[s.type] ?? s.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confirmed card */}
      {confirmed && value && (
        <div style={{ border: '1px solid #1D9E75', borderRadius: 10, overflow: 'hidden', background: 'var(--bg)' }}>

          {/* Price header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{value.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>{value.description}</span>
            {quote && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  ${quote.price.toFixed(2)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: quote.change >= 0 ? '#1D9E75' : '#E24B4A' }}>
                  {quote.changePct >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%
                </span>
              </span>
            )}
            <button
              onClick={() => { onChange(null); setQuery(''); setQuote(null); }}
              style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Change
            </button>
          </div>

          {/* Timeframe selector (all modes) */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {INTERVALS.map(iv => (
              <button key={iv.value} onClick={() => setInterval(iv.value)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
                border: `1px solid ${interval === iv.value ? 'var(--text)' : 'transparent'}`,
                background: interval === iv.value ? 'var(--surface-2, var(--bg))' : 'transparent',
                color: interval === iv.value ? 'var(--text)' : 'var(--text-3)',
                cursor: 'pointer',
              }}>
                {iv.label}
              </button>
            ))}
          </div>

          {/* TradingView chart */}
          <div style={{ height: 300 }}>
            <TradingViewChart symbol={value.full_name} darkMode={darkMode} interval={interval} />
          </div>

          {/* Trade mode: levels grid */}
          {isTradeMode && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'ENTRY',  val: entry || '—',    color: 'var(--text)',    border: false },
                { label: 'TARGET', val: target || '—',   color: '#1D9E75',        border: false },
                { label: 'STOP',   val: stopLoss || '—', color: '#E24B4A',        border: false },
                { label: 'R:R',    val: rrRatio ? `${rrRatio}×` : '—',
                  color: '#CA8A04', border: true,
                  boxBorder: !!rrRatio },
              ].map(({ label, val, color, boxBorder }, i) => (
                <div key={label} style={{ padding: '10px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', color: label === 'TARGET' ? '#1D9E75' : label === 'STOP' ? '#E24B4A' : label === 'R:R' ? '#CA8A04' : 'var(--text-3)', marginBottom: 5 }}>{label}</div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color,
                    ...(boxBorder ? { border: `1px solid #CA8A04`, borderRadius: 6, padding: '2px 6px', display: 'inline-block' } : {}),
                  }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Non-trade mode: CTA */}
          {!isTradeMode && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
              <button style={{
                width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                background: '#0047FF', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Use {value.symbol} for this post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── TradingViewChart ─────────────────────────────────────────────────────────
function TradingViewChart({ symbol, darkMode, interval = 'D' }: { symbol: string; darkMode: boolean; interval?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol, interval,
      timezone: 'Etc/UTC', theme: darkMode ? 'dark' : 'light',
      style: '1', locale: 'en',
      hide_top_toolbar: true, hide_legend: false,
      save_image: false, calendar: false, hide_volume: true,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol, darkMode, interval]);
  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

function LevelInput({ label, value, onChange, accent }: { label: string; value: string; onChange: (v: string) => void; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="$0.00"
        style={{
          border: `1px solid ${accent}`, borderRadius: 8, padding: '7px 10px',
          fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
