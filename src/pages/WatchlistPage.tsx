import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEWS_ITEMS } from '../data/demo';
import { useMobile } from '../hooks/useMobile';
import { useWatchlist, type SymbolSearchResult } from '../context/WatchlistContext';

type SortKey = 'pct' | 'price' | 'alpha' | 'added';

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'pct',   label: '% change'   },
  { id: 'price', label: 'Price'      },
  { id: 'alpha', label: 'A → Z'      },
  { id: 'added', label: 'Recently added' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Sparkline({ points, up }: { points: string; up: boolean }) {
  return (
    <svg width="80" height="32" viewBox="0 0 64 32" fill="none" style={{ display: 'block' }}>
      <polyline
        points={points}
        stroke={up ? '#16a34a' : '#dc2626'}
        strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (symbol: string, name: string) => void;
}) {
  const { searchSymbols, tickers } = useWatchlist();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleInput(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchSymbols(val.trim());
      setResults(res);
      setSearching(false);
    }, 320);
  }

  const watchedSet = new Set(tickers.map(t => t.symbol));

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: 440, maxWidth: '94vw', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search ticker or company name…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--text)', fontFamily: 'inherit',
            }}
          />
          {searching && (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }} className="scrollbar-hide">
          {results.length === 0 && query.trim() && !searching && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}
          {results.length === 0 && !query.trim() && (
            <div style={{ padding: '20px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                Popular
              </div>
              {['NVDA','TSLA','AAPL','MSFT','GOOGL','AMZN','META','SPY','QQQ','AMD'].map(sym => (
                <button
                  key={sym}
                  disabled={watchedSet.has(sym)}
                  onClick={() => { onAdd(sym, sym); onClose(); }}
                  style={{
                    display: 'inline-block', margin: '0 4px 6px 0',
                    padding: '5px 12px', borderRadius: 8,
                    background: watchedSet.has(sym) ? 'var(--surface2)' : 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: watchedSet.has(sym) ? 'var(--text-3)' : 'var(--text)',
                    fontSize: 12, fontWeight: 700, cursor: watchedSet.has(sym) ? 'default' : 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {sym} {watchedSet.has(sym) ? '✓' : ''}
                </button>
              ))}
            </div>
          )}
          {results.map(r => {
            const already = watchedSet.has(r.symbol);
            return (
              <div
                key={r.symbol}
                onClick={() => { if (!already) { onAdd(r.symbol, r.name); onClose(); } }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 16px', cursor: already ? 'default' : 'pointer',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => { if (!already) e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{r.symbol}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{r.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    {r.type}
                  </span>
                  {already ? (
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ Watching</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}>+ Add</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { tickers, quotesLoading, addTicker, removeTicker, toggleAlert } = useWatchlist();

  const [sort, setSort]         = useState<SortKey>('pct');
  const [sortOpen, setSortOpen] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);

  // Sort
  const sorted = [...tickers].sort((a, b) => {
    if (sort === 'pct')   return Math.abs(b.changePct) - Math.abs(a.changePct);
    if (sort === 'price') return b.price - a.price;
    if (sort === 'alpha') return a.symbol.localeCompare(b.symbol);
    if (sort === 'added') return b.addedAt - a.addedAt;
    return 0;
  });

  // Stats
  const loaded   = tickers.filter(t => t.price > 0);
  const upCount  = loaded.filter(t => t.changePct >= 0).length;
  const dnCount  = loaded.filter(t => t.changePct <  0).length;
  const flatCount = loaded.length - upCount - dnCount;
  const avgChange = loaded.length
    ? (loaded.reduce((s, t) => s + t.changePct, 0) / loaded.length)
    : 0;
  const alertCount = tickers.filter(t => t.hasAlert).length;
  const newsItems = NEWS_ITEMS.slice(0, 4);

  const statCards = [
    { label: 'Tickers watched', value: `${tickers.length}`, sub: `+${tickers.filter(t => Date.now() - t.addedAt < 7 * 86400_000).length} added this week`, subColor: '#16a34a' },
    { label: 'Avg change today', value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, valueColor: avgChange >= 0 ? '#16a34a' : '#dc2626', sub: `${upCount} up · ${dnCount} down · ${flatCount} flat`, subColor: 'var(--text-3)' },
    { label: 'News today', value: `${newsItems.length * 4}`, sub: 'stories across watchlist', subColor: 'var(--text-3)' },
    { label: 'Active alerts', value: `${alertCount}`, valueColor: alertCount > 0 ? '#f97316' : 'var(--text)', sub: '1 triggered today', subColor: 'var(--text-3)' },
  ];

  return (
    <div style={{ padding: isMobile ? '12px 10px 24px' : '0 0 40px', background: 'var(--bg)', minHeight: '100%' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: card.valueColor ?? 'var(--text)', marginBottom: 4, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: card.subColor }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Watchlist table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        {/* Table header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>MY WATCHLIST</span>
            {quotesLoading && (
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sort */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}
              >
                Sort: {SORT_OPTIONS.find(s => s.id === sort)?.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', minWidth: 150, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSort(opt.id); setSortOpen(false); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, color: sort === opt.id ? 'var(--blue)' : 'var(--text)', background: sort === opt.id ? 'rgba(59,130,246,0.08)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: sort === opt.id ? 600 : 400 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Add ticker */}
            <button
              onClick={() => setAddOpen(true)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
            >
              + Add ticker
            </button>
          </div>
        </div>

        {/* Column headers — desktop */}
        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.9fr 90px 0.8fr 60px 50px', padding: '8px 18px', borderBottom: '1px solid var(--border)' }}>
            {['SYMBOL', 'PRICE', 'CHANGE', 'INTRADAY', 'VOLUME', 'ALERT', ''].map(col => (
              <div key={col} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{col}</div>
            ))}
          </div>
        )}

        {/* Rows */}
        {tickers.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No tickers yet — click "+ Add ticker" to get started
          </div>
        )}
        {sorted.map((row, idx) => {
          const up = row.changePct >= 0;
          const changeColor = up ? '#16a34a' : '#dc2626';
          const isLast = idx === sorted.length - 1;

          if (isMobile) {
            return (
              <div key={row.symbol} style={{ padding: '12px 14px', borderBottom: isLast ? undefined : '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/ticker/${row.symbol}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{row.symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>
                      {row.price > 0 ? `$${row.price.toFixed(2)}` : '—'}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: changeColor, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                      {row.changePct >= 0 ? '+' : ''}{row.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkline points={row.sparkPoints} up={up} />
                  <button onClick={e => { e.stopPropagation(); toggleAlert(row.symbol); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: row.hasAlert ? '#f97316' : 'transparent', border: `2px solid ${row.hasAlert ? '#f97316' : 'var(--text-3)'}` }} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); removeTicker(row.symbol); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={row.symbol}
              style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.9fr 90px 0.8fr 60px 50px', padding: '12px 18px', borderBottom: isLast ? undefined : '1px solid var(--border)', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/ticker/${row.symbol}`)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Symbol + name */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{row.symbol}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{row.name}</div>
              </div>

              {/* Price */}
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>
                {row.price > 0 ? `$${row.price.toFixed(2)}` : '—'}
              </div>

              {/* Change */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: changeColor, fontVariantNumeric: 'tabular-nums' }}>
                  {row.changePct >= 0 ? '+' : ''}{row.changePct.toFixed(2)}%
                </span>
              </div>

              {/* Sparkline */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Sparkline points={row.sparkPoints} up={up} />
              </div>

              {/* Volume */}
              <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)' }}>—</div>

              {/* Alert toggle */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={e => { e.stopPropagation(); toggleAlert(row.symbol); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <div style={{ width: 13, height: 13, borderRadius: '50%', background: row.hasAlert ? '#f97316' : 'transparent', border: `2px solid ${row.hasAlert ? '#f97316' : 'var(--text-3)'}`, transition: 'all 0.15s' }} />
                </button>
              </div>

              {/* Remove */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={e => { e.stopPropagation(); removeTicker(row.symbol); }}
                  title={`Remove ${row.symbol}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* News section */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>NEWS ACROSS YOUR WATCHLIST</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{newsItems.length * 4} stories today</span>
        </div>
        {newsItems.map((item, idx) => {
          const up = item.up;
          return (
            <div
              key={item.id}
              style={{ display: 'flex', alignItems: 'flex-start', borderBottom: idx < newsItems.length - 1 ? '1px solid var(--border)' : undefined, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 3, flexShrink: 0, alignSelf: 'stretch', background: up ? '#16a34a' : '#dc2626' }} />
              <div style={{ padding: '12px 16px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: item.sourceColor, color: '#fff', letterSpacing: 0.5 }}>{item.source}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{item.time.replace('Today, ', '')}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: up ? '#16a34a' : '#dc2626', fontFamily: 'JetBrains Mono, monospace' }}>{item.changePct}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, margin: '0 0 8px' }}>{item.headline}</p>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'var(--surface2)', color: 'var(--text-2)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.ticker}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add ticker modal */}
      {addOpen && (
        <SearchModal
          onClose={() => setAddOpen(false)}
          onAdd={(symbol, name) => addTicker(symbol, name)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
