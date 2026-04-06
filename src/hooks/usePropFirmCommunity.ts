import { useState, useMemo } from 'react';
import type { CommunityPost, Tip, FirmStats, LeaderboardTrader, PropFirm } from '../types/propfirm';
import {
  COMMUNITY_POSTS,
  LEADERBOARD_TRADERS,
  FIRM_STATS,
  TIPS,
} from '../lib/propfirm-data';

// ─── Community feed ───────────────────────────────────────────────────────────

export type FeedFilter = PropFirm | 'All';

export function useCommunityFeed(filter: FeedFilter): CommunityPost[] {
  return useMemo(() => {
    if (filter === 'All') return COMMUNITY_POSTS;
    return COMMUNITY_POSTS.filter(p => p.firm === filter);
  }, [filter]);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'all' | 'month' | 'week';
export type LeaderboardSort = 'consistency' | 'pnl' | 'winRate' | 'rMultiple';

function consistencyScore(t: LeaderboardTrader): number {
  return t.winRate * 0.4 + t.avgRR * 30 + t.rulesClean * 30;
}

export function useLeaderboard(
  period: LeaderboardPeriod,
  sortBy: LeaderboardSort,
): LeaderboardTrader[] {
  return useMemo(() => {
    // In a real app, period would filter by date. With demo data we return all.
    const traders = [...LEADERBOARD_TRADERS];
    if (sortBy === 'consistency') traders.sort((a, b) => consistencyScore(b) - consistencyScore(a));
    else if (sortBy === 'pnl') traders.sort((a, b) => b.pnlPercent - a.pnlPercent);
    else if (sortBy === 'winRate') traders.sort((a, b) => b.winRate - a.winRate);
    else if (sortBy === 'rMultiple') traders.sort((a, b) => b.avgRR - a.avgRR);
    return traders;
  }, [period, sortBy]);
}

// ─── Firm stats ───────────────────────────────────────────────────────────────

export function useFirmStats(): FirmStats[] {
  return FIRM_STATS;
}

// ─── Tips ─────────────────────────────────────────────────────────────────────

export type TipCategory = Tip['category'] | 'all';

export function useTips(category: TipCategory = 'all'): Tip[] {
  return useMemo(() => {
    if (category === 'all') return TIPS;
    return TIPS.filter(t => t.category === category);
  }, [category]);
}

// ─── Follow challenge ─────────────────────────────────────────────────────────

export function useFollowChallenge() {
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const toggle = (challengeId: string) => {
    setFollowed(prev => {
      const next = new Set(prev);
      if (next.has(challengeId)) next.delete(challengeId);
      else next.add(challengeId);
      return next;
    });
  };
  const isFollowing = (challengeId: string) => followed.has(challengeId);
  return { toggle, isFollowing };
}

// ─── Like post ────────────────────────────────────────────────────────────────

export function useLikePost() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const toggle = (postId: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };
  const isLiked = (postId: string) => liked.has(postId);
  return { toggle, isLiked };
}
