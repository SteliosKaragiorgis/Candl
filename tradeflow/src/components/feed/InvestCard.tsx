import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvestmentPost } from '../../types';

const CONVICTION_COLOR: Record<string, string> = {
  High: 'var(--green)', Medium: 'var(--gold)', Speculative: 'var(--red)',
};

export default function InvestCard({ post }: { post: InvestmentPost }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked(l => { setLikeCount(c => l ? c - 1 : c + 1); return !l; });
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
  }

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderLeft: '3px solid var(--blue)',
        borderRadius: '14px', overflow: 'hidden', marginBottom: '10px', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.15s',
        boxShadow: hovered ? '0 6px 24px rgba(0,0,0,0.08)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px 10px' }}>
        <div
          onClick={e => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}
          style={{
            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${post.user.avatarGradient[0]}, ${post.user.avatarGradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '11px', fontWeight: 700,
            boxShadow: '0 1px 6px rgba(0,0,0,0.18)', cursor: 'pointer',
          }}
        >
          {post.user.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span
              onClick={e => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}
              style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}
            >
              {post.user.name}
            </span>
            <span style={{
              fontSize: '8px', fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px',
              borderRadius: '20px', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)',
            }}>
              INVEST
            </span>
            {post.user.verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--blue)">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>
            @{post.user.username} · {post.createdAt}
          </div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
          borderRadius: '8px', padding: '5px 9px', minWidth: '48px', flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: 'var(--blue)' }}>
            {post.ticker}
          </span>
          <span style={{ fontSize: '7px', color: 'var(--text4)', marginTop: '1px', letterSpacing: '0.4px' }}>NASDAQ</span>
        </div>
      </div>

      {/* Body */}
      <p style={{ padding: '0 14px 10px', fontSize: '12px', lineHeight: 1.6, color: 'var(--text2)', margin: 0 }}>
        {post.body}
      </p>

      {/* Conviction block */}
      <div style={{
        margin: '0 14px 10px',
        background: 'linear-gradient(135deg, rgba(0,71,255,0.04), rgba(0,71,255,0.08))',
        border: '1px solid var(--blue-border)',
        borderRadius: '10px', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {post.ticker}
            </span>
          </div>
          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text4)', textTransform: 'uppercase', marginBottom: '2px' }}>
            Conviction
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 700, lineHeight: 1, color: CONVICTION_COLOR[post.conviction] }}>
            {post.conviction}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { label: 'Horizon',  value: post.horizon },
            { label: 'Added At', value: post.addedAt },
          ].map(({ label, value }) => (
            <div key={label} style={{ fontSize: '10px', color: 'var(--text3)' }}>
              {label}: <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thesis */}
      <div style={{ margin: '0 14px 10px' }}>
        {[
          { label: 'CATALYST',  value: post.catalyst,  dot: 'var(--blue)' },
          { label: 'VALUATION', value: post.valuation, dot: 'var(--green)' },
          { label: 'RISK',      value: post.risk,       dot: 'var(--red)' },
        ].map(({ label, value, dot }, i, arr) => (
          <div key={label} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border2)' : 'none' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '4px', background: dot }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text4)', textTransform: 'uppercase', marginBottom: '1px' }}>
                {label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.5 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hashtags */}
      <div style={{ display: 'flex', gap: '5px', padding: '0 14px 10px', flexWrap: 'wrap' }}>
        {post.hashtags.map(tag => (
          <span key={tag} onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 500, cursor: 'pointer' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', paddingTop: '8px', borderTop: '1px solid var(--border2)' }}>
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 7px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '11px', color: liked ? 'var(--red)' : 'var(--text4)', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <svg className={animating ? 'like-pop' : ''} width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'var(--red)' : 'none'} stroke={liked ? 'var(--red)' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {likeCount.toLocaleString()}
          </button>
          <button onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 7px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '11px', color: 'var(--text4)', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {post.comments}
          </button>
          <button onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 7px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '11px', color: 'var(--text4)', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {post.shares}
          </button>
          {post.isOpen && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700,
              padding: '4px 11px', borderRadius: '7px', marginLeft: 'auto',
              background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)',
              letterSpacing: '0.5px',
            }}>
              OPEN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
