import { useState } from 'react';
import type { PendingTrade } from '../../hooks/usePendingTrade';
import TradeChart from './TradeChart';
import { useMT5Accounts } from '../../hooks/useMT5Accounts';
import { useTradeCandles, chartBounds } from '../../hooks/useTradeCandles';

interface Props {
  trade: PendingTrade;
  onPublish: () => void;
  onSkip: () => void;
  onRemindLater: () => void;
}

export default function PendingTradeCard({ trade, onPublish, onSkip, onRemindLater }: Props) {
  const [showChart, setShowChart] = useState(false);

  // Fetch real candles from the first connected MT5 account.
  // enabled=false until the user opens the chart to avoid upfront network requests.
  const { accounts } = useMT5Accounts();
  const connected = accounts.find(
    a => a.status === 'connected' && a.metaApiAccountId && a.metaApiRegion,
  );
  const { candles, timeframe: candleTF } = useTradeCandles({
    symbol:    trade.symbol,
    openTime:  trade.open_time,
    closeTime: trade.close_time,
    accountId: connected?.metaApiAccountId ?? '',
    region:    connected?.metaApiRegion    ?? '',
    enabled:   showChart && !!(connected?.metaApiAccountId && connected?.metaApiRegion),
  });

  const { sl: chartSL, tp: chartTP } = chartBounds(
    trade.direction, trade.entry_price, trade.exit_price, trade.sl, trade.tp,
  );

  const pnl = trade.net_profit;
  const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  const isLong = trade.direction.toUpperCase() === 'LONG';
  const rDisplay = trade.r_multiple >= 0 ? `+${trade.r_multiple}R` : `${trade.r_multiple}R`;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--green-border)',
      borderTop: '2px solid var(--green)',
      borderRadius: 8,
      padding: '14px 16px',
      margin: '10px 16px',
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="live-pulse" style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)' }}>Trade detected</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 4 }}>via MT5 · just now</span>
        </div>
        <button
          onClick={onSkip}
          style={{ fontSize: 18, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>

      {/* Trade row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{trade.symbol}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
          background: isLong ? 'var(--green-bg)' : 'var(--red-bg)',
          color: isLong ? 'var(--green)' : 'var(--red)',
          border: `0.5px solid ${isLong ? 'var(--green-border)' : 'var(--red-border)'}`,
        }}>
          {isLong ? 'LONG' : 'SHORT'}
        </span>
        <span style={{
          fontSize: 15, fontWeight: 700, marginLeft: 'auto',
          color: pnl >= 0 ? 'var(--green)' : 'var(--red)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pnlStr}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1, background: 'var(--border-soft)',
        borderRadius: 5, overflow: 'hidden', marginBottom: 10,
      }}>
        {[
          { label: 'ENTRY',      value: trade.entry_price.toFixed(4) },
          { label: 'EXIT',       value: trade.exit_price.toFixed(4)  },
          { label: 'R MULTIPLE', value: rDisplay                      },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', padding: '7px 10px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-4)', marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Chart toggle */}
      <button
        onClick={() => setShowChart(o => !o)}
        style={{
          fontSize: 12,
          color: 'var(--green)',
          textAlign: 'center',
          padding: '6px 0',
          borderTop: '0.5px solid var(--green-border)',
          cursor: 'pointer',
          background: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          width: '100%',
          marginBottom: 10,
          fontFamily: 'inherit',
        }}
      >
        {showChart ? 'Hide chart ↑' : 'View chart ↓'}
      </button>
      {showChart && (
        <div style={{ marginBottom: 10 }}>
          <TradeChart
            symbol={trade.symbol}
            direction={trade.direction}
            entryPrice={trade.entry_price}
            exitPrice={trade.exit_price}
            stopLoss={chartSL}
            takeProfit={chartTP}
            entryTime={trade.open_time}
            exitTime={trade.close_time}
            rMultiple={trade.r_multiple}
            priceData={candles ?? undefined}
            timeframe={candles ? candleTF : undefined}
            height={260}
          />
        </div>
      )}

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onPublish}
          style={{
            flex: 1, background: 'var(--green)', color: '#000000',
            fontSize: 12, fontWeight: 500, padding: 9,
            borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'center',
            fontFamily: 'inherit',
          }}
        >
          Add story and publish
        </button>
        <button
          onClick={onSkip}
          style={{
            fontSize: 12, color: 'var(--text-3)', padding: '9px 14px',
            borderRadius: 6, border: '0.5px solid var(--border-hard)',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Skip
        </button>
        <button
          onClick={onRemindLater}
          style={{
            fontSize: 12, color: 'var(--text-3)', padding: '9px 14px',
            borderRadius: 6, border: '0.5px solid var(--border-hard)',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Remind me later
        </button>
      </div>

    </div>
  );
}
