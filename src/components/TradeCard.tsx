"use client";

import { useState } from "react";
import type { Post, TradePost, InvestmentPost } from "@/lib/demo-data";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

// ─── Icons ────────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#dc2626" : "none"} stroke={filled ? "#dc2626" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function VerifiedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0047FF">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

// ─── Trade sections ───────────────────────────────────────────────────────────

function TradeDataSection({ post }: { post: TradePost }) {
  const isBuy = post.direction === "BUY";

  const chips = [
    { label: "ENTRY",  value: `$${post.entry.toFixed(2)}`,  color: "#0a0a0a" },
    { label: "TARGET", value: `$${post.target.toFixed(2)}`, color: "#16a34a" },
    { label: "STOP",   value: `$${post.stop.toFixed(2)}`,   color: "#dc2626" },
    { label: "R:R",    value: post.rrRatio,                  color: "#0047FF" },
  ];

  const tagStyle: React.CSSProperties = {
    ...INTER, fontSize: '11px', fontWeight: 600,
    background: '#f5f5f7', color: '#888', border: '1px solid #e8e8e8',
    padding: '3px 9px', borderRadius: '4px',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Direction row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{
          ...MONO, fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px',
          background: isBuy ? '#16a34a' : '#dc2626', color: '#fff',
          padding: '5px 14px', borderRadius: '5px',
        }}>
          {post.direction}
        </span>
        <span style={{ ...MONO, fontSize: '18px', fontWeight: 700, color: '#0a0a0a' }}>
          {post.ticker}
        </span>
        <span style={tagStyle}>{post.strategy}</span>
        <span style={tagStyle}>{post.timeframe}</span>
      </div>

      {/* Level chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {chips.map((chip) => (
          <div key={chip.label} style={{
            display: 'inline-flex', flexDirection: 'column',
            background: '#f9f9f9', border: '1px solid #e8e8e8',
            borderRadius: '8px', padding: '10px 16px', minWidth: '90px',
          }}>
            <span style={{ ...INTER, fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#bbb', textTransform: 'uppercase', marginBottom: '4px' }}>
              {chip.label}
            </span>
            <span style={{ ...MONO, fontSize: '16px', fontWeight: 700, color: chip.color }}>
              {chip.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeThesisBox({ post }: { post: TradePost }) {
  const rows = [
    { label: 'WHY NOW',      value: post.whyNow      },
    { label: 'RISK',         value: post.risk         },
    { label: 'INVALIDATION', value: post.invalidation },
  ];

  return (
    <div style={{
      background: '#fafafa', border: '1px solid #ebebeb',
      borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
    }}>
      <p style={{ ...INTER, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#bbb', textTransform: 'uppercase', marginBottom: '10px' }}>
        Trade Thesis
      </p>
      {rows.map((row, i) => (
        <div key={row.label} style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '8px 0',
          borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
        }}>
          <span style={{ ...INTER, fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#bbb', textTransform: 'uppercase', width: '110px', flexShrink: 0, paddingTop: '1px' }}>
            {row.label}
          </span>
          <span style={{ ...INTER, fontSize: '13px', color: '#444', lineHeight: 1.6 }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Investment sections ──────────────────────────────────────────────────────

function InvestmentDataSection({ post }: { post: InvestmentPost }) {
  const convictionColor = post.conviction === 'High'
    ? '#16a34a'
    : post.conviction === 'Medium'
    ? '#f59e0b'
    : '#dc2626';

  const chipBase: React.CSSProperties = {
    display: 'inline-flex', flexDirection: 'column',
    background: '#f9f9f9', border: '1px solid #e8e8e8',
    borderRadius: '8px', padding: '10px 16px', minWidth: '90px',
  };
  const labelStyle: React.CSSProperties = {
    ...INTER, fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
    color: '#bbb', textTransform: 'uppercase', marginBottom: '4px',
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
      <div style={chipBase}>
        <span style={labelStyle}>CONVICTION</span>
        <span style={{ ...MONO, fontSize: '14px', fontWeight: 700, color: convictionColor }}>
          {post.conviction}
        </span>
      </div>
      <div style={chipBase}>
        <span style={labelStyle}>HORIZON</span>
        <span style={{ ...MONO, fontSize: '14px', fontWeight: 700, color: '#0047FF' }}>
          {post.horizon}
        </span>
      </div>
      <div style={chipBase}>
        <span style={labelStyle}>ADDED AT</span>
        <span style={{ ...MONO, fontSize: '14px', fontWeight: 700, color: '#0a0a0a' }}>
          {post.addedAt}
        </span>
      </div>
      <div style={chipBase}>
        <span style={labelStyle}>SECTOR</span>
        <span style={{ ...INTER, fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>
          {post.sector}
        </span>
      </div>
    </div>
  );
}

function InvestmentThesisBox({ post }: { post: InvestmentPost }) {
  const rows = [
    { label: 'CATALYST',  value: post.catalyst  },
    { label: 'VALUATION', value: post.valuation  },
    { label: 'RISK',      value: post.risk       },
  ];

  return (
    <div style={{
      background: '#fafafa', border: '1px solid #ebebeb',
      borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
    }}>
      <p style={{ ...INTER, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#bbb', textTransform: 'uppercase', marginBottom: '10px' }}>
        Investment Thesis
      </p>
      {rows.map((row, i) => (
        <div key={row.label} style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '8px 0',
          borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
        }}>
          <span style={{ ...INTER, fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#bbb', textTransform: 'uppercase', width: '110px', flexShrink: 0, paddingTop: '1px' }}>
            {row.label}
          </span>
          <span style={{ ...INTER, fontSize: '13px', color: '#444', lineHeight: 1.6 }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function TradeCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  function handleLike() {
    setLiked((p) => !p);
    setLikeCount((p) => (liked ? p - 1 : p + 1));
  }

  const statusStyles: Record<string, React.CSSProperties> = {
    WIN:      { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    LOSS:     { background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' },
    OPEN:     { background: 'rgba(0,71,255,0.05)', color: '#0047FF', border: '1px solid rgba(0,71,255,0.18)' },
    HOLDING:  { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    SOLD:     { background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' },
    WATCHING: { background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a' },
  };

  const isTrade = post.postType === 'trade';

  return (
    <article className="trade-card">
      <div className="trade-card-accent" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #0047FF, #60a5fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
          }}>
            {post.user.initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ ...INTER, fontSize: '15px', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.2 }}>
                {post.user.name}
              </span>
              {post.user.verified && <VerifiedIcon />}
            </div>
            <span style={{ ...MONO, fontSize: '12px', color: '#aaa', lineHeight: 1.2 }}>
              @{post.user.username} · {post.time}
            </span>
          </div>
        </div>

        {/* Ticker badge + post type pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{
            ...MONO, fontSize: '12px', fontWeight: 700,
            background: 'rgba(0,71,255,0.06)', color: '#0047FF',
            border: '1px solid rgba(0,71,255,0.15)',
            padding: '4px 10px', borderRadius: '5px',
          }}>
            ${post.ticker}
          </span>
          {isTrade ? (
            <span style={{
              ...INTER, fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
              background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa',
              padding: '3px 8px', borderRadius: '4px',
            }}>
              TRADE
            </span>
          ) : (
            <span style={{
              ...INTER, fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
              background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
              padding: '3px 8px', borderRadius: '4px',
            }}>
              INVEST
            </span>
          )}
        </div>
      </div>

      {/* Body text */}
      <p style={{ ...INTER, fontSize: '14px', lineHeight: 1.75, color: '#444', marginBottom: '16px' }}>
        {post.thesis}
      </p>

      {/* Type-specific structured data */}
      {post.postType === 'trade' ? (
        <>
          <TradeDataSection post={post} />
          <TradeThesisBox post={post} />
        </>
      ) : (
        <>
          <InvestmentDataSection post={post} />
          <InvestmentThesisBox post={post} />
        </>
      )}

      {/* Chart link */}
      {post.hasChart && (
        <a
          href={`https://www.tradingview.com/chart/?symbol=${post.tvSymbol}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f9f9f9', border: '1px solid #e8e8e8', borderRadius: '10px',
            padding: '12px 16px', marginBottom: '14px', cursor: 'pointer',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0047FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div>
              <p style={{ ...INTER, fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>
                {post.ticker} · Daily Chart
              </p>
              <p style={{ ...INTER, fontSize: '11px', color: '#bbb', marginTop: '2px' }}>
                View on TradingView
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ ...INTER, fontSize: '12px', fontWeight: 600, color: '#0047FF' }}>Open →</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0047FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </a>
      )}

      {/* Hashtags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        {post.tags.map((tag) => (
          <span key={tag} style={{ ...INTER, fontSize: '13px', color: '#0047FF', cursor: 'pointer' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid #f3f3f3', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleLike}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}
          >
            <HeartIcon filled={liked} />
            <span style={{ ...INTER, fontSize: '13px', color: liked ? '#dc2626' : '#bbb' }}>{likeCount}</span>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}>
            <CommentIcon />
            <span style={{ ...INTER, fontSize: '13px', color: '#bbb' }}>{post.comments}</span>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}>
            <ShareIcon />
            <span style={{ ...INTER, fontSize: '13px', color: '#bbb' }}>{post.shares_count}</span>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}>
            <BookmarkIcon />
          </button>
        </div>

        {/* Status badge */}
        <span style={{
          ...MONO, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
          padding: '5px 14px', borderRadius: '5px', marginLeft: 'auto',
          ...statusStyles[post.status],
        }}>
          {post.status}
        </span>
      </div>
    </article>
  );
}
