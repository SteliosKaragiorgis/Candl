import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_LEADERBOARD, DEMO_TRENDING, SUGGESTED_USERS } from '../../data/demo';
import NewsCountdown from './NewsCountdown';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
        color: 'var(--text-3)', textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function getHeatStyle(changeNum: number): React.CSSProperties {
  const abs = Math.abs(changeNum);
  if (changeNum > 0) {
    if (abs >= 3) return { background: 'rgba(22,163,74,0.20)', border: '1px solid rgba(22,163,74,0.28)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    if (abs >= 1) return { background: 'rgba(22,163,74,0.11)', border: '1px solid rgba(22,163,74,0.18)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    return { background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.12)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
  } else {
    if (abs >= 3) return { background: 'rgba(220,38,38,0.18)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    if (abs >= 1) return { background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.16)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    return { background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.10)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
  }
}

export default function RightPanel() {
  const navigate = useNavigate();
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      padding: '14px 14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Most Followed */}
      <Section title="Most Followed">
        {DEMO_LEADERBOARD.map(entry => (
          <div key={entry.rank} className="lb-row" onClick={() => navigate(`/profile/${entry.user.id}`)}>
            <div style={{
              width: '16px', fontSize: '10px', fontWeight: 700,
              color: entry.rank === 1 ? '#f59e0b' : 'var(--text-3)',
              fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, textAlign: 'center',
            }}>
              {entry.rank}
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${entry.user.avatarGradient[0]}, ${entry.user.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '10px', fontWeight: 700,
            }}>
              {entry.user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.user.name}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text4)' }}>
                {entry.user.mostActive}
              </div>
            </div>
            <div style={{
              fontSize: '11px', fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text3)', flexShrink: 0,
            }}>
              {entry.followersCount >= 1000
                ? `${(entry.followersCount / 1000).toFixed(1)}K`
                : entry.followersCount}
            </div>
          </div>
        ))}
      </Section>

      {/* Trending */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 9, paddingBottom: 7, borderBottom: '1px solid var(--border2)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase' }}>
            Trending
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', cursor: 'pointer' }}>
            See all →
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 14 }}>
          {DEMO_TRENDING.map(t => (
            <div
              key={t.ticker}
              style={getHeatStyle(t.changeNum)}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {t.ticker}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 3 }}>
                {t.posts}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: t.up ? 'var(--green)' : 'var(--red)' }}>
                {t.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Calendar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 9, paddingBottom: 7, borderBottom: '1px solid var(--border2)',
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 2,
            color: 'var(--text4)', textTransform: 'uppercase',
          }}>
            Economic Calendar
          </span>
        </div>
        <NewsCountdown />
      </div>

      {/* Who to follow */}
      <Section title="Who to Follow">
        {SUGGESTED_USERS.map(user => (
          <div key={user.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 0', marginBottom: '4px',
          }}>
            <div
              style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${user.avatarGradient[0]}, ${user.avatarGradient[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              }}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              {user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
              <div style={{ fontSize: '9px', color: 'var(--text4)' }}>{user.mostActive}</div>
            </div>
            <button
              className={`follow-btn ${followed[user.id] ? 'follow-btn-active' : ''}`}
              onClick={() => setFollowed(f => ({ ...f, [user.id]: !f[user.id] }))}
            >
              {followed[user.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </Section>
    </div>
  );
}
