import type { User } from '../../types';

const SECTORS = [
  { name: 'Technology', pct: 48 },
  { name: 'Broad Market', pct: 22 },
  { name: 'Energy', pct: 15 },
  { name: 'Healthcare', pct: 10 },
  { name: 'Other', pct: 5 },
];

const STRATEGIES = [
  { name: 'Swing', count: 12, color: 'var(--blue)' },
  { name: 'Momentum', count: 8, color: 'var(--green)' },
  { name: 'Options', count: 6, color: 'var(--amber)' },
  { name: 'Scalp', count: 5, color: 'var(--red)' },
];

export default function ProfileSidebar({ user }: { user: User }) {
  const total = STRATEGIES.reduce((s, st) => s + st.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* About card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          About
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text2)' }}>Most active: </span>{user.mostActive}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {user.mostActive.split(' · ').map(tag => (
            <span key={tag} style={{
              fontSize: '10px', padding: '2px 9px',
              borderRadius: '20px', background: 'var(--surface2)',
              color: 'var(--text3)', border: '1px solid var(--border)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Strategy breakdown */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
          Strategy Mix
        </div>
        {/* Donut-ish bar */}
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
          {STRATEGIES.map(s => (
            <div key={s.name} style={{
              width: `${(s.count / total) * 100}%`,
              background: s.color,
            }} />
          ))}
        </div>
        {STRATEGIES.map(s => (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 0',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--text-2)', flex: 1 }}>{s.name}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
              {s.count}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
              {Math.round((s.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Sector exposure */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
          Sector Exposure
        </div>
        {SECTORS.map(s => (
          <div key={s.name} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-2)' }}>{s.name}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                {s.pct}%
              </span>
            </div>
            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)' }}>
              <div style={{
                width: `${s.pct}%`, height: '100%',
                borderRadius: '2px', background: 'var(--blue)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
