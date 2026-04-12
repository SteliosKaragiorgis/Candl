import React, { useState } from 'react';
import type { Trade } from '../../types/trade';
import TradeDetailPanel from './TradeDetailPanel';

interface Props {
  trades: Trade[];
  onShareTrade: (trade: Trade) => void;
  onUpdateTrade: (id: string, updates: Partial<Trade>) => void;
  onDeleteTrade: (id: string) => void;
  onViewPost?: (postId: string) => void;
}

const COL = '100px 80px 80px 90px 80px 80px 70px 90px 1fr';

const HEADER_COLS = ['Symbol', 'Direction', 'Entry', 'Exit', 'P&L', 'R mult', 'Duration', 'Date', 'Actions'];

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

// ─── Trade Table ─────────────────────────────────────────────────────────────

export default function TradeTable({ trades, onShareTrade, onUpdateTrade, onDeleteTrade, onViewPost }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedTrade = trades.find(t => t.id === selectedId) ?? null;

  function handleDelete(id: string) {
    onDeleteTrade(id);
    if (selectedId === id) setSelectedId(null);
  }

  if (trades.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: 'var(--text-4)',
        gap: 10,
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>No trades match this filter</div>
        <div style={{ fontSize: 12 }}>Try a different filter or import a CSV</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: COL,
        padding: '8px 12px',
        background: 'var(--bg-surface)',
        borderRadius: '7px 7px 0 0',
        border: '0.5px solid var(--border)',
        borderBottom: 'none',
        marginTop: 12,
      }}>
        {HEADER_COLS.map(col => (
          <div key={col} style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-4)',
            cursor: 'pointer',
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Rows */}
      {trades.map((trade, idx) => {
        const isLast = idx === trades.length - 1;
        const isHovered = hovered === trade.id;
        const pnlPos = trade.pnl >= 0;
        const rPos   = trade.rMultiple >= 0;

        return (
          <div
            key={trade.id}
            onClick={() => setSelectedId(selectedId === trade.id ? null : trade.id)}
            onMouseEnter={() => setHovered(trade.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'grid',
              gridTemplateColumns: COL,
              padding: '10px 12px',
              border: '0.5px solid var(--border)',
              borderTop: 'none',
              background: isHovered ? 'var(--bg-surface)' : 'var(--bg-card)',
              cursor: 'pointer',
              alignItems: 'center',
              borderRadius: isLast ? '0 0 7px 7px' : 0,
              transition: 'background 0.1s',
            }}
          >
            {/* Symbol */}
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {trade.symbol}
            </div>

            {/* Direction */}
            <div>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 3,
                background: trade.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
                color: trade.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
                border: `0.5px solid ${trade.direction === 'LONG' ? 'var(--green-border)' : 'var(--red-border)'}`,
              }}>
                {trade.direction}
              </span>
            </div>

            {/* Entry */}
            <div style={{ fontSize: 12, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(trade.entry, trade.entry > 100 ? 2 : 5)}
            </div>

            {/* Exit */}
            <div style={{ fontSize: 12, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(trade.exit, trade.exit > 100 ? 2 : 5)}
            </div>

            {/* P&L */}
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: pnlPos ? 'var(--green)' : 'var(--red)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtPnl(trade.pnl)}
            </div>

            {/* R multiple */}
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: rPos ? 'var(--green)' : 'var(--red)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {rPos ? '+' : ''}{trade.rMultiple.toFixed(2)}R
            </div>

            {/* Duration */}
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {trade.duration}
            </div>

            {/* Date */}
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {fmtDate(trade.closedAt)}
            </div>

            {/* Actions */}
            <div onClick={e => e.stopPropagation()}>
              {trade.isPublished ? (
                <button
                  onClick={() => trade.postId && onViewPost?.(trade.postId)}
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 4,
                    background: 'var(--green-bg)',
                    border: '0.5px solid var(--green-border)',
                    color: 'var(--green)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Published
                </button>
              ) : (
                <ShareButton onClick={() => onShareTrade(trade)} />
              )}
            </div>
          </div>
        );
      })}

      {/* Detail Panel */}
      {selectedTrade && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 199,
              background: 'rgba(0, 0, 0, 0.3)',
            }}
          />
          <TradeDetailPanel
            trade={selectedTrade}
            onClose={() => setSelectedId(null)}
            onUpdate={updates => onUpdateTrade(selectedTrade.id, updates)}
            onDelete={() => handleDelete(selectedTrade.id)}
            onShare={() => onShareTrade(selectedTrade)}
            onViewPost={onViewPost}
          />
        </>
      )}
    </div>
  );
}

function ShareButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 11,
        padding: '3px 9px',
        borderRadius: 4,
        background: 'transparent',
        border: `0.5px solid ${hov ? 'var(--green-border)' : 'var(--border-hard)'}`,
        color: hov ? 'var(--green)' : 'var(--text-3)',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.1s',
      }}
    >
      Share ↗
    </button>
  );
}
