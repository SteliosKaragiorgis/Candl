import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { privateUser, ryanC } from '../../data/demo';
import { useWatchlist } from '../../context/WatchlistContext';
import ComposerModal from '../feed/ComposerModal';
import { useChallenges } from '../../hooks/useChallenge';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';

const navItems = [
  { label: 'Feed', path: '/', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: 'News', path: '/news', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9"/><line x1="18" y1="14" x2="10" y2="14"/><line x1="18" y1="10" x2="10" y2="10"/><line x1="14" y1="18" x2="10" y2="18"/></svg> },
  { label: 'Watchlist', path: '/watchlist', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  { label: 'My trades', path: '/trades', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { label: 'Notifications', path: '/notifications', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
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
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  const { unreadCount: notifUnread } = useNotifications();
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
            : label === 'Notifications' && notifUnread > 0
            ? notifUnread
            : null;
          const isNotifBadge = label === 'Notifications' && badge !== null;
          const activeColor  = isLight ? '#16a34a' : '#f0f0f0';
          const inactiveColor = isLight ? '#374151' : '#c8c8c8';
          const activeBg     = isLight ? '#f0fdf4' : 'transparent';
          const hoverColor   = isLight ? '#111111' : '#e0e0e0';
          return (
            <div key={label} style={{ position: 'relative' }}>
              {active && isLight && (
                <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, background: '#16a34a', borderRadius: '0 2px 2px 0' }} />
              )}
              <button
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '10px 12px', borderRadius: 4,
                  fontSize: 15, fontWeight: active ? 600 : 500,
                  color: active ? activeColor : inactiveColor,
                  fontFamily: 'Inter, sans-serif',
                  background: active ? activeBg : 'transparent',
                  border: 'none', width: '100%',
                  textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'var(--surface2)';
                  e.currentTarget.style.color = hoverColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active ? activeBg : 'transparent';
                  e.currentTarget.style.color = active ? activeColor : inactiveColor;
                }}
              >
              <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {icon}
                {label}
              </span>
              {badge !== null && (
                <span style={{
                  background: isNotifBadge ? 'var(--red)' : 'var(--green-bg)',
                  color: isNotifBadge ? '#fff' : '#22c55e',
                  border: isNotifBadge ? 'none' : '0.5px solid var(--green-border)',
                  borderRadius: isNotifBadge ? 10 : 4,
                  fontSize: isNotifBadge ? 9 : 11, fontWeight: 500,
                  padding: isNotifBadge ? '1px 5px' : '1px 8px',
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: isNotifBadge ? 'auto' : undefined,
                }}>
                  {badge}
                </span>
              )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Post trade button */}
      <button
        onClick={() => setComposerOpen(true)}
        style={{
          width: '100%',
          background: isLight ? '#16a34a' : 'var(--green-bg)',
          color: isLight ? '#ffffff' : '#22c55e',
          borderRadius: 6, padding: '10px 14px',
          fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
          border: isLight ? 'none' : '0.5px solid var(--green-border)',
          cursor: 'pointer', marginBottom: 16,
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = isLight ? '#15803d' : 'var(--green-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = isLight ? '#16a34a' : 'var(--green-bg)')}
      >
        + POST TRADE
      </button>

      {/* Watchlist */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.07em',
          color: 'var(--text-muted)', textTransform: 'uppercase',
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
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {item.symbol}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
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
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>
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
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{u.name}</span>
                {u.verified && (
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%', background: '#1d9bf0',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                {u.hasSentFollowRequest ? '· Wants to follow' : `@${u.username}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Theme toggle */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
        <button
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '8px 4px', background: 'transparent', border: 'none',
            cursor: 'pointer', borderRadius: 4, color: 'var(--text-3)',
            fontSize: 12, fontFamily: 'Inter, sans-serif', transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {isLight
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          }
          {isLight ? 'Dark mode' : 'Light mode'}
        </button>
      </div>

      <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
