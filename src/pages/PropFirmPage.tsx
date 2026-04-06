import React, { useState } from 'react';
import { useChallenges } from '../hooks/useChallenge';
import {
  useCommunityFeed,
  useLeaderboard,
  useFirmStats,
  useTips,
  useFollowChallenge,
  useLikePost,
  type FeedFilter,
  type LeaderboardPeriod,
  type LeaderboardSort,
  type TipCategory,
} from '../hooks/usePropFirmCommunity';
import ChallengeCard from '../components/propfirm/ChallengeCard';
import AddChallengeModal from '../components/propfirm/AddChallengeModal';
import MilestonePost, { firmBadge, phaseBadge, Avatar } from '../components/propfirm/MilestonePost';
import ProgressPost from '../components/propfirm/ProgressPost';
import FailurePost from '../components/propfirm/FailurePost';
import FirmStatCard from '../components/propfirm/FirmStatCard';
import TipCard, { CATEGORY_CFG } from '../components/propfirm/TipCard';
import type { Tip } from '../types/propfirm';

// ─── Tab config ───────────────────────────────────────────────────────────────

type MainTab = 'feed' | 'leaderboard' | 'firmStats' | 'tips' | 'myChallenges';

const MAIN_TABS: { value: MainTab; label: string }[] = [
  { value: 'feed',         label: 'Community feed' },
  { value: 'leaderboard',  label: 'Leaderboard' },
  { value: 'firmStats',    label: 'Firm stats' },
  { value: 'tips',         label: 'Tips & strategies' },
  { value: 'myChallenges', label: 'My challenges' },
];

const FEED_FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'All',        label: 'All firms' },
  { value: 'FTMO',       label: 'FTMO' },
  { value: 'TFT',        label: 'TFT' },
  { value: 'Apex',       label: 'Apex' },
  { value: 'E8',         label: 'E8' },
  { value: 'FundedNext', label: 'FundedNext' },
];

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

function SidebarPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: 'var(--bw) solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 12 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SidebarLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 11, color: 'var(--text-3)', fontFamily: 'inherit', marginTop: 10,
        display: 'block',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
    >
      {label} →
    </button>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: 'passed' | 'active' | 'failed' }) {
  const cfg = {
    passed: { bg: 'var(--green-bg)',  color: '#22c55e', border: 'var(--green-border)', label: 'Passed' },
    active: { bg: 'var(--blue-bg)',   color: '#3b82f6', border: 'var(--blue-border)',  label: 'Active' },
    failed: { bg: 'var(--red-bg)',    color: '#ef4444', border: 'var(--red-border)',   label: 'Failed' },
  }[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `var(--bw) solid ${cfg.border}`,
      borderRadius: 3, fontSize: 10, padding: '2px 7px',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Right sidebar panels ─────────────────────────────────────────────────────

function LeaderboardPreview({ onViewFull }: { onViewFull: () => void }) {
  const traders = useLeaderboard('month', 'consistency').slice(0, 4);
  return (
    <SidebarPanel label="This month — most consistent">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {traders.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums', width: 14, flexShrink: 0 }}>
              {i + 1}
            </span>
            <Avatar initials={t.name.split(' ').map(n => n[0]).join('').slice(0, 2)} color={t.avatarColor} size={22} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
            </div>
            {firmBadge(t.firm)}
            <span style={{ fontSize: 11, fontWeight: 500, color: '#22c55e', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              +{t.pnlPercent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <SidebarLink label="See full leaderboard" onClick={onViewFull} />
    </SidebarPanel>
  );
}

function CommunityPassRates() {
  const stats = useFirmStats();
  return (
    <SidebarPanel label="Community pass rates">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.firm} ${(s.accountSize / 1000).toFixed(0)}k</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>{s.passRate}%</span>
            </div>
            <div style={{ height: 3, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{ height: '100%', width: `${s.passRate}%`, background: '#22c55e', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
              {s.attempts.toLocaleString()} attempts · avg {s.avgDays} days
            </div>
          </div>
        ))}
      </div>
    </SidebarPanel>
  );
}

function TopTipsSidebar({ onViewAll }: { onViewAll: () => void }) {
  const tips = useTips('all').slice(0, 3);
  return (
    <SidebarPanel label="Top tips this week">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tips.map(t => (
          <TipCard key={t.id} tip={t} compact />
        ))}
      </div>
      <SidebarLink label="See all tips" onClick={onViewAll} />
    </SidebarPanel>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function CommunityFeedTab() {
  const [filter, setFilter] = useState<FeedFilter>('All');
  const posts = useCommunityFeed(filter);
  const { toggle: toggleLike, isLiked } = useLikePost();
  const { toggle: toggleFollow, isFollowing } = useFollowChallenge();

  return (
    <>
      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {FEED_FILTERS.map(f => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                background: active ? 'var(--blue-bg)' : 'transparent',
                border: `var(--bw) solid ${active ? 'var(--blue-border)' : 'var(--border)'}`,
                color: active ? 'var(--blue)' : 'var(--text-3)',
                borderRadius: 3, fontSize: 10, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => {
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
    { value: 'all', label: 'All time' },
    { value: 'month', label: 'This month' },
    { value: 'week', label: 'This week' },
  ];
  const SORTS: { value: LeaderboardSort; label: string }[] = [
    { value: 'consistency', label: 'Consistency' },
    { value: 'pnl', label: 'P&L' },
    { value: 'winRate', label: 'Win rate' },
    { value: 'rMultiple', label: 'R multiple' },
  ];

  const thStyle: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
    color: 'var(--text-4)', fontWeight: 400, padding: '8px 10px', textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                background: period === p.value ? 'var(--blue-bg)' : 'transparent',
                border: `var(--bw) solid ${period === p.value ? 'var(--blue-border)' : 'var(--border)'}`,
                color: period === p.value ? 'var(--blue)' : 'var(--text-3)',
                borderRadius: 3, fontSize: 10, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-4)' }}>Sort:</span>
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: sortBy === s.value ? 'var(--text)' : 'var(--text-3)',
                fontSize: 10, padding: '4px 0',
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
      <div style={{ background: 'var(--surface)', border: 'var(--bw) solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: 'var(--bw) solid var(--border-subtle)' }}>
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
            </tr>
          </thead>
          <tbody>
            {traders.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: 'var(--bw) solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </td>
                <td style={{ padding: '10px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar initials={t.name.split(' ').map(n => n[0]).join('').slice(0, 2)} color={t.avatarColor} size={22} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>@{t.handle}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 10px' }}>{firmBadge(t.firm)}</td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                  ${(t.accountSize / 1000).toFixed(0)}k
                </td>
                <td style={{ padding: '10px 10px' }}>{phaseBadge(t.phase)}</td>
                <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: t.pnlPercent >= 0 ? '#22c55e' : '#ef4444' }}>
                  {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(1)}%
                </td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.winRate}%
                </td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.avgRR.toFixed(1)}R
                </td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.days}
                </td>
                <td style={{ padding: '10px 10px' }}>
                  <StatusChip status={t.status} />
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
  const stats = useFirmStats();
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
    }}>
      {stats.map((s, i) => <FirmStatCard key={i} stat={s} />)}
    </div>
  );
}

function TipsTab() {
  const [category, setCategory] = useState<TipCategory>('all');
  const tips = useTips(category);

  const CATS: { value: TipCategory; label: string }[] = [
    { value: 'all',         label: 'All' },
    { value: 'risk',        label: 'Risk management' },
    { value: 'psychology',  label: 'Psychology' },
    { value: 'news',        label: 'News events' },
    { value: 'entry',       label: 'Entry timing' },
    { value: 'compliance',  label: 'Rule compliance' },
  ];

  return (
    <>
      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {CATS.map(c => {
          const active = category === c.value;
          const accentColor = c.value !== 'all' ? CATEGORY_CFG[c.value as Tip['category']].color : 'var(--blue)';
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                background: active ? 'var(--blue-bg)' : 'transparent',
                border: `var(--bw) solid ${active ? 'var(--blue-border)' : 'var(--border)'}`,
                color: active ? accentColor : 'var(--text-3)',
                borderRadius: 3, fontSize: 10, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {tips.map(t => <TipCard key={t.id} tip={t} />)}
      </div>
    </>
  );
}

function MyChallengesTab({ onAddOpen }: { onAddOpen: () => void }) {
  const challenges = useChallenges();
  if (challenges.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: '48px 16px', color: 'var(--text-3)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No challenges yet.</div>
        <button
          onClick={onAddOpen}
          style={{
            background: 'var(--green-bg)', color: '#22c55e',
            border: 'var(--bw) solid var(--green-border)', borderRadius: 6,
            padding: '8px 18px', fontSize: 12, fontWeight: 500,
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
      {challenges.map(c => <ChallengeCard key={c.id} challenge={c} />)}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PropFirmPage() {
  const [tab, setTab] = useState<MainTab>('feed');
  const [addOpen, setAddOpen] = useState(false);

  // Full-width tabs (no sidebar)
  const fullWidth = tab === 'leaderboard' || tab === 'firmStats';

  return (
    <div style={{ padding: '0 0 48px' }}>

      {/* ── Page header ── */}
      <div style={{ padding: '20px 16px 0', borderBottom: 'var(--bw) solid var(--border-subtle)', marginBottom: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '0 0 14px', flexWrap: 'wrap', gap: 8,
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
              Prop firm hub
            </h1>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Track challenges · learn from the community · share milestones
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setTab('myChallenges')}
              style={{
                background: 'transparent', color: 'var(--text-3)',
                border: 'var(--bw) solid var(--border)', borderRadius: 6,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
            >
              My challenges
            </button>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: 'var(--green-bg)', color: '#22c55e',
                border: 'var(--bw) solid var(--green-border)', borderRadius: 6,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + New challenge
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {MAIN_TABS.map(t => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className="feed-tab"
                style={{
                  color: active ? 'var(--text)' : 'var(--text-3)',
                  borderBottom: active ? 'var(--bw) solid var(--text)' : 'var(--bw) solid transparent',
                  paddingBottom: 10,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '16px 16px 0' }}>
        {fullWidth ? (
          /* Full-width layout for leaderboard & firm stats */
          <div>
            {tab === 'leaderboard' && <LeaderboardTab />}
            {tab === 'firmStats' && <FirmStatsTab />}
          </div>
        ) : (
          /* Two-column layout */
          <div style={{
            display: 'flex', gap: 20, alignItems: 'flex-start',
          }}>
            {/* Left: main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {tab === 'feed'         && <CommunityFeedTab />}
              {tab === 'tips'         && <TipsTab />}
              {tab === 'myChallenges' && <MyChallengesTab onAddOpen={() => setAddOpen(true)} />}
            </div>

            {/* Right: sidebar — hidden on mobile via media query class */}
            <div
              className="prop-sidebar"
              style={{
                width: 320, flexShrink: 0,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              <LeaderboardPreview onViewFull={() => setTab('leaderboard')} />
              <CommunityPassRates />
              <TopTipsSidebar onViewAll={() => setTab('tips')} />
            </div>
          </div>
        )}
      </div>

      {addOpen && <AddChallengeModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
