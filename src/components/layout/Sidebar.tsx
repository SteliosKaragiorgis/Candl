import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { privateUser, ryanC } from '../../data/demo';
import { useWatchlist } from '../../context/WatchlistContext';
import ComposerModal from '../feed/ComposerModal';
import { useChallenges } from '../../hooks/useChallenge';

const navItems = [
  { label: 'Feed', path: '/', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: 'News', path: '/news', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9"/><line x1="18" y1="14" x2="10" y2="14"/><line x1="18" y1="10" x2="10" y2="10"/><line x1="14" y1="18" x2="10" y2="18"/></svg> },
  { label: 'Watchlist', path: '/watchlist', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  { label: 'Prop Firm', path: '/prop-firm', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { label: 'Connections', path: '/connections', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { label: 'Settings', path: '/settings', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

function Sparkline({ points, positive }: { points: string; positive: boolean }) {
  return (
    <svg width="40" height="18" viewBox="0 0 64 32" fill="none">
      <polyline
        points={points}
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tickers } = useWatchlist();
  const [composerOpen, setComposerOpen] = useState(false);
  const challenges = useChallenges();
  const activeChallengesCount = challenges.filter(
    c => c.status === 'active' || c.status === 'near_limit',
  ).length;

  return (
    <div style={{
      gridArea: 'sidebar',
      background: 'var(--bg)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '8px 12px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
        {navItems.map(({ label, path, icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          const badge = label === 'Prop Firm' && activeChallengesCount > 0
            ? activeChallengesCount
            : null;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '10px 12px', borderRadius: 4,
                fontSize: 15, fontWeight: active ? 600 : 500,
                color: active ? '#f0f0f0' : '#c8c8c8',
                fontFamily: 'Inter, sans-serif',
                background: 'transparent', border: 'none', width: '100%',
                textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                justifyContent: 'space-between',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.color = '#e0e0e0';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = active ? '#f0f0f0' : '#c8c8c8';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {icon}
                {label}
              </span>
              {badge !== null && (
                <span style={{
                  background: 'var(--green-bg)', color: '#22c55e',
                  border: '0.5px solid var(--green-border)',
                  borderRadius: 4, fontSize: 11, fontWeight: 500,
                  padding: '1px 8px', fontVariantNumeric: 'tabular-nums',
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Post trade button */}
      <button
        onClick={() => setComposerOpen(true)}
        style={{
          width: '100%', background: 'var(--green-bg)', color: '#22c55e',
          borderRadius: 6, padding: '10px 14px',
          fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
          border: '0.5px solid var(--green-border)', cursor: 'pointer', marginBottom: 16,
          transition: 'opacity 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        + POST TRADE
      </button>

      {/* Watchlist */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.07em',
          color: '#555555', textTransform: 'uppercase',
          padding: '0 4px', marginBottom: 6,
        }}>
          Watchlist
        </div>
        {tickers.slice(0, 8).map(item => (
          <div
            key={item.symbol}
            onClick={() => navigate(`/ticker/${item.symbol}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 4px', borderRadius: 4, cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#c8c8c8', fontVariantNumeric: 'tabular-nums' }}>
                {item.symbol}
              </div>
              <div style={{ fontSize: 11, color: '#a8a8a8', fontVariantNumeric: 'tabular-nums' }}>
                {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
              </div>
            </div>
            <Sparkline points={item.sparkPoints} positive={item.changePct >= 0} />
            <div style={{
              fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
              color: item.changePct >= 0 ? '#22c55e' : '#ef4444',
              minWidth: '44px', textAlign: 'right',
            }}>
              {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* Suggested users */}
      <div style={{ marginTop: 8, borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', color: '#555555', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>
          Suggested
        </div>
        {[privateUser, ryanC].map(u => (
          <div
            key={u.id}
            onClick={() => navigate(`/profile/${u.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 4px', borderRadius: 4, cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 11, fontWeight: 500, position: 'relative',
            }}>
              {u.initials}
              {u.hasSentFollowRequest && (
                <div style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#22c55e', border: '1.5px solid var(--bg)',
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#c8c8c8' }}>{u.name}</span>
                {u.verified && (
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%', background: '#1d9bf0',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#555555' }}>
                {u.hasSentFollowRequest ? '· Wants to follow' : `@${u.username}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
