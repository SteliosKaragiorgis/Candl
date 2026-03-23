type Tab = 'posts' | 'trades' | 'investments' | 'commentary' | 'stats';

const TABS: { id: Tab; label: string }[] = [
  { id: 'posts', label: 'All Posts' },
  { id: 'trades', label: 'Trades' },
  { id: 'investments', label: 'Investments' },
  { id: 'commentary', label: 'Commentary' },
  { id: 'stats', label: 'Stats' },
];

function StatsComingSoon() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>📊</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        Performance Stats Coming Soon
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '18px' }}>
        Connect your brokerage account to display verified trade performance, win rate, and P&amp;L history.
      </div>
      <button style={{
        fontSize: '12px', fontWeight: 700, padding: '8px 20px',
        borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: 'var(--blue)', color: '#fff',
      }}>
        Connect Brokerage
      </button>
    </div>
  );
}

export default function ProfileTabs({
  active, onChange, children,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '14px',
      }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`feed-tab ${active === id ? 'feed-tab-active' : ''}`}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {active === 'stats' ? <StatsComingSoon /> : children}
    </>
  );
}

export type { Tab };
