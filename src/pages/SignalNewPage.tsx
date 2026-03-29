import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';

// ── Types ──────────────────────────────────────────────────────────────────

type Direction  = 'long' | 'short';
type AssetType  = 'equity' | 'options' | 'futures' | 'crypto' | 'forex' | 'etf';
type OrderType  = 'market' | 'limit' | 'stop-limit' | 'zone';
type Timeframe  = 'scalp' | 'intraday' | 'swing' | 'position' | 'long-term';

// ── Ticker catalogue per asset type ───────────────────────────────────────

interface TickerEntry { symbol: string; name: string; assetType: AssetType }

const TICKER_CATALOGUE: TickerEntry[] = [
  // Equity
  { symbol: 'NVDA',  name: 'Nvidia Corp',            assetType: 'equity' },
  { symbol: 'AAPL',  name: 'Apple Inc.',              assetType: 'equity' },
  { symbol: 'MSFT',  name: 'Microsoft Corp',          assetType: 'equity' },
  { symbol: 'TSLA',  name: 'Tesla Inc.',              assetType: 'equity' },
  { symbol: 'META',  name: 'Meta Platforms',          assetType: 'equity' },
  { symbol: 'AMZN',  name: 'Amazon.com',              assetType: 'equity' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',           assetType: 'equity' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',  assetType: 'equity' },
  { symbol: 'INTC',  name: 'Intel Corp',              assetType: 'equity' },
  { symbol: 'NFLX',  name: 'Netflix Inc.',            assetType: 'equity' },
  { symbol: 'DIS',   name: 'Walt Disney Co',          assetType: 'equity' },
  { symbol: 'JPM',   name: 'JPMorgan Chase',          assetType: 'equity' },
  { symbol: 'GS',    name: 'Goldman Sachs',           assetType: 'equity' },
  { symbol: 'COIN',  name: 'Coinbase Global',         assetType: 'equity' },
  // ETF
  { symbol: 'SPY',   name: 'SPDR S&P 500 ETF',        assetType: 'etf' },
  { symbol: 'QQQ',   name: 'Invesco QQQ Trust',       assetType: 'etf' },
  { symbol: 'IWM',   name: 'iShares Russell 2000',    assetType: 'etf' },
  { symbol: 'DIA',   name: 'SPDR Dow Jones ETF',      assetType: 'etf' },
  { symbol: 'VTI',   name: 'Vanguard Total Stock ETF',assetType: 'etf' },
  { symbol: 'GLD',   name: 'SPDR Gold Shares',        assetType: 'etf' },
  { symbol: 'XLF',   name: 'Financial Select Sector', assetType: 'etf' },
  { symbol: 'ARKK',  name: 'ARK Innovation ETF',      assetType: 'etf' },
  // Crypto
  { symbol: 'BTC',   name: 'Bitcoin',                 assetType: 'crypto' },
  { symbol: 'ETH',   name: 'Ethereum',                assetType: 'crypto' },
  { symbol: 'SOL',   name: 'Solana',                  assetType: 'crypto' },
  { symbol: 'XRP',   name: 'XRP',                     assetType: 'crypto' },
  { symbol: 'BNB',   name: 'BNB',                     assetType: 'crypto' },
  { symbol: 'DOGE',  name: 'Dogecoin',                assetType: 'crypto' },
  { symbol: 'ADA',   name: 'Cardano',                 assetType: 'crypto' },
  { symbol: 'AVAX',  name: 'Avalanche',               assetType: 'crypto' },
  { symbol: 'LINK',  name: 'Chainlink',               assetType: 'crypto' },
  { symbol: 'DOT',   name: 'Polkadot',                assetType: 'crypto' },
  // Forex
  { symbol: 'EUR/USD', name: 'Euro / US Dollar',           assetType: 'forex' },
  { symbol: 'GBP/USD', name: 'British Pound / USD',        assetType: 'forex' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen',   assetType: 'forex' },
  { symbol: 'GBP/JPY', name: 'British Pound / JPY',        assetType: 'forex' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar',assetType: 'forex' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / USD',    assetType: 'forex' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / USD',   assetType: 'forex' },
  { symbol: 'XAUUSD',  name: 'Gold / US Dollar',           assetType: 'forex' },
  { symbol: 'XAGUSD',  name: 'Silver / US Dollar',         assetType: 'forex' },
  // Futures
  { symbol: 'ES1!',  name: 'S&P 500 Futures',         assetType: 'futures' },
  { symbol: 'NQ1!',  name: 'Nasdaq 100 Futures',      assetType: 'futures' },
  { symbol: 'YM1!',  name: 'Dow Jones Futures',       assetType: 'futures' },
  { symbol: 'RTY1!', name: 'Russell 2000 Futures',    assetType: 'futures' },
  { symbol: 'WTI',   name: 'WTI Crude Oil',           assetType: 'futures' },
  { symbol: 'BRENT', name: 'Brent Crude Oil',         assetType: 'futures' },
  { symbol: 'NATGAS',name: 'Natural Gas',             assetType: 'futures' },
  { symbol: 'GER40', name: 'DAX 40 Index CFD',        assetType: 'futures' },
  { symbol: 'UK100', name: 'FTSE 100 Index CFD',      assetType: 'futures' },
  { symbol: 'JPN225',name: 'Nikkei 225 CFD',          assetType: 'futures' },
];

const MOCK_PRICES: Record<string, number> = {
  NVDA: 969.50, AAPL: 209.30, MSFT: 418.60, TSLA: 179.20, META: 497.80,
  AMZN: 184.60, GOOGL: 172.40, AMD: 164.40, INTC: 30.80, NFLX: 628.90,
  DIS: 111.20, JPM: 201.40, GS: 462.80, COIN: 218.50,
  SPY: 516.20, QQQ: 441.80, IWM: 198.40, DIA: 385.70, VTI: 242.60,
  GLD: 222.80, XLF: 42.30, ARKK: 48.90,
  BTC: 87200, ETH: 3340, SOL: 148.50, XRP: 0.52, BNB: 384, DOGE: 0.157,
  ADA: 0.44, AVAX: 36.4, LINK: 14.8, DOT: 6.9,
  EURUSD: 1.0842, GBPUSD: 1.2640, USDJPY: 149.80, XAUUSD: 2318, XAGUSD: 27.40,
  'EUR/USD': 1.0842, 'GBP/USD': 1.2640, 'USD/JPY': 149.80,
  'GBP/JPY': 191.40, 'USD/CAD': 1.3620, 'AUD/USD': 0.6540,
  WTI: 82.40, BRENT: 86.20, NATGAS: 2.14,
  'ES1!': 5242, 'NQ1!': 18240, 'YM1!': 38920, 'RTY1!': 2064,
  GER40: 18150, UK100: 7820, JPN225: 38640,
};

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SignalNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forumId = searchParams.get('f') ?? 'alpha-signals';
  const isMobile = useMobile();

  const [direction, setDirection]   = useState<Direction>('long');
  const [ticker, setTicker]         = useState('NVDA');
  const [assetType, setAssetType]   = useState<AssetType>('equity');
  const [orderType, setOrderType]   = useState<OrderType>('market');
  const [entry, setEntry]           = useState('');
  const [zoneHigh, setZoneHigh]     = useState('');
  const [stopLoss, setStopLoss]     = useState('920.00');
  const [timeframe, setTimeframe]   = useState<Timeframe>('swing');
  const [targets, setTargets]       = useState(['1020.00', '1080.00']);
  const [thesis, setThesis]         = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'draft' } | null>(null);

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch]             = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter catalogue by asset type and search
  const catalogueForType = TICKER_CATALOGUE.filter(t =>
    assetType === 'options' ? t.assetType === 'equity' : t.assetType === assetType
  );
  const dropdownItems = search.trim()
    ? TICKER_CATALOGUE.filter(t =>
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase())
      )
    : catalogueForType;

  const selectTicker = (entry: TickerEntry) => {
    setTicker(entry.symbol);
    setSearch('');
    setDropdownOpen(false);
    // Auto-switch asset type if picking from a different type
    if (assetType !== 'options') setAssetType(entry.assetType);
  };

  const upperTicker  = ticker.trim().toUpperCase();
  const tickerEntry  = TICKER_CATALOGUE.find(t => t.symbol === upperTicker);
  const tickerName   = tickerEntry?.name;
  const mockPrice    = MOCK_PRICES[upperTicker] ?? 0;
  const displayPrice = mockPrice > 0 ? mockPrice : 0;

  const effectiveEntry =
    orderType === 'market' ? displayPrice :
    orderType === 'zone'   ? ((parseFloat(entry) || 0) + (parseFloat(zoneHigh) || 0)) / 2 :
    parseFloat(entry) || 0;

  const sl = parseFloat(stopLoss) || 0;
  const riskPerShare = effectiveEntry > 0 && sl > 0 ? Math.abs(effectiveEntry - sl) : 0;

  const getGain = (val: string) => {
    const t = parseFloat(val);
    if (!t || !effectiveEntry) return null;
    return direction === 'long' ? t - effectiveEntry : effectiveEntry - t;
  };

  const t1Gain = getGain(targets[0]);
  const rr     = t1Gain !== null && t1Gain > 0 && riskPerShare > 0
    ? (t1Gain / riskPerShare).toFixed(1) : '—';

  const rrNum  = parseFloat(rr);
  const rrColor =
    isNaN(rrNum)  ? 'var(--text-3)' :
    rrNum >= 2    ? '#1D9E75' :
    rrNum >= 1    ? '#BA7517' : '#E24B4A';

  const isForex = assetType === 'forex';
  const isCrypto = assetType === 'crypto';
  const currencySymbol = isForex || isCrypto ? '' : '$';
  const fmt = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (!n) return '—';
    return `${currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: isForex ? 4 : 2, maximumFractionDigits: isForex ? 4 : 2 })}`;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!upperTicker) errs.ticker = 'Enter a ticker symbol';
    if (sl <= 0) errs.stop = 'Enter a stop loss price';
    if (orderType === 'zone') {
      if (!parseFloat(entry) || !parseFloat(zoneHigh)) errs.entry = 'Enter both zone prices';
    } else if (orderType !== 'market') {
      if (effectiveEntry <= 0) errs.entry = 'Enter an entry price';
    }
    if (!parseFloat(targets[0])) errs.target = 'Enter at least one target price';
    return errs;
  };

  const handlePublish = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setToast({ msg: 'Signal published!', type: 'success' });
    setTimeout(() => navigate(`/forum?f=${forumId}`), 1500);
  };

  const handleSaveDraft = () => {
    const draft = { direction, ticker, assetType, orderType, entry, zoneHigh, stopLoss, timeframe, targets, thesis };
    localStorage.setItem(`signal-draft-${forumId}`, JSON.stringify(draft));
    setToast({ msg: 'Draft saved', type: 'draft' });
  };

  const SEC: React.CSSProperties = {
    padding: isMobile ? '14px 16px' : '16px 22px',
    borderBottom: '1px solid var(--border)',
  };

  const SLBL: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
    letterSpacing: '0.9px', marginBottom: 10, textTransform: 'uppercase' as const,
  };

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box' as const,
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: 15,
    fontFamily: 'inherit', outline: 'none',
  };

  const CHIP = (active: boolean, accent?: string): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
    border: `1px solid ${active ? (accent ?? 'var(--text)') : 'var(--border)'}`,
    background: active ? (accent ? `${accent}18` : 'var(--text)') : 'var(--surface-2)',
    color: active ? (accent ?? 'var(--bg)') : 'var(--text-2)',
    transition: 'all 0.12s',
  });

  const assetLabels: Record<AssetType, string> = {
    equity: 'Equity', options: 'Options', futures: 'Futures',
    crypto: 'Crypto', forex: 'Forex', etf: 'ETF',
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, padding: '12px 24px', borderRadius: 12,
          background: toast.type === 'success' ? '#1D9E75' : 'var(--surface)',
          color: toast.type === 'success' ? '#fff' : 'var(--text)',
          border: toast.type === 'draft' ? '1px solid var(--border)' : 'none',
          fontSize: 14, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
          pointerEvents: 'none',
        }}>
          {toast.type === 'success'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '14px 16px' : '16px 22px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>New signal</span>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-3)', padding: 0 }}
        >
          Cancel
        </button>
      </div>

      {/* ── DIRECTION ── */}
      <div style={SEC}>
        <div style={SLBL}>Direction</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => setDirection('long')} style={{
            padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: `1px solid ${direction === 'long' ? '#1D9E75' : 'var(--border)'}`,
            background: direction === 'long' ? 'rgba(29,158,117,0.12)' : 'var(--surface-2)',
            color: direction === 'long' ? '#1D9E75' : 'var(--text-2)',
            transition: 'all 0.12s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
            Long
          </button>
          <button onClick={() => setDirection('short')} style={{
            padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: `1px solid ${direction === 'short' ? '#E24B4A' : 'var(--border)'}`,
            background: direction === 'short' ? 'rgba(226,75,74,0.12)' : 'var(--surface-2)',
            color: direction === 'short' ? '#E24B4A' : 'var(--text-2)',
            transition: 'all 0.12s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            Short
          </button>
        </div>
      </div>

      {/* ── TICKER & ASSET TYPE ── */}
      <div style={SEC}>
        <div style={SLBL}>Ticker &amp; Asset Type</div>

        {/* Asset type chips first — determines what appears in dropdown */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {(Object.keys(assetLabels) as AssetType[]).map(type => (
            <button
              key={type}
              onClick={() => {
                setAssetType(type);
                setTicker('');
                setDropdownOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              style={CHIP(assetType === type)}
            >
              {assetLabels[type]}
            </button>
          ))}
        </div>

        {/* Ticker dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          {/* Input row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--surface-2)',
            border: `1px solid ${dropdownOpen ? 'var(--text)' : errors.ticker ? '#E24B4A' : 'var(--border)'}`,
            borderRadius: dropdownOpen ? '10px 10px 0 0' : 10,
            overflow: 'hidden', transition: 'border-color 0.12s',
          }}>
            {/* Selected ticker badge */}
            {ticker && !dropdownOpen && (
              <span style={{
                marginLeft: 12, padding: '4px 10px', borderRadius: 6,
                background: 'var(--text)', color: 'var(--bg)',
                fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>{ticker}</span>
            )}
            <input
              ref={inputRef}
              value={dropdownOpen ? search : (tickerName ? `${ticker} — ${tickerName}` : ticker)}
              onChange={e => {
                setSearch(e.target.value);
                if (!dropdownOpen) setDropdownOpen(true);
              }}
              onFocus={() => {
                setSearch('');
                setDropdownOpen(true);
              }}
              placeholder={`Search ${assetLabels[assetType]} tickers…`}
              style={{
                flex: 1, padding: '12px 14px', border: 'none', outline: 'none',
                background: 'transparent', color: 'var(--text)',
                fontSize: dropdownOpen ? 14 : 15, fontWeight: dropdownOpen ? 400 : 600,
                fontFamily: 'inherit',
              }}
            />
            {/* Price badge */}
            {!dropdownOpen && displayPrice > 0 && (
              <div style={{ padding: '0 14px', fontSize: 13, color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {fmt(displayPrice)}
              </div>
            )}
            {/* Chevron */}
            <button
              onClick={() => { setDropdownOpen(o => !o); if (!dropdownOpen) inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 12px', color: 'var(--text-3)', lineHeight: 1 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {dropdownOpen
                  ? <polyline points="18 15 12 9 6 15"/>
                  : <polyline points="6 9 12 15 18 9"/>}
              </svg>
            </button>
          </div>

          {/* Dropdown list */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--surface)',
              border: '1px solid var(--text)', borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              maxHeight: 240, overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}>
              {dropdownItems.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>
                  No tickers found
                </div>
              ) : dropdownItems.map((item, i) => (
                <button
                  key={item.symbol}
                  onMouseDown={e => { e.preventDefault(); selectTicker(item); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '10px 16px', border: 'none',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', minWidth: 60 }}>
                    {item.symbol}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>{item.name}</span>
                  {MOCK_PRICES[item.symbol] && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.assetType === 'forex' ? '' : item.assetType === 'crypto' ? '' : '$'}{MOCK_PRICES[item.symbol].toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {errors.ticker && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 6 }}>{errors.ticker}</div>}
      </div>

      {/* ── ORDER TYPE ── */}
      <div style={SEC}>
        <div style={SLBL}>Order Type</div>

        <div style={{
          display: 'flex', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', marginBottom: 12,
        }}>
          {([
            ['market',     'Market'],
            ['limit',      'Limit'],
            ['stop-limit', 'Stop limit'],
            ['zone',       'Zone'],
          ] as [OrderType, string][]).map(([key, label], i) => (
            <button
              key={key}
              onClick={() => setOrderType(key)}
              style={{
                flex: 1, padding: '10px 6px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: 'none', borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                background: orderType === key ? 'var(--text)' : 'var(--surface-2)',
                color: orderType === key ? 'var(--bg)' : 'var(--text-2)',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {orderType === 'market' && displayPrice > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', marginBottom: 14,
            background: 'rgba(24,95,165,0.08)', border: '1px solid rgba(24,95,165,0.25)', borderRadius: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span style={{ fontSize: 13, color: '#185FA5', lineHeight: 1.55 }}>
              Market order — signal will show current price at time of posting (<strong>{fmt(displayPrice)}</strong>) as the entry.
            </span>
          </div>
        )}

        {orderType === 'limit' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Entry price</div>
            <input value={entry} onChange={e => setEntry(e.target.value)} placeholder="0.00" style={INPUT} />
          </div>
        )}

        {orderType === 'stop-limit' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Stop-limit trigger price</div>
            <input value={entry} onChange={e => setEntry(e.target.value)} placeholder="0.00" style={INPUT} />
          </div>
        )}

        {orderType === 'zone' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Entry zone (low – high)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: 8, alignItems: 'center' }}>
              <input value={entry} onChange={e => setEntry(e.target.value)} placeholder="Lower" style={INPUT} />
              <span style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>–</span>
              <input value={zoneHigh} onChange={e => setZoneHigh(e.target.value)} placeholder="Upper" style={INPUT} />
            </div>
          </div>
        )}

        {/* Stop loss + timeframe */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Stop loss</div>
            <input value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="0.00" style={INPUT} />
            {errors.stop && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 4 }}>{errors.stop}</div>}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Timeframe</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['scalp', 'intraday', 'swing', 'position'] as Timeframe[]).map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} style={{
                  padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  border: `1px solid ${timeframe === tf ? 'var(--text)' : 'var(--border)'}`,
                  background: timeframe === tf ? 'var(--text)' : 'var(--surface-2)',
                  color: timeframe === tf ? 'var(--bg)' : 'var(--text-2)',
                }}>
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {errors.entry && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 8 }}>{errors.entry}</div>}
      </div>

      {/* ── TARGETS ── */}
      <div style={SEC}>
        <div style={SLBL}>Targets</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {targets.map((t, i) => {
            const gain = getGain(t);
            const pct  = gain && effectiveEntry ? ((Math.abs(gain) / effectiveEntry) * 100).toFixed(1) : null;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1D9E75', width: 22, flexShrink: 0 }}>T{i + 1}</span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    value={t}
                    onChange={e => setTargets(p => p.map((v, idx) => idx === i ? e.target.value : v))}
                    placeholder="0.00"
                    style={{ ...INPUT, paddingRight: pct ? 68 : 14 }}
                  />
                  {pct && gain !== null && (
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 12, fontWeight: 700, color: gain > 0 ? '#1D9E75' : '#E24B4A',
                      pointerEvents: 'none',
                    }}>
                      {gain > 0 ? '+' : ''}{pct}%
                    </span>
                  )}
                </div>
                {targets.length > 1 && (
                  <button
                    onClick={() => setTargets(p => p.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, flexShrink: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {errors.target && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 2 }}>{errors.target}</div>}

          {targets.length < 5 && (
            <button
              onClick={() => setTargets(p => [...p, ''])}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-3)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add target
            </button>
          )}
        </div>
      </div>

      {/* ── R:R RATIO ── */}
      {effectiveEntry > 0 && riskPerShare > 0 && (
        <div style={SEC}>
          <div style={SLBL}>R:R Ratio</div>
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Risk / Reward</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: rrColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {rr} : 1
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.9, textAlign: 'right' }}>
              <div>Risk: {fmt(riskPerShare)} / share</div>
              {targets.map((t, i) => {
                const g = getGain(t);
                const p = g && effectiveEntry ? ((Math.abs(g) / effectiveEntry) * 100).toFixed(1) : null;
                if (!g || !p) return null;
                return <div key={i} style={{ color: 'var(--text-2)' }}>T{i + 1} gain: {fmt(g)} (+{p}%)</div>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── THESIS ── */}
      <div style={SEC}>
        <div style={{ ...SLBL, marginBottom: 8 }}>
          Thesis{' '}
          <span style={{ fontSize: 9, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>
            (optional but encouraged)
          </span>
        </div>
        <textarea
          value={thesis}
          onChange={e => setThesis(e.target.value)}
          placeholder="Describe the setup, key levels, and your plan — e.g. breakout above base on high volume, trim at T1, trail to T2..."
          rows={5}
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.65, fontSize: 13, fontFamily: 'inherit' }}
        />
      </div>

      {/* ── LOCK WARNING ── */}
      <div style={SEC}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px', borderRadius: 10,
          background: 'rgba(202,138,4,0.07)', border: '1px solid rgba(202,138,4,0.22)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Once published, this signal is <strong style={{ color: 'var(--text)' }}>locked</strong>. Entry, targets and stop cannot be edited. The result will be auto-filled by live price data.
          </div>
        </div>
      </div>

      {/* ── SIGNAL PREVIEW ── */}
      <div style={SEC}>
        <div style={SLBL}>Signal Preview</div>
        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {upperTicker || '—'}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
              background: direction === 'long' ? '#1D9E75' : '#E24B4A', color: '#fff',
            }}>
              {direction === 'long'
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              }
              {direction === 'long' ? 'Long' : 'Short'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} · {assetLabels[assetType]}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${2 + targets.length}, 1fr)`,
            border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
          }}>
            <div style={{ background: 'var(--surface)', padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.6px', marginBottom: 5 }}>ENTRY</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                {effectiveEntry > 0 ? fmt(effectiveEntry) : '—'}
              </div>
            </div>
            {targets.map((t, i) => (
              <div key={i} style={{ background: 'var(--surface)', padding: '10px 12px', borderLeft: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.6px', marginBottom: 5 }}>TARGET {i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1D9E75' }}>
                  {parseFloat(t) > 0 ? fmt(t) : '—'}
                </div>
              </div>
            ))}
            <div style={{ background: 'var(--surface)', padding: '10px 12px', borderLeft: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.6px', marginBottom: 5 }}>STOP</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#E24B4A' }}>
                {parseFloat(stopLoss) > 0 ? fmt(stopLoss) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '14px 16px' : '16px 22px',
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        gap: 10,
      }}>
        <button
          onClick={handleSaveDraft}
          style={{
            padding: '11px 24px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)',
          }}
        >
          Save draft
        </button>
        <button
          onClick={handlePublish}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '11px 24px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 700,
            border: 'none', background: '#1D9E75', color: '#fff',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Publish signal
        </button>
      </div>

    </div>
  );
}
