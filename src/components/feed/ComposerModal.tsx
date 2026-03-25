import { useState, useRef } from 'react';
import { currentUser } from '../../data/demo';
import { TickerChart } from './TickerChart';
import type { TickerMeta } from './TickerChart';
import { useMobile } from '../../hooks/useMobile';

type PostType = 'trade' | 'invest' | 'commentary';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', 'Daily', 'Weekly'];

const CARD: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '14px 16px',
  marginBottom: 10,
};

const LABEL: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: 2,
  color: 'var(--text4)', textTransform: 'uppercase',
  display: 'block', marginBottom: 10,
};

const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--surface)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 12px', fontSize: 13, color: 'var(--text)',
  fontFamily: 'Inter, sans-serif', outline: 'none',
  boxSizing: 'border-box',
};

export default function ComposerModal({ open, onClose, initialTab = 'trade' }: { open: boolean; onClose: () => void; initialTab?: PostType }) {
  const isMobile = useMobile();
  const [postType, setPostType] = useState<PostType>(initialTab);

  // Trade
  const [ticker, setTicker] = useState('');
  const [postMeta, setPostMeta] = useState<TickerMeta | null>(null);
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('');
  const [target, setTarget] = useState('');
  const [stop, setStop] = useState('');
  const [strategyText, setStrategyText] = useState('');
  const [timeframes, setTimeframes] = useState<string[]>(['Daily']);
  const [whyNow, setWhyNow] = useState('');
  const [tradeRisk, setTradeRisk] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [thesisOpen, setThesisOpen] = useState<Record<string, boolean>>({});

  // Investment
  const [investTicker, setInvestTicker] = useState('');
  const [investMeta, setInvestMeta] = useState<TickerMeta | null>(null);
  const [conviction, setConviction] = useState<'High' | 'Medium' | 'Speculative'>('High');
  const [horizon, setHorizon] = useState('');
  const [addedAt, setAddedAt] = useState('');
  const [catalyst, setCatalyst] = useState('');
  const [valuation, setValuation] = useState('');
  const [investRisk, setInvestRisk] = useState('');
  const [investThesisOpen, setInvestThesisOpen] = useState<Record<string, boolean>>({});

  // Commentary
  const [body, setBody] = useState('');
  const [sentiment, setSentiment] = useState<'Bullish' | 'Neutral' | 'Bearish'>('Bullish');
  const [macroThemes, setMacroThemes] = useState<string[]>([]);
  const [commentaryTicker, setCommentaryTicker] = useState('');
  const [commentaryDate, setCommentaryDate] = useState('');
  const [commentaryDateEnabled, setCommentaryDateEnabled] = useState(false);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Media
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared
  const [hashtags, setHashtags] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [visibility, setVisibility] = useState('Public');

  // Live R:R — direction-aware
  const { rrCalc, rrColor, rrInvalid } = (() => {
    const e = parseFloat(entry), t = parseFloat(target), s = parseFloat(stop);
    if (isNaN(e) || isNaN(t) || isNaN(s) || e === s)
      return { rrCalc: '—', rrColor: 'var(--gold)', rrInvalid: false };

    // A setup is invalid when levels are on the wrong side for the direction
    const invalid =
      direction === 'long'  ? (t <= e || s >= e) :
      direction === 'short' ? (t >= e || s <= e) : false;

    if (invalid)
      return { rrCalc: 'BAD', rrColor: 'var(--red)', rrInvalid: true };

    const rr = Math.abs((t - e) / (e - s));
    if (!isFinite(rr) || rr <= 0)
      return { rrCalc: '—', rrColor: 'var(--gold)', rrInvalid: false };

    const color = rr >= 2 ? 'var(--green)' : rr >= 1 ? 'var(--gold)' : 'var(--red)';
    return { rrCalc: `${rr.toFixed(1)}×`, rrColor: color, rrInvalid: false };
  })();

  const canPublish =
    postType === 'trade' ? ticker.trim().length > 0 :
    postType === 'invest' ? investTicker.trim().length > 0 :
    body.trim().length > 0;

  function toggleTimeframe(tf: string) {
    setTimeframes(prev => prev.includes(tf) ? prev.filter(x => x !== tf) : [...prev, tf]);
  }
  function toggleThesis(key: string) {
    setThesisOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleInvestThesis(key: string) {
    setInvestThesisOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleMediaFiles(files: FileList | File[]) {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    const urls = images.map(f => URL.createObjectURL(f));
    setMediaFiles(prev => [...prev, ...images]);
    setMediaPreviews(prev => [...prev, ...urls]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
  function removeMedia(index: number) {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function handlePublish() {
    if (!canPublish) return;
    console.log('Publishing:', { postType, ticker, postMeta, direction, entry, target, stop, strategyText, timeframes, confidence, visibility, hashtags });
    onClose();
  }

  if (!open) return null;

  const TABS: { id: PostType; label: string }[] = [
    { id: 'trade',      label: '📝 Trade' },
    { id: 'invest',     label: '💼 Investment' },
    { id: 'commentary', label: '💬 Commentary' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="scrollbar-hide"
        style={{
          background: 'var(--surface)',
          border: isMobile ? 'none' : '1px solid var(--border)',
          borderRadius: isMobile ? '20px 20px 0 0' : 20,
          width: '100%',
          maxWidth: isMobile ? '100%' : 660,
          maxHeight: isMobile ? '95dvh' : '95vh',
          height: isMobile ? '95dvh' : undefined,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle (mobile only) */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border2)' }} />
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '12px 16px 12px' : '20px 20px 16px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            {currentUser.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>New post</div>
            <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 2 }}>Share your trade idea</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: isMobile ? '0 14px 12px' : '0 20px 16px', flexShrink: 0 }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPostType(id)}
              style={{
                padding: '10px 0', borderRadius: 10, border: '1px solid', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                background: postType === id ? 'var(--surface3)' : 'transparent',
                color: postType === id ? 'var(--text)' : 'var(--text3)',
                borderColor: postType === id ? 'var(--border2)' : 'var(--border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <div style={{ padding: isMobile ? '0 14px 20px' : '0 20px 20px' }}>

          {/* ────── TRADE ────── */}
          {postType === 'trade' && (
            <>
              {/* SETUP */}
              <div style={CARD}>
                <span style={LABEL}>Setup</span>
                {/* Direction toggle */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {(['long', 'short'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        if (d !== direction && entry) {
                          // Swap target and stop so levels stay valid for the new direction
                          const prev = target;
                          setTarget(stop);
                          setStop(prev);
                        }
                        setDirection(d);
                      }}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid',
                        fontSize: 12, fontWeight: 800, letterSpacing: 0.5, cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: direction === d ? (d === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--surface)',
                        color: direction === d ? 'white' : 'var(--text3)',
                        borderColor: direction === d ? (d === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--border)',
                      }}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Ticker search + live chart */}
                <TickerChart
                  onConfirm={(t, m) => {
                    setTicker(t);
                    setPostMeta(m);
                    setEntry(m.close.toFixed(2));
                    if (direction === 'short') {
                      setTarget((m.close * 0.95).toFixed(2));
                      setStop((m.close * 1.03).toFixed(2));
                    } else {
                      setTarget((m.close * 1.05).toFixed(2));
                      setStop((m.close * 0.97).toFixed(2));
                    }
                  }}
                  entry={entry}
                  target={target}
                  stop={stop}
                  direction={direction}
                  onTargetChange={setTarget}
                  onStopChange={setStop}
                />
                {/* ENTRY / TARGET / STOP / R:R */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 6, marginTop: 14 }}>
                  {[
                    { label: 'Entry',  color: 'var(--blue)',  value: entry,  setter: setEntry },
                    { label: 'Target', color: 'var(--green)', value: target, setter: setTarget },
                    { label: 'Stop',   color: 'var(--red)',   value: stop,   setter: setStop },
                  ].map(({ label, color, value, setter }) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color, marginBottom: 5, textTransform: 'uppercase' }}>{label}</div>
                      <input
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder="$0.00"
                        style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 8px', textAlign: 'center' }}
                      />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: rrColor, marginBottom: 5, textTransform: 'uppercase' }}>R:R</div>
                    <div style={{ ...INPUT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: rrInvalid ? 10 : 13, fontWeight: 700, color: rrColor, padding: '9px 8px', borderColor: rrInvalid ? 'var(--red)' : undefined }}>
                      {rrCalc}
                    </div>
                  </div>
                </div>
              </div>

              {/* STRATEGY */}
              <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase' }}>Strategy</span>
                  <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{strategyText.length} / 280</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>Describe your setup in your own words</div>
                <textarea
                  value={strategyText}
                  onChange={e => { if (e.target.value.length <= 280) setStrategyText(e.target.value); }}
                  placeholder="e.g. Break and retest of the 175 supply zone after daily consolidation. Expecting continuation toward Nov highs if it holds above VWAP into close..."
                  rows={4}
                  style={{ ...INPUT, resize: 'none', background: 'var(--surface)', lineHeight: 1.6, fontSize: 13 }}
                />
              </div>

              {/* TRADE TIMEFRAME */}
              <div style={CARD}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase' }}>Trade Timeframe</span>
                  <span style={{ fontSize: 9, color: 'var(--text4)', marginLeft: 6 }}>— what timeframe is your trade based on?</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf}
                      onClick={() => toggleTimeframe(tf)}
                      style={{
                        padding: '6px 16px', borderRadius: 20, border: '1px solid',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'Inter, sans-serif',
                        background: timeframes.includes(tf) ? 'var(--blue)' : 'transparent',
                        color: timeframes.includes(tf) ? 'white' : 'var(--text2)',
                        borderColor: timeframes.includes(tf) ? 'var(--blue)' : 'var(--border)',
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* TRADE THESIS */}
              <div style={CARD}>
                <span style={LABEL}>Trade Thesis</span>
                {[
                  { key: 'whyNow',      dot: 'var(--blue)', label: 'Why now — catalyst or setup',         value: whyNow,      setter: setWhyNow },
                  { key: 'risk',        dot: 'var(--red)',  label: 'Risk — what could go wrong',          value: tradeRisk,   setter: setTradeRisk },
                  { key: 'invalidation',dot: 'var(--gold)', label: 'Invalidation — when is the idea wrong',value: invalidation,setter: setInvalidation },
                ].map(({ key, dot, label, value, setter }) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div
                      onClick={() => toggleThesis(key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: value ? 'var(--text)' : 'var(--text3)' }}>{value || label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text4)' }}>{thesisOpen[key] ? '▲' : '▼'}</span>
                    </div>
                    {thesisOpen[key] && (
                      <textarea
                        autoFocus
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={label}
                        rows={3}
                        style={{ ...INPUT, marginTop: 6, resize: 'none', background: 'var(--surface)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ────── INVESTMENT ────── */}
          {postType === 'invest' && (
            <>
              <div style={CARD}>
                <span style={LABEL}>Setup</span>
                <TickerChart
                  entryOnly
                  entry={addedAt}
                  onConfirm={(t, m) => {
                    setInvestTicker(t);
                    setInvestMeta(m);
                    setAddedAt(m.close.toFixed(2));
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text4)', marginBottom: 6, textTransform: 'uppercase' }}>Conviction</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {(['High', 'Medium', 'Speculative'] as const).map(c => {
                        const col = c === 'High' ? 'var(--green)' : c === 'Medium' ? 'var(--gold)' : 'var(--red)';
                        return (
                          <button key={c} onClick={() => setConviction(c)} style={{ padding: '7px 0', borderRadius: 8, border: '1px solid', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: conviction === c ? col : 'var(--surface)', color: conviction === c ? 'white' : 'var(--text3)', borderColor: conviction === c ? col : 'var(--border)' }}>{c}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text4)', marginBottom: 6, textTransform: 'uppercase' }}>Horizon</div>
                    <input value={horizon} onChange={e => setHorizon(e.target.value)} placeholder="e.g. 18 months" style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text4)', marginBottom: 6, textTransform: 'uppercase' }}>Added At</div>
                    <input value={addedAt} onChange={e => setAddedAt(e.target.value)} placeholder="$485.00" style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }} />
                  </div>
                </div>
              </div>

              <div style={CARD}>
                <span style={LABEL}>Investment Thesis</span>
                {[
                  { key: 'catalyst',  dot: 'var(--blue)',  label: "Catalyst — what's the growth driver",  value: catalyst,   setter: setCatalyst },
                  { key: 'valuation', dot: 'var(--green)', label: 'Valuation — why is it cheap or fair',  value: valuation,  setter: setValuation },
                  { key: 'investRisk',dot: 'var(--red)',   label: 'Risk — what could go wrong',           value: investRisk,  setter: setInvestRisk },
                ].map(({ key, dot, label, value, setter }) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div onClick={() => toggleInvestThesis(key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: value ? 'var(--text)' : 'var(--text3)' }}>{value || label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text4)' }}>{investThesisOpen[key] ? '▲' : '▼'}</span>
                    </div>
                    {investThesisOpen[key] && (
                      <textarea autoFocus value={value} onChange={e => setter(e.target.value)} placeholder={label} rows={3} style={{ ...INPUT, marginTop: 6, resize: 'none', background: 'var(--surface)' }} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ────── COMMENTARY ────── */}
          {postType === 'commentary' && (
            <>
              {/* Commentary text + sentiment */}
              <div style={CARD}>
                <span style={LABEL}>Commentary</span>
                <textarea
                  value={body}
                  onChange={e => { if (e.target.value.length <= 500) setBody(e.target.value); }}
                  placeholder="Share your market thoughts..."
                  rows={6}
                  style={{ ...INPUT, resize: 'none', fontSize: 14, lineHeight: 1.7, background: 'var(--surface2)', border: 'none', padding: '0 0 8px' }}
                />
                <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 14 }}>
                  {body.length} / 500
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 8 }}>Sentiment</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {([
                    { label: 'Bullish',  dot: '#16a34a', activeBg: 'rgba(22,163,74,0.12)',  activeBorder: 'rgba(22,163,74,0.35)',  activeColor: '#16a34a' },
                    { label: 'Neutral',  dot: '#d97706', activeBg: 'rgba(217,119,6,0.12)',  activeBorder: 'rgba(217,119,6,0.35)',  activeColor: '#d97706' },
                    { label: 'Bearish',  dot: '#dc2626', activeBg: 'rgba(220,38,38,0.12)',  activeBorder: 'rgba(220,38,38,0.35)',  activeColor: '#dc2626' },
                  ] as const).map(({ label, dot, activeBg, activeBorder, activeColor }) => {
                    const active = sentiment === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setSentiment(label)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px 0', borderRadius: 10, border: `1px solid ${active ? activeBorder : 'var(--border)'}`,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                          background: active ? activeBg : 'var(--surface)',
                          color: active ? activeColor : 'var(--text-2)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Context */}
              <div style={CARD}>
                <span style={LABEL}>Context</span>
                {/* Optional ticker */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)', pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>$</span>
                  <input
                    value={commentaryTicker}
                    onChange={e => setCommentaryTicker(e.target.value.toUpperCase())}
                    placeholder="Link a ticker (optional) — e.g. NVDA"
                    maxLength={10}
                    style={{ ...INPUT, paddingLeft: 28, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
                  />
                </div>
                {/* Macro theme */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 8 }}>Macro Theme</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {['Fed policy', 'Inflation', 'Earnings', 'Rate cut', 'Geopolitics', 'Jobs data', 'AI / Tech', 'Energy'].map(theme => {
                    const active = macroThemes.includes(theme);
                    return (
                      <button
                        key={theme}
                        onClick={() => setMacroThemes(prev => active ? prev.filter(x => x !== theme) : [...prev, theme])}
                        style={{
                          padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                          fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          background: active ? 'var(--blue)' : 'transparent',
                          color: active ? 'white' : 'var(--text-2)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setCommentaryDateEnabled(v => !v)}
                    style={{
                      width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${commentaryDateEnabled ? 'var(--blue)' : 'var(--border)'}`,
                      background: commentaryDateEnabled ? 'var(--blue)' : 'transparent',
                      flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {commentaryDateEnabled && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                  <input
                    type="date"
                    value={commentaryDate}
                    onChange={e => setCommentaryDate(e.target.value)}
                    disabled={!commentaryDateEnabled}
                    style={{ ...INPUT, opacity: commentaryDateEnabled ? 1 : 0.4, flex: 1 }}
                  />
                </div>
              </div>

              {/* Poll */}
              <div style={{ ...CARD, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Poll <span style={{ color: 'var(--text4)', fontSize: 12 }}>— let followers vote</span>
                  </span>
                  <button
                    onClick={() => setPollEnabled(v => !v)}
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {pollEnabled ? '− Remove poll' : '+ Add poll'}
                  </button>
                </div>
                {pollEnabled && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pollOptions.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                        placeholder={`Option ${i + 1}`}
                        style={INPUT}
                      />
                    ))}
                    {pollOptions.length < 4 && (
                      <button
                        onClick={() => setPollOptions(prev => [...prev, ''])}
                        style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '8px 0', cursor: 'pointer' }}
                      >
                        + Add option
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── MEDIA ── */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files) handleMediaFiles(e.target.files); }}
          />
          <div style={CARD}>
            <span style={LABEL}>Chart or Screenshot</span>
            {mediaPreviews.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {mediaPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', background: 'var(--bg)' }}>
                    <img src={src} alt={`Upload ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => removeMedia(i)}
                      style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleMediaFiles(e.dataTransfer.files); }}
                  style={{ borderRadius: 10, border: `1.5px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`, aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: dragOver ? 'var(--blue-dim)' : 'transparent', transition: 'border-color 0.15s, background 0.15s' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>Add more</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleMediaFiles(e.dataTransfer.files); }}
                style={{ border: `1.5px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 10, padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: dragOver ? 'var(--blue-dim)' : 'transparent', transition: 'border-color 0.15s, background 0.15s' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Add chart or screenshot</div>
                <div style={{ fontSize: 12, color: 'var(--blue)' }}>drag & drop or click</div>
              </div>
            )}
          </div>

          {/* ── SOCIAL (non-commentary: confidence + visibility) ── */}
          {postType !== 'commentary' && (
            <div style={CARD}>
              <span style={LABEL}>Social</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 80 }}>Confidence</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} onClick={() => setConfidence(i)} style={{ fontSize: 20, cursor: 'pointer', color: i <= confidence ? '#f59e0b' : 'var(--border2)', lineHeight: 1 }}>★</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, ...INPUT, padding: '10px 12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                    <option>Public</option>
                    <option>Followers</option>
                    <option>Private</option>
                  </select>
                </div>
                <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── COMMENTARY: visibility row ── */}
          {postType === 'commentary' && (
            <div style={{ ...CARD, padding: '10px 16px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, ...INPUT, padding: '10px 12px' }}>
                  <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                    <option>Public</option>
                    <option>Followers</option>
                    <option>Private</option>
                  </select>
                </div>
                <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── HASHTAGS ── */}
          <div style={{ ...CARD, marginBottom: 0 }}>
            <span style={LABEL}>Hashtags</span>
            <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#AI #Semiconductors #Earnings" style={INPUT} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: isMobile ? '12px 14px calc(12px + env(safe-area-inset-bottom))' : '14px 20px', borderTop: '1px solid var(--border2)', flexShrink: 0 }}>
          <button
            onClick={handlePublish}
            disabled={!canPublish}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: canPublish ? 'var(--text)' : 'var(--surface3)',
              color: canPublish ? 'var(--bg)' : 'var(--text4)',
              fontSize: 15, fontWeight: 700,
              cursor: canPublish ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
            }}
          >
            Post trade idea
          </button>
        </div>
      </div>
    </div>
  );
}
