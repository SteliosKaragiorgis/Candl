import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, FormattedText } from '../../../lib/postUtils';
import TradeChart, { type TradeChartTrade } from '../../trades/TradeChart';
import type { Post } from '../../../types/post';
import ShareModal from '../../share/ShareModal';
import ShareDropdown from '../ShareDropdown';
import type { ShareCardUser } from '../../share/ShareableTradeCard';
import type { Trade } from '../../../types/trade';
import { useLikes } from '../../../hooks/useLikes';
import { useComments } from '../../../hooks/useComments';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 10000) return p.toFixed(1);
  if (p >= 100)   return p.toFixed(2);
  if (p >= 1)     return p.toFixed(4);
  return p.toFixed(5);
}

function fmtPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  return (pnl >= 0 ? '+$' : '-$') + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtR(r: number): string {
  return (r >= 0 ? '+' : '') + r.toFixed(2) + 'R';
}

function isDataComplete(t: { entry: number; exit: number; pnl: number; rMultiple: number }): boolean {
  return t.entry > 0 && t.exit > 0 && t.entry !== t.exit && t.pnl !== 0;
}

// Generate 5 evenly-spaced axis time labels across the trade window
function axisLabels(openedAt?: string, closedAt?: string): string[] {
  const closeMs = closedAt  ? new Date(closedAt).getTime()  : Date.now();
  const openMs  = openedAt  ? new Date(openedAt).getTime()  : closeMs - 4 * 3_600_000;
  return [0, 1, 2, 3, 4].map(i => {
    const ts = openMs + (i / 4) * (closeMs - openMs);
    const d  = new Date(ts);
    const mo = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    const t  = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${mo} · ${t}`;
  });
}

type TF = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
const TIMEFRAMES: TF[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

/** Pick a default timeframe that shows ~20–40 candles for the trade duration. */
function bestTF(openedAt?: string, closedAt?: string): TF {
  if (!openedAt || !closedAt) return 'H1';
  const durationMin = (new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60_000;
  if (durationMin <= 15)   return 'M1';
  if (durationMin <= 60)   return 'M5';
  if (durationMin <= 240)  return 'M15';
  if (durationMin <= 1440) return 'H1';
  if (durationMin <= 10080) return 'H4';
  return 'D1';
}

// ── Section 1+2 header/narrative shared with LossPost ─────────────────────────

export function TradeCardHeader({
  post,
  badgeBg,
  badgeColor,
  badgeBorder,
}: {
  post: Post
  badgeBg: string
  badgeColor: string
  badgeBorder: string
}) {
  const a = post.author;
  return (
    <>
      {/* Section 1 — header */}
      <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'var(--green-bg)', border: '0.5px solid var(--green-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500, color: 'var(--green)',
        }}>
          {a.avatarInitials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              {a.displayName}
            </span>

            {a.isMT5Connected && (
              <span style={{
                width: 15, height: 15, borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.5L4 7.5L8 3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}

            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>@{a.handle}</span>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {formatRelativeTime(post.createdAt)}
            </span>

            {/* Trade badge */}
            <span style={{
              marginLeft: 'auto',
              fontSize: 10, fontWeight: 500,
              padding: '2px 7px', borderRadius: 3,
              background: badgeBg, color: badgeColor,
              border: `0.5px solid ${badgeBorder}`,
            }}>
              Trade
            </span>
          </div>

          {/* Bio sub-row */}
          {a.bio && (
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>
              {a.bio}
            </div>
          )}
        </div>
      </div>

      {/* Section 2 — narrative */}
      {post.body && (
        <div style={{ padding: '0px 16px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
          <FormattedText text={post.body} />
        </div>
      )}
    </>
  );
}

// ── Actions strip (shared) ────────────────────────────────────────────────────

export function TradeCardActions({ post, showShare = true, onShareCard }: { post: Post; showShare?: boolean; onShareCard?: () => void }) {
  const navigate = useNavigate();
  const { toggle: toggleLike, isLiked, getLikeCount } = useLikes();
  const { commentCount } = useComments();

  const liked = isLiked(post.id, post.isLiked);
  const likeCount = getLikeCount(post.id, post.likes);
  const totalComments = commentCount(post.id, post.comments);

  const shareRef = useRef<HTMLButtonElement>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: 'var(--text-3)',
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  };

  function hoverOn(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.color = 'var(--text-2)';
  }
  function hoverOff(e: React.MouseEvent<HTMLButtonElement>, isLikedBtn = false) {
    e.currentTarget.style.color = isLikedBtn && liked ? '#f91880' : 'var(--text-3)';
  }

  const shareTitle = `${post.tradeData?.symbol ?? '—'} ${post.tradeData?.direction ?? ''} trade by @${post.author.handle}`;

  return (
    <div style={{
      padding: '11px 16px',
      borderTop: '0.5px solid var(--border)',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      {/* Like */}
      <button
        onClick={() => toggleLike(post)}
        style={{ ...btnStyle, color: liked ? '#f91880' : 'var(--text-3)' }}
        onMouseEnter={hoverOn}
        onMouseLeave={e => hoverOff(e, true)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24"
          fill={liked ? '#f91880' : 'none'}
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className={liked ? 'like-pop' : ''}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {likeCount}
      </button>

      {/* Comment — navigate to post detail */}
      <button
        style={btnStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
        onClick={e => { e.stopPropagation(); navigate(`/post/${post.id}#comments`); }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalComments}
      </button>

      {/* Share icon — opens ShareDropdown */}
      <button
        ref={shareRef}
        style={{ ...btnStyle, color: shareOpen ? 'var(--text-2)' : 'var(--text-3)' }}
        onMouseEnter={hoverOn}
        onMouseLeave={e => { if (!shareOpen) hoverOff(e); }}
        onClick={e => { e.stopPropagation(); setShareOpen(v => !v); }}
        aria-label="Share"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>

      {shareOpen && (
        <ShareDropdown
          postId={post.id}
          title={shareTitle}
          anchorRef={shareRef}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Share ↗ — image export modal */}
      {showShare && (
        <button
          onClick={e => { e.stopPropagation(); onShareCard?.(); }}
          style={{
            marginLeft: 'auto',
            fontSize: 12, color: 'var(--green)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          Share ↗
        </button>
      )}
    </div>
  );
}

// ── TradePostDark ─────────────────────────────────────────────────────────────

interface Props {
  post: Post
}

function postToShareTrade(post: Post): Trade {
  const t = post.tradeData!;
  return {
    id:          post.id,
    symbol:      t.symbol,
    direction:   t.direction,
    entry:       t.entry,
    exit:        t.exit,
    stopLoss:    t.stopLoss,
    takeProfit:  t.takeProfit,
    pnl:         t.pnl,
    rMultiple:   t.rMultiple,
    duration:    t.duration,
    durationMs:  0,
    openedAt:    post.createdAt,
    closedAt:    post.createdAt,
    source:      t.source as 'MT5' | 'CSV' | 'MANUAL',
    instrument:  'OTHER',
    isPublished: true,
    postId:      post.id,
  };
}

function postToShareUser(post: Post): ShareCardUser {
  const a = post.author;
  return {
    displayName:    a.displayName,
    handle:         a.handle,
    avatarInitials: a.avatarInitials,
    isMT5Connected: a.isMT5Connected,
    winRate:        a.winRate  ?? 0,
    totalTrades:    a.totalTrades ?? 0,
    avgRR:          a.avgRR   ?? 0,
  };
}

export default function TradePostDark({ post }: Props) {
  const [hovered, setHovered]         = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const t      = post.tradeData!;
  const [activeTF, setActiveTF]       = useState<TF>(() => bestTF(t.openedAt, t.closedAt));
  const a      = post.author;
  const isLong = t.direction === 'LONG';
  const isWin  = t.pnl >= 0;
  const complete = isDataComplete(t);

  const timeLabels = axisLabels(t.openedAt, t.closedAt);

  const chartTrade: TradeChartTrade = {
    symbol:      t.symbol,
    direction:   t.direction,
    entry:       t.entry,
    exit:        t.exit,
    stopLoss:    t.stopLoss,
    takeProfit:  t.takeProfit,
    pnl:         t.pnl,
    rMultiple:   t.rMultiple,
    timeframe:   activeTF,
    openedAt:    t.openedAt,
    closedAt:    t.closedAt,
  };

  // FIX 3 — Stop loss display
  const slValue  = t.stopLoss && t.stopLoss > 0 ? fmtPrice(t.stopLoss) : 'Not set';
  const slColor  = t.stopLoss && t.stopLoss > 0 ? '#ef4444' : 'var(--text-4)';

  // FIX 3 — R multiple display
  const rValue = t.rMultiple !== 0 ? fmtR(t.rMultiple) : 'Pending';
  const rColor = t.rMultiple > 0 ? 'var(--green)' : t.rMultiple < 0 ? 'var(--red)' : 'var(--text-4)';

  // FIX 4 — Win rate threshold
  const totalTrades = a.totalTrades ?? 0;
  const winRateValue = totalTrades >= 10 && a.winRate != null ? `${a.winRate}%` : '—';
  const winRateColor = totalTrades >= 10 && a.winRate != null ? '#22c55e' : 'var(--text-4)';

  return (
    <>
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-hard)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }}
    >
      {/* Section 1+2 — header + narrative */}
      <TradeCardHeader
        post={post}
        badgeBg="var(--green-bg)"
        badgeColor="var(--green)"
        badgeBorder="var(--green-border)"
      />

      {/* Section 3 — always-dark trade block */}
      <div style={{ background: '#0a0a0a', borderTop: '0.5px solid var(--border)' }}>

        {/* 3A — Symbol / direction / P&L + TF tabs */}
        <div style={{ padding: '16px 18px 12px' }}>

          {/* Top row: symbol+direction left, P&L+R+TF tabs right */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>

            {/* Left — symbol + direction badge */}
            <div>
              {/* FIX 1 — Symbol 16px */}
              <div style={{
                fontSize: 16, fontWeight: 500, color: '#e8e8e8',
                letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 7,
              }}>
                {t.symbol}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* FIX 2 — SHORT outline, LONG subtle fill */}
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 3,
                  background: isLong ? '#0d1f12' : 'transparent',
                  color:      isLong ? '#22c55e' : 'var(--red)',
                  border: isLong ? '0.5px solid #1a3a22' : '0.5px solid var(--red)',
                }}>
                  {isLong ? 'LONG' : 'SHORT'}
                </span>
              </div>
            </div>

            {/* Right — P&L + R + TF tabs */}
            <div style={{ textAlign: 'right' }}>
              {/* FIX 1 — P&L 22px hero */}
              <div style={{
                fontSize: 22, fontWeight: 600,
                color: isWin ? '#22c55e' : '#ef4444',
                letterSpacing: '-0.03em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtPnl(t.pnl)}
              </div>
              <div style={{
                fontSize: 12, marginTop: 4,
                color: isWin ? '#22c55e80' : '#ef444480',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtR(t.rMultiple)}
              </div>
              {t.entry !== t.exit && (
                <div style={{ fontSize: 11, color: '#2a2a2a', marginTop: 2 }}>
                  {fmtPrice(t.entry)} → {fmtPrice(t.exit)}
                </div>
              )}

              {/* FIX 5 — TF tabs moved here, right-aligned */}
              <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', marginTop: 8 }}>
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf}
                    onClick={e => { e.stopPropagation(); setActiveTF(tf); }}
                    style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '2px 7px', borderRadius: 3, cursor: 'pointer',
                      textTransform: 'uppercase', fontFamily: 'inherit',
                      background: activeTF === tf ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                      color:  activeTF === tf ? '#22c55e' : '#444',
                      border: `0.5px solid ${activeTF === tf ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.1s',
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3B — Chart (edge to edge, no tabs inside) */}
        {complete ? (
          <TradeChart key={activeTF} trade={chartTrade} height={260} />
        ) : (
          /* FIX 6 — Amber syncing warning */
          <div style={{
            height: 60,
            background: 'var(--amber-bg)',
            borderTop: '0.5px solid var(--amber-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--amber)',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 12, color: 'var(--amber)' }}>
              Trade data syncing — chart will appear automatically
            </span>
          </div>
        )}

        {/* 3C — Time axis */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '6px 18px',
        }}>
          {timeLabels.map((label, i) => (
            <span key={i} style={{
              fontSize: 9, color: '#444',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* 3D — Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '0.5px solid #141414',
        }}>
          {/* FIX 3 — Stop loss + R multiple display */}
          {[
            { label: 'Entry',      value: fmtPrice(t.entry), color: '#e0e0e0' },
            { label: 'Exit',       value: fmtPrice(t.exit),  color: '#e0e0e0' },
            { label: 'Stop loss',  value: slValue,           color: slColor },
            { label: 'R multiple', value: rValue,            color: rColor },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{
              padding: '10px 14px',
              borderRight: i < 3 ? '0.5px solid #111' : 'none',
            }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#444',
                marginTop: 3,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* 3E — Footer */}
        <div style={{
          padding: '12px 18px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '0.5px solid #111',
        }}>
          {/* Author stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* FIX 4 — Win rate threshold */}
            {[
              { value: winRateValue, label: 'Win rate', color: winRateColor, tooltip: totalTrades < 10 ? 'Available after 10 trades' : undefined },
              { value: a.totalTrades != null ? String(a.totalTrades) : '—', label: 'Total trades', color: '#888', tooltip: undefined },
              { value: a.avgRR != null ? `${a.avgRR.toFixed(1)}R` : '—', label: 'Avg R:R', color: '#888', tooltip: undefined },
            ].map(({ value, label, color, tooltip }) => (
              <div key={label} title={tooltip}>
                <div style={{ fontSize: 12, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#444', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Watermark */}
          <span style={{
            fontSize: 10, fontWeight: 500,
            color: '#22c55e',
            background: '#0d1f12',
            border: '0.5px solid #1a3a22',
            padding: '4px 10px', borderRadius: 5,
          }}>
            candl.io/@{a.handle}
          </span>
        </div>
      </div>

      {/* Section 4 — Actions */}
      <TradeCardActions post={post} showShare={true} onShareCard={() => setShareModalOpen(true)} />
    </div>

    {shareModalOpen && (
      <ShareModal
        trade={postToShareTrade(post)}
        user={postToShareUser(post)}
        onClose={() => setShareModalOpen(false)}
      />
    )}
    </>
  );
}
