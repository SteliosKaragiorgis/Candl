import { useState, useEffect, useRef } from 'react';
import { currentUser, APP_NAME, DEMO_USERS, DEMO_POSTS } from '../../data/demo';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMarketData } from '../../context/MarketDataContext';
import { fetchSearch, type SearchResult } from '../feed/TickerChart';
import type { User, Post } from '../../types/index';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

function CandlIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <line x1="5"  y1="2"  x2="5"  y2="22" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <rect x="3"   y="7"   width="4" height="10" rx="1" fill="#22c55e" opacity="0.3"/>
      <line x1="12" y1="1"  x2="12" y2="23" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
      <rect x="10"  y="5"   width="4" height="12" rx="1" fill="#22c55e"/>
      <line x1="19" y1="3"  x2="19" y2="21" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
      <rect x="17"  y="7"   width="4" height="9"  rx="1" fill="#22c55e" opacity="0.6"/>
    </svg>
  );
}

export default function Topbar({ onNotifClick, notifOpen }: { onNotifClick: () => void; notifOpen: boolean }) {
  const { quotes } = useMarketData();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  const { unreadCount } = useNotifications();
  const isNotifPage = location.pathname === '/notifications';

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tickerResults, setTickerResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounce(searchQuery, 250);

  const lower = debouncedQ.toLowerCase();
  const matchedUsers: User[] = debouncedQ
    ? Object.values(DEMO_USERS).filter(u =>
        u.name.toLowerCase().includes(lower) || u.username.toLowerCase().includes(lower)
      ).slice(0, 3)
    : [];
  const matchedPosts: Post[] = debouncedQ
    ? DEMO_POSTS.filter(p =>
        p.body.toLowerCase().includes(lower) ||
        ('ticker' in p && p.ticker?.toLowerCase().includes(lower))
      ).slice(0, 3)
    : [];

  useEffect(() => {
    if (!debouncedQ) { setTickerResults([]); return; }
    let cancelled = false;
    fetchSearch(debouncedQ)
      .then(r => { if (!cancelled) setTickerResults(r.slice(0, 4)); })
      .catch(() => { if (!cancelled) setTickerResults([]); });
    return () => { cancelled = true; };
  }, [debouncedQ]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const hasResults = matchedUsers.length > 0 || matchedPosts.length > 0 || tickerResults.length > 0;

  const goToSearch = (q = searchQuery) => {
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const tickers = ['NVDA', 'SPY', 'TSLA', 'AAPL', 'META', 'AMD', 'AMZN', 'MSFT'].map(s => {
    const q = quotes[s];
    return {
      label: s,
      price: q?.price > 0 ? q.price.toFixed(2) : '—',
      change: q?.price > 0 ? `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` : '—',
      up: (q?.changePct ?? 0) >= 0,
    };
  });

  return (
    <div style={{
      gridArea: 'topbar',
      background: 'var(--bg)',
      borderBottom: '0.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '12px',
      paddingRight: '16px',
      gap: '12px',
      zIndex: 20,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 5, flexShrink: 0,
          background: '#1a1a1a', border: '0.5px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CandlIcon />
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600, fontSize: '16px',
          color: 'var(--text)', letterSpacing: '-0.3px',
        }}>
          {APP_NAME}
        </span>
      </div>

      {/* Ticker tape */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <style>{`
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: flex;
            width: max-content;
            animation: ticker-scroll 30s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="ticker-track">
          {[...tickers, ...tickers].map(({ label, price, change, up }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, marginRight: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#888888', fontVariantNumeric: 'tabular-nums' }}>{label}</span>
              <span style={{ fontSize: '12px', color: '#888888', fontVariantNumeric: 'tabular-nums' }}>{price}</span>
              <span style={{
                fontSize: '12px', fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                color: up ? '#22c55e' : '#ef4444',
              }}>
                {change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: dropdownOpen && (hasResults || debouncedQ) ? '6px 6px 0 0' : '6px',
            padding: '7px 12px',
            transition: 'background 0.15s',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-3)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => { if (searchQuery) setDropdownOpen(true); }}
              placeholder="Search…"
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '13px', color: 'var(--text-2)', width: '140px',
                fontFamily: 'Inter, sans-serif',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') goToSearch();
                if (e.key === 'Escape') { setDropdownOpen(false); setSearchQuery(''); }
              }}
            />
          </div>

          {/* Dropdown */}
          {dropdownOpen && debouncedQ && (
            <div style={{
              position: 'absolute', top: '100%', right: 0,
              width: 300, background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              borderRadius: '0 0 6px 6px',
              zIndex: 100, overflow: 'hidden',
            }}>
              {!hasResults ? (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)' }}>No results for "{debouncedQ}"</div>
              ) : (
                <>
                  {matchedUsers.length > 0 && (
                    <>
                      <div style={{ padding: '6px 12px 3px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>People</div>
                      {matchedUsers.map(u => (
                        <div
                          key={u.id}
                          onClick={() => { navigate(`/profile/${u.id}`); setDropdownOpen(false); setSearchQuery(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-3)', fontSize: 9, fontWeight: 500,
                          }}>{u.initials}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>@{u.username}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {tickerResults.length > 0 && (
                    <>
                      <div style={{ padding: '6px 12px 3px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: matchedUsers.length > 0 ? '0.5px solid var(--border)' : 'none' }}>Tickers</div>
                      {tickerResults.map(r => (
                        <div
                          key={r.symbol + r.exchange}
                          onClick={() => { navigate(`/ticker/${r.symbol}`); setDropdownOpen(false); setSearchQuery(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: 26, height: 26, borderRadius: 3, flexShrink: 0,
                            background: 'var(--bg)', border: '0.5px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 500, color: 'var(--text-3)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>{r.symbol.slice(0, 4)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r.symbol}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.instrument_name}</div>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{r.exchange}</div>
                        </div>
                      ))}
                    </>
                  )}

                  {matchedPosts.length > 0 && (
                    <>
                      <div style={{ padding: '6px 12px 3px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: (matchedUsers.length > 0 || tickerResults.length > 0) ? '0.5px solid var(--border)' : 'none' }}>Posts</div>
                      {matchedPosts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { navigate(`/post/${p.id}`); setDropdownOpen(false); setSearchQuery(''); }}
                          style={{ padding: '7px 12px', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', marginBottom: 2 }}>{p.user.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.body}</div>
                        </div>
                      ))}
                    </>
                  )}

                  <div
                    onClick={() => goToSearch()}
                    style={{
                      padding: '8px 12px', fontSize: 11, color: '#1d9bf0', fontWeight: 500,
                      borderTop: '0.5px solid var(--border)', cursor: 'pointer', textAlign: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    See all results for "{debouncedQ}"
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={toggle}
          title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {isLight
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          }
        </button>

        {/* Notif bell */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative', width: 28, height: 28, borderRadius: '50%',
            background: unreadCount > 0 ? 'var(--green-bg)' : 'var(--surface)',
            border: `0.5px solid ${unreadCount > 0 ? 'var(--green-border)' : 'var(--border)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isNotifPage ? 'var(--green)' : 'var(--text-3)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--red)', border: '1.5px solid var(--surface)',
            }} />
          )}
        </button>

        {/* User pill */}
        <button className="user-pill" onClick={() => navigate(`/profile/${currentUser.id}`)}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)', fontSize: '9px', fontWeight: 500,
          }}>
            {currentUser.initials}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
            {currentUser.username}
          </span>
        </button>
      </div>
    </div>
  );
}
