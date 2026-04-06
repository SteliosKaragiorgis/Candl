import type { PendingTrade } from '../../hooks/usePendingTrade';
import { currentUser } from '../../data/demo';
import TradeChart from './TradeChart';

const DEMO_BARS = [30, 34, 31, 37, 40, 38, 43, 47, 44, 50, 56, 63, 70, 76, 82];

function MiniBarChart() {
  const max = Math.max(...DEMO_BARS);
  const min = Math.min(...DEMO_BARS);
  const range = max - min;
  const chartH = 36;
  const barW = 4;
  const gap = 2;
  const totalW = DEMO_BARS.length * (barW + gap) - gap;

  return (
    <svg width={totalW} height={chartH} style={{ display: 'block', flexShrink: 0 }}>
      {DEMO_BARS.map((v, i) => {
        const barH = ((v - min) / range) * (chartH - 6) + 6;
        const isRecent = i >= DEMO_BARS.length - 4;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={chartH - barH}
            width={barW}
            height={barH}
            rx={1.5}
            fill={isRecent ? '#22c55e' : '#2a2a2a'}
          />
        );
      })}
    </svg>
  );
}

interface Props {
  trade: PendingTrade;
  onSkip: () => void;
  onPublish: () => void;
  onRemind: () => void;
}

export default function PendingTradeCard({ trade, onSkip, onPublish, onRemind }: Props) {
  const pnlStr = trade.net_profit >= 0 ? `+$${trade.net_profit.toFixed(2)}` : `-$${Math.abs(trade.net_profit).toFixed(2)}`;
  const closedMs = Date.now() - new Date(trade.close_time).getTime();
  const detectedMinsAgo = Math.round(closedMs / 60000);
  const timeLabel = detectedMinsAgo < 1 ? 'just now' : `${detectedMinsAgo}m ago`;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderTop: '1px solid #22c55e',
      borderRadius: 8,
      marginBottom: 16,
    }}>
      {/* "Awaiting story" label */}
      <div style={{
        padding: '8px 16px 0',
        fontSize: 10, fontWeight: 500, color: '#666666',
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        Awaiting story
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-2)', fontSize: 12, fontWeight: 500,
        }}>
          {currentUser.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{currentUser.name}</span>
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '0.5px',
              padding: '1px 6px', borderRadius: 3,
              background: '#0d1627', color: '#1d9bf0',
              border: '0.5px solid #1a3a5c',
            }}>MT5 VERIFIED</span>
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '0.5px',
              padding: '1px 6px', borderRadius: 3,
              background: 'var(--surface2)', color: 'var(--text-3)',
              border: '0.5px solid var(--border)',
            }}>STORY PENDING</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            @{currentUser.username} · {timeLabel}
          </div>
        </div>
      </div>

      {/* Trade block */}
      <div style={{
        margin: '0 16px 10px',
        background: 'var(--bg)',
        border: '0.5px solid var(--border)',
        borderRadius: 6,
        padding: '10px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {trade.symbol}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
              padding: '2px 7px', borderRadius: 4,
              background: '#0d1f12', color: '#22c55e', border: '0.5px solid #1a3a22',
            }}>
              {trade.direction.toUpperCase()}
            </span>
            <span style={{
              fontSize: 15, fontWeight: 600,
              color: trade.net_profit >= 0 ? '#22c55e' : '#ef4444',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {pnlStr}
            </span>
          </div>
          <MiniBarChart />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {[
            { label: 'ENTRY',    value: trade.entry_price.toFixed(4) },
            { label: 'EXIT',     value: trade.exit_price.toFixed(4) },
            { label: 'R MULT',   value: `${trade.r_multiple}R` },
            { label: 'DURATION', value: trade.duration_formatted },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              borderRadius: 4,
              padding: '6px 8px',
            }}>
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.6px', color: '#555555', textTransform: 'uppercase', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#d4d4d4', fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade chart — always expanded */}
      <div style={{ margin: '0 16px 10px' }}>
        <TradeChart
          symbol={trade.symbol}
          direction={trade.direction}
          entryPrice={trade.entry_price}
          exitPrice={trade.exit_price}
          stopLoss={trade.sl}
          takeProfit={trade.tp}
          entryTime={trade.open_time}
          exitTime={trade.close_time}
          pnl={trade.net_profit}
          rMultiple={trade.r_multiple}
          timeframe="H1"
        />
      </div>

      {/* Source badges */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 500,
          padding: '2px 8px', borderRadius: 3,
          background: '#0d1f12', color: '#22c55e',
          border: '0.5px solid #1a3a22',
        }}>✓ MT5 verified</span>
        <span style={{
          fontSize: 10, fontWeight: 500,
          padding: '2px 8px', borderRadius: 3,
          background: '#0d1f12', color: '#22c55e',
          border: '0.5px solid #1a3a22',
        }}>✓ Tradezella linked</span>
      </div>

      {/* Subtext */}
      <p style={{ margin: '0 16px 12px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>
        Add your narrative, emotion tag and lesson — takes 30 seconds. Only you see this until you publish.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 14px' }}>
        <button
          onClick={onPublish}
          style={{
            width: '100%',
            background: '#0d1f12',
            color: '#22c55e',
            border: '0.5px solid #1a3a22',
            borderRadius: 4,
            padding: '10px 0',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Add story and publish
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              background: 'transparent',
              color: 'var(--text-3)',
              border: '0.5px solid var(--border)',
              borderRadius: 4,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={onRemind}
            style={{
              flex: 1,
              background: 'transparent',
              color: 'var(--text-3)',
              border: '0.5px solid var(--border)',
              borderRadius: 4,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
