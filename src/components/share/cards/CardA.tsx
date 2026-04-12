import TradeChart from '../../trades/TradeChart';
import type { Trade } from '../../../types/trade';
import type { ShareCardUser } from '../ShareableTradeCard';

// ── Constants ──────────────────────────────────────────────────────────────────

const FF = 'Inter, Arial, sans-serif';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtPrice(price: number): string {
  if (price >= 10000) return price.toFixed(1);
  if (price >= 100)   return price.toFixed(2);
  if (price >= 10)    return price.toFixed(3);
  return price.toFixed(5);
}

function fmtPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(pnl).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

type TF = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

function bestTF(openedAt?: string, closedAt?: string): TF {
  if (!openedAt || !closedAt) return 'H1';
  const durationMin = (new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60_000;
  if (durationMin <= 15)    return 'M1';
  if (durationMin <= 60)    return 'M5';
  if (durationMin <= 240)   return 'M15';
  if (durationMin <= 1440)  return 'H1';
  if (durationMin <= 10080) return 'H4';
  return 'D1';
}

// Generate time axis labels across the trade window
function axisLabels(openedAt?: string, closedAt?: string): string[] {
  const closeMs = closedAt ? new Date(closedAt).getTime()  : Date.now();
  const openMs  = openedAt ? new Date(openedAt).getTime()  : closeMs - 4 * 3_600_000;
  return [0, 1, 2, 3].map(i => {
    const ts = openMs + (i / 3) * (closeMs - openMs);
    const d  = new Date(ts);
    const mo = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    const t  = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${mo} · ${t}`;
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  trade: Trade;
  user: ShareCardUser;
}

export default function CardA({ trade, user }: Props) {
  const isLong = trade.direction === 'LONG';
  const pnlPos = trade.pnl >= 0;
  const pnlStr = fmtPnl(trade.pnl);
  const rStr   = trade.rMultiple >= 0
    ? `+${trade.rMultiple.toFixed(2)}R`
    : `${trade.rMultiple.toFixed(2)}R`;

  const tf = bestTF(trade.openedAt, trade.closedAt);
  const timeLabels = axisLabels(trade.openedAt, trade.closedAt);

  return (
    <div style={{
      width: 400,
      background: '#0d0d0d',
      border: '0.5px solid #1e1e1e',
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: FF,
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 15px',
        borderBottom: '0.5px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#0d1f12', border: '1.5px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 500, color: '#22c55e', fontFamily: FF,
            flexShrink: 0,
          }}>
            {user.avatarInitials}
          </div>
          <div style={{ marginLeft: 9 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8e8', fontFamily: FF, lineHeight: 1.2 }}>
              {user.displayName}
            </div>
            <div style={{ fontSize: 11, color: '#444', marginLeft: 4, fontFamily: FF, display: 'inline' }}>
              @{user.handle}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', fontFamily: FF, lineHeight: 1 }}>
            Candl.
          </div>
          {user.isMT5Connected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: '#333', fontFamily: FF }}>MT5 verified</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Symbol Row ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '12px 15px 10px',
      }}>
        <span style={{
          fontSize: 20, fontWeight: 700, color: '#e8e8e8',
          letterSpacing: '-0.02em', fontFamily: FF,
        }}>
          {trade.symbol}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          padding: '2px 8px', borderRadius: 3, fontFamily: FF,
          background: isLong ? '#0d1f12' : '#1f0d0d',
          color:      isLong ? '#22c55e' : '#ef4444',
          border:     `0.5px solid ${isLong ? '#1a3a22' : '#3a1a1a'}`,
        }}>
          {isLong ? 'LONG' : 'SHORT'}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
          color: pnlPos ? '#22c55e' : '#ef4444',
          fontVariantNumeric: 'tabular-nums', fontFamily: FF,
        }}>
          {pnlStr}
        </span>
      </div>

      {/* ── Chart ───────────────────────────────────────────────────────────── */}
      <div style={{ overflow: 'hidden' }}>
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
            timeframe:  tf,
            openedAt:   trade.openedAt,
            closedAt:   trade.closedAt,
          }}
          height={200}
        />
      </div>

      {/* ── Time Axis ───────────────────────────────────────────────────────── */}
      <div style={{
        background: '#080808',
        borderBottom: '0.5px solid #1a1a1a',
        padding: '5px 15px',
        display: 'flex', justifyContent: 'space-between',
      }}>
        {timeLabels.map((label, i) => (
          <span key={i} style={{ fontSize: 9, color: '#222', fontFamily: FF }}>
            {label}
          </span>
        ))}
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1a1a1a' }}>
        {[
          { label: 'Entry',      value: fmtPrice(trade.entry), color: '#c8c8c8' },
          { label: 'Exit',       value: fmtPrice(trade.exit),  color: '#c8c8c8' },
          { label: 'Stop Loss',  value: trade.stopLoss && trade.stopLoss > 0 ? fmtPrice(trade.stopLoss) : '—', color: trade.stopLoss && trade.stopLoss > 0 ? '#ef4444' : '#333' },
          { label: 'R Multiple', value: rStr, color: trade.rMultiple >= 0 ? '#22c55e' : '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111', padding: '8px 11px' }}>
            <div style={{
              fontSize: 12, fontWeight: 500, color,
              fontVariantNumeric: 'tabular-nums', fontFamily: FF,
            }}>
              {value}
            </div>
            <div style={{
              fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: '#2a2a2a',
              marginTop: 2, fontFamily: FF,
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 15px',
        borderTop: '0.5px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Win Rate',     value: `${user.winRate}%`,          color: '#22c55e' },
            { label: 'Total Trades', value: String(user.totalTrades),    color: '#666666' },
            { label: 'Avg R:R',      value: `${user.avgRR.toFixed(1)}R`, color: '#666666' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{
                fontSize: 12, fontWeight: 500, color,
                fontVariantNumeric: 'tabular-nums', fontFamily: FF,
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: '#222',
                marginTop: 1, fontFamily: FF,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 500, color: '#22c55e',
          background: '#0d1f12', border: '0.5px solid #1a3a22',
          padding: '3px 9px', borderRadius: 4, fontFamily: FF,
          whiteSpace: 'nowrap',
        }}>
          candl.io/@{user.handle}
        </div>
      </div>
    </div>
  );
}

// Export helpers so CardC can reuse them
export { FF, fmtPrice, fmtPnl };
