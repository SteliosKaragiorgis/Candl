import { useState } from 'react';
import { currentUser } from '../../data/demo';

type Tab = 'trade' | 'investment' | 'commentary';

const TABS: { id: Tab; label: string }[] = [
  { id: 'trade', label: '📈 Trade' },
  { id: 'investment', label: '💼 Investment' },
  { id: 'commentary', label: '💬 Commentary' },
];

const TAGS: Record<Tab, string[]> = {
  trade: ['Ticker', 'Chart', 'Levels', 'Strategy'],
  investment: ['Ticker', 'Chart', 'Fundamentals', 'Catalyst'],
  commentary: ['Macro', 'Chart', 'News', 'Rates'],
};

const PLACEHOLDERS: Record<Tab, string> = {
  trade: 'Share a trade — ticker, entry, thesis, levels…',
  investment: 'Share an investment thesis — conviction, catalyst, valuation…',
  commentary: 'Market commentary — macro events, rate moves, sector rotation…',
};

export default function ComposeBox() {
  const [tab, setTab] = useState<Tab>('trade');

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '14px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700,
              padding: '5px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: tab === id ? 'var(--blue)' : 'transparent',
              color: tab === id ? '#fff' : 'var(--text-3)',
              border: tab === id ? 'none' : '1px solid var(--border)',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '12px', fontWeight: 700,
        }}>
          {currentUser.initials}
        </div>

        <div style={{ flex: 1 }}>
          <textarea
            placeholder={PLACEHOLDERS[tab]}
            rows={2}
            style={{
              width: '100%', resize: 'none', border: 'none', outline: 'none',
              fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif',
              background: 'transparent', lineHeight: 1.6,
            }}
          />
          <div style={{
            borderTop: '1px solid var(--border-2)', paddingTop: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {TAGS[tab].map(tag => (
                <button key={tag} className="compose-tag">{tag}</button>
              ))}
            </div>
            <button style={{
              background: 'var(--blue)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '7px 20px',
              fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.3px', cursor: 'pointer',
            }}>
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
