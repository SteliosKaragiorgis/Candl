import type { PendingTrade } from '../../hooks/usePendingTrade';

interface Props {
  trade: PendingTrade;
  onAddStory: () => void;
  onDismiss: () => void;
}

export default function TradeDetectedToast({ trade, onAddStory, onDismiss }: Props) {
  const pnlStr = trade.net_profit >= 0 ? `+$${trade.net_profit.toFixed(2)}` : `-$${Math.abs(trade.net_profit).toFixed(2)}`;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderLeft: '2px solid #22c55e',
      borderRadius: 6,
      padding: '10px 14px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Pulsing green dot */}
      <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
          position: 'absolute', top: 0, left: 0,
        }} />
        <div className="ping-dot" style={{
          width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
          position: 'absolute', top: 0, left: 0,
        }} />
      </div>

      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', fontWeight: 400, lineHeight: 1.4 }}>
        New trade detected —{' '}
        <span style={{ fontWeight: 500, color: 'var(--text)' }}>{trade.symbol}</span>
        {' '}closed via MT5 ·{' '}
        <span style={{ color: trade.net_profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{pnlStr}</span>
      </span>

      <button
        onClick={onAddStory}
        style={{
          background: 'transparent',
          border: '0.5px solid var(--border)',
          borderRadius: 4,
          color: 'var(--text-3)',
          fontSize: 11,
          fontWeight: 500,
          padding: '4px 10px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Add story
      </button>

      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-3)',
          fontSize: 18,
          lineHeight: 1,
          padding: '0 2px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
