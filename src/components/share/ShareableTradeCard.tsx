import TradeChart from '../trades/TradeChart';
import type { Trade } from '../../types/trade';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShareCardUser {
  displayName: string;
  handle: string;
  avatarInitials: string;
  isMT5Connected: boolean;
  winRate: number;
  totalTrades: number;
  avgRR: number;
}

interface Props {
  trade: Trade;
  user: ShareCardUser;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEntry(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 100)  return price.toFixed(2);
  if (price >= 10)   return price.toFixed(3);
  return price.toFixed(5);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShareableTradeCard({ trade, user }: Props) {
  const isLong   = trade.direction === 'LONG';
  const pnlPos   = trade.pnl >= 0;
  const pnlStr   = pnlPos
    ? `+$${trade.pnl.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    : `-$${Math.abs(trade.pnl).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const rStr     = trade.rMultiple >= 0
    ? `+${trade.rMultiple.toFixed(2)}R`
    : `${trade.rMultiple.toFixed(2)}R`;

  // ── Render ────────────────────────────────────────────────────────────────
  const FF = 'Inter, Arial, sans-serif'; // explicit font stack on every element

  return (
    <div style={{
      width: 400,
      borderRadius: 12,
      overflow: 'hidden',
      border: '0.5px solid #1e1e1e',
      flexShrink: 0,
      fontFamily: FF,
    }}>

      {/* ── TOP SECTION ──────────────────────────────────────────────────── */}
      <div style={{ background: '#0d0d0d', padding: '14px 16px 0' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>

          {/* Left: avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, flexShrink: 0,
              background: '#0d1f12', border: '1.5px solid #22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#22c55e', fontFamily: FF,
            }}>
              {user.avatarInitials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8e8', lineHeight: 1, fontFamily: FF, whiteSpace: 'nowrap' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2, fontFamily: FF, whiteSpace: 'nowrap' }}>
                @{user.handle}
              </div>
            </div>
          </div>

          {/* Right: Candl. wordmark — flexShrink:0 so it never gets clipped */}
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', lineHeight: 1, fontFamily: FF, letterSpacing: '-0.01em' }}>
              Candl.
            </div>
            {user.isMT5Connected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: 3, background: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: '#555', fontFamily: FF }}>MT5 verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Trade row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#e8e8e8', letterSpacing: '-0.02em', fontFamily: FF }}>
            {trade.symbol}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 3, fontFamily: FF,
            background: isLong ? '#0d1f12' : '#1f0d0d',
            color:      isLong ? '#22c55e' : '#ef4444',
            border:     `1px solid ${isLong ? '#1a3a22' : '#3a1a1a'}`,
            flexShrink: 0,
          }}>
            {isLong ? 'LONG' : 'SHORT'}
          </span>
          <span style={{
            fontSize: 24, fontWeight: 700, marginLeft: 'auto',
            color: pnlPos ? '#22c55e' : '#ef4444',
            fontVariantNumeric: 'tabular-nums', fontFamily: FF,
          }}>
            {pnlStr}
          </span>
        </div>

        {/* Chart area */}
        <div style={{ borderRadius: 6, overflow: 'hidden' }}>
          <TradeChart
            trade={{
              symbol:     trade.symbol,
              direction:  trade.direction,
              entry:      trade.entry,
              exit:       trade.exit,
              stopLoss:   trade.stopLoss,
              takeProfit: trade.takeProfit,
              pnl:        trade.pnl,
              rMultiple:  trade.rMultiple,
              timeframe:  'H1',
              openedAt:   trade.openedAt,
              closedAt:   trade.closedAt,
            }}
            height={120}
          />
        </div>
      </div>

      {/* ── BOTTOM SECTION ───────────────────────────────────────────────── */}
      <div style={{
        background: '#111111',
        padding: '12px 16px',
        borderTop: '0.5px solid #1a1a1a',
      }}>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, borderRadius: 6, overflow: 'hidden',
          background: '#1a1a1a', marginBottom: 12,
        }}>
          {[
            { label: 'Entry',      value: fmtEntry(trade.entry), color: '#c8c8c8' },
            { label: 'Exit',       value: fmtEntry(trade.exit),  color: '#c8c8c8' },
            { label: 'Stop Loss',  value: trade.stopLoss && trade.stopLoss > 0 ? fmtEntry(trade.stopLoss) : '—', color: '#ef4444' },
            { label: 'R Multiple', value: rStr, color: trade.rMultiple >= 0 ? '#22c55e' : '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#0d0d0d', padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', fontFamily: FF }}>
                {value}
              </div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#444', marginTop: 3, fontFamily: FF }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Consistency stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Win Rate',     value: `${user.winRate}%`,          color: '#22c55e' },
              { label: 'Total Trades', value: String(user.totalTrades),    color: '#888'    },
              { label: 'Avg R:R',      value: `${user.avgRR.toFixed(1)}R`, color: '#888'    },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 12, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', fontFamily: FF }}>
                  {value}
                </div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#333', marginTop: 2, fontFamily: FF }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Watermark */}
          <div style={{
            fontSize: 10, fontWeight: 600, color: '#22c55e',
            background: '#0d1f12', border: '1px solid #1a3a22',
            padding: '4px 10px', borderRadius: 4, fontFamily: FF,
            whiteSpace: 'nowrap',
          }}>
            {'candl.io/@' + user.handle}
          </div>
        </div>
      </div>
    </div>
  );
}
