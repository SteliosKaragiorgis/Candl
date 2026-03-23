import { useMobile } from '../../hooks/useMobile';

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
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '32px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
        Performance stats coming soon
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65, maxWidth: 300, margin: '0 auto 20px' }}>
        Connect your brokerage to verify real trade performance.
        Verified stats build trust with your followers.
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
        borderRadius: 9, padding: '10px 20px',
        fontSize: 13, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer',
      }}>
        Get notified when available →
      </div>
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
  const isMobile = useMobile();

  return (
    <>
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '14px',
        overflowX: isMobile ? 'auto' : undefined,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`feed-tab ${active === id ? 'feed-tab-active' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
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
