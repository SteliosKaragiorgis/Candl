import React, { useState } from 'react';
import type { Trade } from '../../types/trade';
import TradeChart from '../feed/TradeChart';
import { useMT5Accounts } from '../../hooks/useMT5Accounts';
import { useTradeCandles, chartBounds } from '../../hooks/useTradeCandles';

interface PanelProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: (updates: Partial<Trade>) => void;
  onDelete: () => void;
  onShare: () => void;
  onViewPost?: (postId: string) => void;
}

const EMOTIONS = ['calm', 'confident', 'excited', 'greedy', 'fearful', 'frustrated', 'patient', 'impulsive'];

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtPnl(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export default function TradeDetailPanel({ trade, onClose, onUpdate, onDelete, onShare, onViewPost }: PanelProps) {
  const [narrative, setNarrative] = useState(trade.narrative ?? '');
  const [emotion, setEmotion] = useState(trade.emotion ?? '');
  const [lesson, setLesson] = useState(trade.lesson ?? '');
  const [saved, setSaved] = useState(false);

  // Real candle data from MetaAPI. MT5 trade IDs are 'mt5_{accountId}_{positionId}'.
  // accountId is a UUID (no underscores), so split('_')[1] safely extracts it.
  const { accounts } = useMT5Accounts();
  const metaAccountId = trade.id.startsWith('mt5_') ? trade.id.split('_')[1] : '';
  const account = accounts.find(a => a.metaApiAccountId === metaAccountId);
  const { candles, timeframe: candleTF } = useTradeCandles({
    symbol:    trade.symbol,
    openTime:  trade.openedAt,
    closeTime: trade.closedAt,
    accountId: account?.metaApiAccountId ?? '',
    region:    account?.metaApiRegion    ?? '',
    enabled:   !!(account?.metaApiAccountId && account?.metaApiRegion),
  });

  // Synthesise safe SL/TP when the trade had none configured (value is 0)
  const { sl: chartSL, tp: chartTP } = chartBounds(
    trade.direction, trade.entry, trade.exit, trade.stopLoss, trade.takeProfit,
  );

  function handleSave() {
    onUpdate({ narrative, emotion, lesson });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const pnlPositive = trade.pnl >= 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 320,
      background: 'var(--bg-card)',
      borderLeft: '0.5px solid var(--border)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{trade.symbol}</span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 3,
          background: trade.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
          color: trade.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
          border: `0.5px solid ${trade.direction === 'LONG' ? 'var(--green-border)' : 'var(--red-border)'}`,
        }}>{trade.direction}</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 17,
          fontWeight: 700,
          color: pnlPositive ? 'var(--green)' : 'var(--red)',
          fontVariantNumeric: 'tabular-nums',
        }}>{fmtPnl(trade.pnl)}</span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 2px',
          }}
        >×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {/* Chart — always visible; shows real MetaAPI candles when available, generated otherwise */}
        <div style={{ marginBottom: 14 }}>
          <TradeChart
            symbol={trade.symbol}
            direction={trade.direction === 'LONG' ? 'long' : 'short'}
            entryPrice={trade.entry}
            exitPrice={trade.exit}
            stopLoss={chartSL}
            takeProfit={chartTP}
            entryTime={trade.openedAt}
            exitTime={trade.closedAt}
            pnl={trade.pnl}
            rMultiple={trade.rMultiple}
            priceData={candles ?? undefined}
            timeframe={candles ? candleTF : undefined}
            height={380}
          />
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginBottom: 14 }}>
          {[
            ['Entry',      trade.entry ? fmt(trade.entry, trade.entry > 100 ? 2 : 5) : '—'],
            ['Exit',       trade.exit  ? fmt(trade.exit,  trade.exit  > 100 ? 2 : 5) : '—'],
            ['Stop loss',  trade.stopLoss   ? fmt(trade.stopLoss,   trade.stopLoss   > 100 ? 2 : 5) : '—'],
            ['Take profit',trade.takeProfit ? fmt(trade.takeProfit, trade.takeProfit > 100 ? 2 : 5) : '—'],
            ['R multiple', `${trade.rMultiple >= 0 ? '+' : ''}${trade.rMultiple.toFixed(2)}R`],
            ['Duration',   trade.duration],
            ['Lot size',   trade.lotSize ? String(trade.lotSize) : '—'],
            ['Instrument', trade.instrument],
            ['Source',     trade.source],
            ['Date',       fmtDate(trade.closedAt)],
          ].map(([label, value]) => (
            <div key={label} style={{
              background: 'var(--bg-surface)',
              padding: '8px 10px',
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Journal */}
        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Journal
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Narrative</label>
            <textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              placeholder="What happened? Why did you take this trade?"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border)',
                borderRadius: 5,
                padding: '7px 10px',
                fontSize: 12,
                color: 'var(--text)',
                fontFamily: 'Inter, sans-serif',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Emotion</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {EMOTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmotion(emotion === e ? '' : e)}
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 4,
                    border: `0.5px solid ${emotion === e ? 'var(--green-border)' : 'var(--border-hard)'}`,
                    background: emotion === e ? 'var(--green-bg)' : 'transparent',
                    color: emotion === e ? 'var(--green)' : 'var(--text-3)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'capitalize',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Lesson learned</label>
            <textarea
              value={lesson}
              onChange={e => setLesson(e.target.value)}
              placeholder="What will you do differently next time?"
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border)',
                borderRadius: 5,
                padding: '7px 10px',
                fontSize: 12,
                color: 'var(--text)',
                fontFamily: 'Inter, sans-serif',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            style={{
              width: '100%',
              background: saved ? 'var(--green-bg)' : 'var(--green)',
              color: saved ? 'var(--green)' : '#000',
              border: saved ? '0.5px solid var(--green-border)' : 'none',
              borderRadius: 5,
              padding: '8px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {saved ? 'Saved ✓' : 'Save journal'}
          </button>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 14, borderTop: '0.5px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {trade.isPublished && trade.postId ? (
            <button
              onClick={() => onViewPost?.(trade.postId!)}
              style={{
                fontSize: 12,
                padding: '7px 12px',
                borderRadius: 5,
                border: '0.5px solid var(--green-border)',
                background: 'var(--green-bg)',
                color: 'var(--green)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
            >
              View post ↗
            </button>
          ) : (
            <button
              onClick={onShare}
              style={{
                fontSize: 12,
                padding: '7px 12px',
                borderRadius: 5,
                border: '0.5px solid var(--border-hard)',
                background: 'transparent',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Share to feed ↗
            </button>
          )}
          <button
            onClick={onDelete}
            style={{
              fontSize: 11,
              padding: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--red)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'left',
              opacity: 0.7,
            }}
          >
            Delete trade
          </button>
        </div>
      </div>
    </div>
  );
}
