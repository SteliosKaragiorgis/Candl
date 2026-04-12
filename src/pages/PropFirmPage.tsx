import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChallenges } from '../hooks/useChallenge';
import {
  useCommunityFeed,
  useLeaderboard,
  useTips,
  useFollowChallenge,
  useLikePost,
  type FeedFilter,
  type LeaderboardPeriod,
  type LeaderboardSort,
  type TipCategory,
} from '../hooks/usePropFirmCommunity';
import {
  useComments,
  useAddComment,
  useCommentCount,
} from '../hooks/usePropFirmCommunity';
import ChallengeCard from '../components/propfirm/ChallengeCard';
import AddChallengeModal from '../components/propfirm/AddChallengeModal';
import AddTradeModal from '../components/propfirm/AddTradeModal';
import MilestonePost, { firmBadge, phaseBadge, Avatar } from '../components/propfirm/MilestonePost';
import ProgressPost from '../components/propfirm/ProgressPost';
import FailurePost from '../components/propfirm/FailurePost';
import FirmGrid from '../components/propfirm/FirmGrid';
import TipCard, { CATEGORY_CFG } from '../components/propfirm/TipCard';
import type { Tip, PropFirm } from '../types/propfirm';
import type { Badge, BadgeColour } from '../types/badges';
import BadgeRow from '../components/badges/BadgeRow';

// ─── Leaderboard badge helper ─────────────────────────────────────────────────

const FIRM_BADGE_COLOUR: Partial<Record<PropFirm, BadgeColour>> = {
  FTMO:       'blue',
  TFT:        'purple',
  Apex:       'amber',
  E8:         'green',
  FundedNext: 'blue',
}

function makeLeaderboardBadges(firm: PropFirm, status: 'passed' | 'active' | 'failed'): Badge[] {
  if (status !== 'passed') return []
  return [{
    id:       `lb-prop-${firm}`,
    label:    `${firm} funded`,
    category: 'PROP_FIRM',
    source:   'PROP_FIRM',
    colour:   FIRM_BADGE_COLOUR[firm] ?? 'blue',
    verified: true,
  }]
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type MainTab = 'feed' | 'leaderboard' | 'firmStats' | 'tips' | 'myChallenges';

const MAIN_TABS: { value: MainTab; label: string }[] = [
  { value: 'feed',         label: 'Community feed' },
  { value: 'leaderboard',  label: 'Leaderboard'    },
  { value: 'firmStats',    label: 'Firm stats'      },
  { value: 'tips',         label: 'Tips & strategies' },
  { value: 'myChallenges', label: 'My challenges'  },
];

const FEED_FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'All',        label: 'All firms'  },
  { value: 'FTMO',       label: 'FTMO'       },
  { value: 'TFT',        label: 'TFT'        },
  { value: 'Apex',       label: 'Apex'       },
  { value: 'E8',         label: 'E8'         },
  { value: 'FundedNext', label: 'FundedNext' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--green-bg)' : 'transparent',
        border: `0.5px solid ${active ? 'var(--green-border)' : 'var(--border)'}`,
        color: active ? 'var(--green)' : 'var(--text-muted)',
        fontWeight: active ? 500 : 400,
        borderRadius: 4, fontSize: 11, padding: '4px 10px',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'color 0.1s, border-color 0.1s, background 0.1s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Status badge (leaderboard) ───────────────────────────────────────────────

function StatusChip({ status }: { status: 'passed' | 'active' | 'failed' }) {
  const cfg = {
    passed: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)', label: 'Passed' },
    active: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)', label: 'Active' },
    failed: { bg: 'var(--red-bg)',   color: 'var(--red)',   border: 'var(--red-border)',   label: 'Failed' },
  }[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}`,
      borderRadius: 20, fontSize: 10, fontWeight: 600, padding: '2px 8px',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Comment thread ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface3, var(--bg-surface))',
  border: '0.5px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 12,
  padding: '8px 12px',
  fontFamily: 'inherit',
  outline: 'none',
};

function CommentThread({ postId }: { postId: string }) {
  const comments    = useComments(postId);
  const addComment  = useAddComment();
  const count       = useCommentCount(postId);
  const [open, setOpen]   = useState(false);
  const [text, setText]   = useState('');

  function handlePost() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment(postId, trimmed);
    setText('');
  }

  return (
    <div style={{ marginTop: 4, borderTop: '0.5px solid var(--border-soft)', paddingTop: 8 }}>
      {/* Toggle row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit',
          padding: 0, display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {count} comment{count !== 1 ? 's' : ''}
        <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Comment list */}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
              }}>
                {c.userName.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{c.userName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{c.userHandle}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>· {relativeTime(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary, var(--text-muted))', margin: 0, lineHeight: 1.5 }}>
                  {c.text}
                </p>
              </div>
            </div>
          ))}

          {/* Input row */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handlePost(); }}
              placeholder="Add a comment…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handlePost}
              style={{
                background: 'var(--green)', color: '#000000',
                border: 'none', borderRadius: 6,
                padding: '8px 14px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: text.trim() ? 1 : 0.5,
              }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function CommunityFeedTab() {
  const [filter, setFilter]       = useState<FeedFilter>('All');
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch]       = useState('');
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const posts = useCommunityFeed(filter);
  const { toggle: toggleLike, isLiked } = useLikePost();
  const { toggle: toggleFollow, isFollowing } = useFollowChallenge();

  // Debounce search input by 200ms
  function handleSearchChange(val: string) {
    setRawSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }

  const filteredPosts = search.trim()
    ? posts.filter(p => {
        const q = search.toLowerCase();
        return (
          p.narrative.toLowerCase().includes(q) ||
          p.user.name.toLowerCase().includes(q) ||
          p.user.handle.toLowerCase().includes(q)
        );
      })
    : posts;

  return (
    <>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-hint)" strokeWidth="2" strokeLinecap="round"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={rawSearch}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search posts, traders…"
          style={{
            ...inputStyle,
            width: '100%',
            boxSizing: 'border-box',
            paddingLeft: 32,
          }}
        />
      </div>

      {/* Firm filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {FEED_FILTERS.map(f => (
          <Chip key={f.value} active={filter === f.value} label={f.label} onClick={() => setFilter(f.value)} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div style={{
          padding: '32px 0', textAlign: 'center',
          fontSize: 12, color: 'var(--text-hint)',
        }}>
          No posts match your search
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredPosts.map(post => {
          const postNode = (() => {
            if (post.type === 'milestone') {
              return <MilestonePost key={post.id} post={post} isLiked={isLiked(post.id)} onLike={toggleLike} />;
            }
            if (post.type === 'progress') {
              return (
                <ProgressPost
                  key={post.id}
                  post={post}
                  isLiked={isLiked(post.id)}
                  onLike={toggleLike}
                  isFollowing={isFollowing(post.id)}
                  onFollow={toggleFollow}
                />
              );
            }
            return <FailurePost key={post.id} post={post} isLiked={isLiked(post.id)} onLike={toggleLike} />;
          })();

          return (
            <div key={post.id}>
              {postNode}
              <div style={{
                marginTop: -18,
                marginBottom: 10,
                marginLeft: 1,
                marginRight: 1,
                padding: '0 14px 10px',
                background: 'var(--bg-card)',
                borderLeft: '0.5px solid var(--border)',
                borderRight: '0.5px solid var(--border)',
                borderBottom: '0.5px solid var(--border)',
                borderRadius: '0 0 8px 8px',
              }}>
                <CommentThread postId={post.id} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LeaderboardTab() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('consistency');
  const traders = useLeaderboard(period, sortBy);

  const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
    { value: 'all',   label: 'All time'   },
    { value: 'month', label: 'This month' },
    { value: 'week',  label: 'This week'  },
  ];
  const SORTS: { value: LeaderboardSort; label: string }[] = [
    { value: 'consistency', label: 'Consistency' },
    { value: 'pnl',         label: 'P&L'         },
    { value: 'winRate',     label: 'Win rate'     },
    { value: 'rMultiple',   label: 'R multiple'   },
  ];

  const thStyle: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
    color: 'var(--text-muted)', fontWeight: 400, padding: '8px 10px', textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map(p => (
            <Chip key={p.value} active={period === p.value} label={p.label} onClick={() => setPeriod(p.value)} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sort:</span>
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              style={{
                background: 'transparent', border: 'none',
                color: sortBy === s.value ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 11, padding: '4px 0',
                cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: sortBy === s.value ? 500 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '0.5px solid var(--border)' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Trader</th>
              <th style={thStyle}>Firm</th>
              <th style={thStyle}>Account</th>
              <th style={thStyle}>Phase</th>
              <th style={thStyle}>P&L %</th>
              <th style={thStyle}>Win rate</th>
              <th style={thStyle}>Avg RR</th>
              <th style={thStyle}>Days</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Badges</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((t, i) => (
              <tr
                key={t.id}
                style={{ borderBottom: '0.5px solid var(--border-soft)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '10px 10px', fontSize: 12, fontVariantNumeric: 'tabular-nums',
                  color: i < 3 ? 'var(--amber)' : 'var(--text-hint)',
                  fontWeight: i < 3 ? 700 : 400,
                }}>
                  {i + 1}
                </td>
                <td style={{ padding: '10px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar initials={t.name.split(' ').map(n => n[0]).join('').slice(0, 2)} color="" size={22} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{t.handle}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 10px' }}>{firmBadge(t.firm)}</td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  ${(t.accountSize / 1000).toFixed(0)}k
                </td>
                <td style={{ padding: '10px 10px' }}>{phaseBadge(t.phase)}</td>
                <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                  color: t.pnlPercent >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(1)}%
                </td>
                <td style={{ padding: '10px 10px', fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.winRate}%
                </td>
                <td style={{ padding: '10px 10px', fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.avgRR.toFixed(1)}R
                </td>
                <td style={{ padding: '10px 10px', fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.days}
                </td>
                <td style={{ padding: '10px 10px' }}>
                  <StatusChip status={t.status} />
                </td>
                <td style={{ padding: '10px 10px' }}>
                  <BadgeRow
                    badges={makeLeaderboardBadges(t.firm, t.status)}
                    context="leaderboard"
                    maxCount={2}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FirmStatsTab() {
  return <FirmGrid />;
}

function TipsTab() {
  const [category, setCategory] = useState<TipCategory>('all');
  const tips = useTips(category);

  const CATS: { value: TipCategory; label: string }[] = [
    { value: 'all',        label: 'All'             },
    { value: 'risk',       label: 'Risk management' },
    { value: 'psychology', label: 'Psychology'       },
    { value: 'news',       label: 'News events'      },
    { value: 'entry',      label: 'Entry timing'     },
    { value: 'compliance', label: 'Rule compliance'  },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {CATS.map(c => (
          <Chip key={c.value} active={category === c.value} label={c.label} onClick={() => setCategory(c.value)} />
        ))}
      </div>

      <div className="tips-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {tips.map(t => <TipCard key={t.id} tip={t} />)}
      </div>
    </>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      borderTop: '0.5px solid var(--border-soft)',
      paddingTop: 12, marginTop: 4,
    }}>
      <span style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '0.5px', background: 'var(--border-soft)' }} />
    </div>
  );
}

// ─── Stats tile ───────────────────────────────────────────────────────────────

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 8,
      padding: '10px 12px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function MyChallengesTab({
  onAddOpen,
  onLogTradeOpen,
}: {
  onAddOpen: () => void;
  onLogTradeOpen: () => void;
}) {
  const challenges = useChallenges();

  const active    = challenges.filter(c => c.status === 'active' || c.status === 'near_limit');
  const completed = challenges.filter(c => c.status === 'passed'  || c.status === 'failed');
  const hasActive = active.length > 0;

  // Summary stats for completed challenges
  const totalChallenges = completed.length;
  const passCount       = completed.filter(c => c.status === 'passed').length;
  const passRate        = totalChallenges > 0 ? Math.round((passCount / totalChallenges) * 100) : 0;
  const totalPnl        = completed.reduce((sum, c) => sum + c.total_pnl, 0);
  const avgDays         = totalChallenges > 0
    ? Math.round(
        completed.reduce((sum, c) => {
          const start = new Date(c.start_date).getTime();
          const end   = new Date(c.end_date).getTime();
          return sum + Math.max(0, Math.ceil((end - start) / 86400000));
        }, 0) / totalChallenges,
      )
    : 0;

  if (challenges.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: '48px 16px', color: 'var(--text-muted)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-hint)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No challenges yet.</div>
        <button
          onClick={onAddOpen}
          style={{
            background: 'var(--green)', color: '#000000',
            border: 'none', borderRadius: 6,
            padding: '8px 18px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Add challenge
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Global log trade button — shown when there is at least one active challenge */}
      {hasActive && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onLogTradeOpen}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '0.5px solid var(--border)',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-emphasis)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            + Log trade
          </button>
        </div>
      )}

      {/* Active challenges */}
      {active.map(c => <ChallengeCard key={c.id} challenge={c} />)}

      {/* Completed section */}
      {completed.length > 0 && (
        <>
          <SectionDivider label={`Completed challenges`} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.85 }}>
            {completed.map(c => <ChallengeCard key={c.id} challenge={c} />)}
          </div>

          {/* Summary stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginTop: 4,
          }}>
            <StatTile value={String(totalChallenges)} label="Total challenges" />
            <StatTile value={`${passRate}%`} label="Pass rate" />
            <StatTile value={avgDays > 0 ? `${avgDays}d` : '—'} label="Avg days" />
            <StatTile
              value={
                totalPnl >= 0
                  ? `+$${totalPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : `-$${Math.abs(totalPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              }
              label="Total P&L"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PropFirmPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<MainTab>((searchParams.get('tab') as MainTab) || 'feed');
  const [addOpen, setAddOpen]           = useState(false);
  const [logTradeOpen, setLogTradeOpen] = useState(false);

  // Sync tab when URL param changes (e.g. from right rail links)
  useEffect(() => {
    const t = searchParams.get('tab') as MainTab;
    if (t) setTab(t);
  }, [searchParams]);

  function handleSetTab(t: MainTab) {
    setTab(t);
    setSearchParams(t === 'feed' ? {} : { tab: t }, { replace: true });
  }

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── Page header ── */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '0.5px solid var(--border)',
        padding: '14px 20px 0',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          paddingBottom: 12, flexWrap: 'wrap', gap: 8,
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
              Prop firm hub
            </h1>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Track challenges · learn from the community · share milestones
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* My challenges — ghost */}
            <button
              onClick={() => handleSetTab('myChallenges')}
              style={{
                background: 'transparent', color: 'var(--text-muted)',
                border: '0.5px solid var(--border)', borderRadius: 6,
                padding: '6px 14px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--green)';
                e.currentTarget.style.borderColor = 'var(--green)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              My challenges
            </button>

            {/* New challenge — primary */}
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: 'var(--green)', color: '#000000',
                fontWeight: 600, fontSize: 12,
                border: 'none', borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + New challenge
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex' }}>
          {MAIN_TABS.map(t => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handleSetTab(t.value)}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 500 : 400,
                  fontSize: 12, padding: '10px 16px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.1s, border-color 0.1s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '16px 20px 0' }}>
        {tab === 'leaderboard' && <LeaderboardTab />}
        {tab === 'firmStats'   && <FirmStatsTab />}
        {tab === 'feed'         && <CommunityFeedTab />}
        {tab === 'tips'         && <TipsTab />}
        {tab === 'myChallenges' && (
          <MyChallengesTab
            onAddOpen={() => setAddOpen(true)}
            onLogTradeOpen={() => setLogTradeOpen(true)}
          />
        )}
      </div>

      {addOpen && <AddChallengeModal onClose={() => setAddOpen(false)} />}
      {logTradeOpen && <AddTradeModal onClose={() => setLogTradeOpen(false)} />}
    </div>
  );
}
