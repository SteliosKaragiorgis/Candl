'use client';

import { useState } from 'react';
import { DEMO_USERS } from '@/lib/demo-data';

const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

export default function ComposeBox() {
  const [activeTab, setActiveTab] = useState<'trade' | 'investment'>('trade');
  const isTrade = activeTab === 'trade';

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8e8e8', borderRadius: '14px',
      padding: '16px 20px', marginBottom: '14px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('trade')}
          style={{
            ...INTER, fontSize: '12px', fontWeight: 700,
            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
            background: isTrade ? '#0047FF' : 'transparent',
            color: isTrade ? '#fff' : '#bbb',
            border: isTrade ? 'none' : '1px solid #e8e8e8',
          }}
        >
          📈 Trade
        </button>
        <button
          onClick={() => setActiveTab('investment')}
          style={{
            ...INTER, fontSize: '12px', fontWeight: 700,
            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
            background: !isTrade ? '#0047FF' : 'transparent',
            color: !isTrade ? '#fff' : '#bbb',
            border: !isTrade ? 'none' : '1px solid #e8e8e8',
          }}
        >
          💼 Investment
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #0047FF, #60a5fa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
        }}>
          {DEMO_USERS.currentUser.initials}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            placeholder={
              isTrade
                ? 'Share a trade — entry, thesis, levels…'
                : 'Share an investment thesis — conviction, catalyst, valuation…'
            }
            rows={2}
            style={{
              width: '100%', resize: 'none', border: 'none', outline: 'none',
              fontSize: '14px', color: '#0a0a0a', fontFamily: 'Inter, sans-serif',
              fontStyle: 'italic', background: 'transparent', lineHeight: 1.5,
            }}
          />
          <div style={{ borderTop: '1px solid #f3f3f3', paddingTop: '7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="compose-tag" style={{ fontSize: '12px', padding: '5px 12px' }}>Ticker</button>
              <button className="compose-tag" style={{ fontSize: '12px', padding: '5px 12px' }}>Chart</button>
              {isTrade
                ? <button className="compose-tag" style={{ fontSize: '12px', padding: '5px 12px' }}>Levels</button>
                : <button className="compose-tag" style={{ fontSize: '12px', padding: '5px 12px' }}>Fundamentals</button>
              }
            </div>
            <button style={{
              background: '#0047FF', color: '#fff', border: 'none',
              borderRadius: '7px', padding: '7px 20px', fontSize: '12px',
              fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              letterSpacing: '0.3px',
            }}>
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
