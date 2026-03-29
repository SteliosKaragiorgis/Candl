import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { privateUser, ryanC } from '../../data/demo';
import { useWatchlist } from '../../context/WatchlistContext';
import ComposerModal from '../feed/ComposerModal';
import { MY_FORUMS } from '../../pages/ForumPage';

const navItems = [
  { label: 'Feed', path: '/', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: 'News', path: '/news', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9"/><line x1="18" y1="14" x2="10" y2="14"/><line x1="18" y1="10" x2="10" y2="10"/><line x1="14" y1="18" x2="10" y2="18"/></svg> },
  { label: 'Watchlist', path: '/watchlist', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  { label: 'Portfolio', path: '/portfolio', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
{ label: 'Settings', path: '/settings', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

type GroupType = 'investment' | 'trading' | 'topic';

const GROUP_TYPE_CFG: Record<GroupType, { label: string; color: string }> = {
  investment: { label: 'Investment', color: '#185FA5' },
  trading:    { label: 'Trading',    color: '#1D9E75' },
  topic:      { label: 'Topic',      color: '#7c3aed' },
};

function Sparkline({ points, positive }: { points: string; positive: boolean }) {
  return (
    <svg width="40" height="20" viewBox="0 0 64 32" fill="none">
      <polyline
        points={points}
        stroke={positive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tickers } = useWatchlist();
  const [searchParams] = useSearchParams();
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div style={{
      gridArea: 'sidebar',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '10px 8px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
        {navItems.map(({ label, path, icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <button
              key={label}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
              onClick={() => navigate(path)}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* MY FORUMS */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px', marginBottom: 4,
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)', textTransform: 'uppercase' }}>
            My Groups
          </span>
          <button style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            + new
          </button>
        </div>

        {(['investment', 'trading', 'topic'] as GroupType[]).map(gt => {
          const groupForums = MY_FORUMS.filter(f => f.groupType === gt);
          if (groupForums.length === 0) return null;
          const gtCfg = GROUP_TYPE_CFG[gt];
          return (
            <div key={gt}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', color: gtCfg.color, textTransform: 'uppercase', padding: '6px 4px 3px', opacity: 0.8 }}>
                {gtCfg.label}
              </div>
              {groupForums.map(f => {
                const onForumPage = location.pathname === '/forum' || (location.pathname.startsWith('/forum/') && !location.pathname.includes('discover'));
                const selectedId = searchParams.get('f') ?? MY_FORUMS[0].id;
                const active = onForumPage && selectedId === f.id;
                return (
                  <button
                    key={f.id}
                    className={`nav-item ${active ? 'nav-item-active' : ''}`}
                    onClick={() => navigate(`/forum?f=${f.id}`)}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{f.name}</span>
                  </button>
                );
              })}
            </div>
          );
        })}

        <button
          className="nav-item"
          onClick={() => navigate('/forum/discover')}
          style={{ color: 'var(--text-3)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Discover groups
        </button>
      </div>

      {/* Post trade button */}
      <button className="post-btn" onClick={() => setComposerOpen(true)} style={{ marginBottom: '16px' }}>
        + POST TRADE
      </button>

      {/* Watchlist */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
          color: 'var(--text-3)', textTransform: 'uppercase',
          padding: '0 4px', marginBottom: '6px',
        }}>
          Watchlist
        </div>
        {tickers.slice(0, 8).map(item => (
          <div key={item.symbol} className="watchlist-row" onClick={() => navigate(`/ticker/${item.symbol}`)} style={{ cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                {item.symbol}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
              </div>
            </div>
            <Sparkline points={item.sparkPoints} positive={item.changePct >= 0} />
            <div style={{
              fontSize: '10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
              color: item.changePct >= 0 ? 'var(--green)' : 'var(--red)',
              minWidth: '44px', textAlign: 'right',
            }}>
              {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* Private user teaser */}
      <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>
          Suggested
        </div>
        {[privateUser, ryanC].map(u => (
          <div
            key={u.id}
            onClick={() => navigate(`/profile/${u.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${u.avatarGradient[0]}, ${u.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 9, fontWeight: 700, position: 'relative',
            }}>
              {u.initials}
              {u.hasSentFollowRequest && (
                <div style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--blue)', border: '1.5px solid var(--surface)',
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{u.name}</span>
                {u.verified && <svg width="11" height="11" viewBox="0 0 24 24" fill="#3b82f6"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                {u.isPrivate && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text4)' }}>
                {u.hasSentFollowRequest ? '• Wants to follow you' : `@${u.username}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
