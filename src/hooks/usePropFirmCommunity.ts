import { useState, useMemo, useEffect, useCallback } from 'react';
import type { CommunityPost, Tip, FirmStats, PropFirm, ChallengePhase, PostType } from '../types/propfirm';
import type { Challenge } from '../types/propfirm';
import {
  COMMUNITY_POSTS,
  LEADERBOARD_TRADERS,
  FIRM_STATS,
  TIPS,
  DEMO_COMMENTS,
} from '../lib/propfirm-data';
import type { LeaderboardTraderWithDate } from '../lib/propfirm-data';

export type { Comment } from '../lib/propfirm-data';
import type { Comment } from '../lib/propfirm-data';

// ─── localStorage keys ────────────────────────────────────────────────────────

const LS_LIKED_POSTS        = 'candl_liked_posts';
const LS_FOLLOWED_CHALLENGES = 'candl_followed_challenges';
const LS_COMMUNITY_POSTS    = 'candl_community_posts';
const LS_POST_COMMENTS      = 'candl_post_comments';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGetSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function lsSaveSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // storage unavailable — fail silently
  }
}

function lsGetArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function lsSaveArray<T>(key: string, arr: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // storage unavailable — fail silently
  }
}

function dispatch(eventName: string): void {
  window.dispatchEvent(new Event(eventName));
}

// ─── Community feed ───────────────────────────────────────────────────────────

export type FeedFilter = PropFirm | 'All';

export function useCommunityFeed(filter: FeedFilter): CommunityPost[] {
  const [userPosts, setUserPosts] = useState<CommunityPost[]>(() =>
    lsGetArray<CommunityPost>(LS_COMMUNITY_POSTS),
  );

  useEffect(() => {
    const sync = () => setUserPosts(lsGetArray<CommunityPost>(LS_COMMUNITY_POSTS));
    window.addEventListener('candl-community-posts-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('candl-community-posts-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return useMemo(() => {
    const all = [...userPosts, ...COMMUNITY_POSTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter === 'All') return all;
    return all.filter(p => p.firm === filter);
  }, [filter, userPosts]);
}

// ─── Add community post ───────────────────────────────────────────────────────

export function useAddCommunityPost() {
  return useCallback((post: CommunityPost) => {
    const existing = lsGetArray<CommunityPost>(LS_COMMUNITY_POSTS);
    lsSaveArray(LS_COMMUNITY_POSTS, [post, ...existing]);
    dispatch('candl-community-posts-updated');
  }, []);
}

// ─── Publish challenge to feed ────────────────────────────────────────────────

const SELF_USER = {
  id: 'self',
  name: 'You',
  handle: 'you',
  avatar: 'Y',
  avatarColor: '#3ecf8e',
};

export function publishChallengeToFeed(challenge: Challenge, caption: string): void {
  const tradingDays = challenge.trading_days ?? [];
  const winDays = tradingDays.filter(d => d.result === 'win').length;
  const activeDays = tradingDays.filter(d => d.result !== 'no_trade').length;
  const winRate = activeDays > 0 ? Math.round((winDays / activeDays) * 100) : 0;

  const pnl = challenge.total_pnl;
  const pnlPercent =
    challenge.starting_balance > 0
      ? parseFloat(((pnl / challenge.starting_balance) * 100).toFixed(2))
      : 0;

  // Estimate avgRR from trading days (winners vs losers net PnL ratio)
  const winnerPnl = tradingDays.filter(d => d.result === 'win').reduce((s, d) => s + d.pnl, 0);
  const loserPnl  = tradingDays.filter(d => d.result === 'loss').reduce((s, d) => s + Math.abs(d.pnl), 0);
  const avgRR =
    loserPnl > 0 && winDays > 0 && (activeDays - winDays) > 0
      ? parseFloat(((winnerPnl / winDays) / (loserPnl / (activeDays - winDays))).toFixed(2))
      : 1.0;

  let type: PostType;
  if (challenge.status === 'passed') type = 'milestone';
  else if (challenge.status === 'failed') type = 'failure';
  else type = 'progress';

  const post: CommunityPost = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    user: SELF_USER,
    firm: challenge.firm,
    accountSize: challenge.account_size,
    phase: challenge.phase as ChallengePhase,
    dayNumber: activeDays,
    narrative: caption,
    lesson: type === 'milestone' ? caption : undefined,
    improvement: type === 'failure' ? caption : undefined,
    stats: { pnl, pnlPercent, winRate, avgRR, daysUsed: activeDays },
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    isVerified: false,
  };

  const existing = lsGetArray<CommunityPost>(LS_COMMUNITY_POSTS);
  lsSaveArray(LS_COMMUNITY_POSTS, [post, ...existing]);
  dispatch('candl-community-posts-updated');
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'all' | 'month' | 'week';
export type LeaderboardSort = 'consistency' | 'pnl' | 'winRate' | 'rMultiple';

function consistencyScore(t: LeaderboardTraderWithDate): number {
  return t.winRate * 0.4 + t.avgRR * 30 + t.rulesClean * 30;
}

export function useLeaderboard(
  period: LeaderboardPeriod,
  sortBy: LeaderboardSort,
): LeaderboardTraderWithDate[] {
  return useMemo(() => {
    const now = new Date('2026-04-12T00:00:00.000Z').getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const filtered = LEADERBOARD_TRADERS.filter(t => {
      if (period === 'all') return true;
      const joined = new Date(t.joinedDate).getTime();
      const diffDays = (now - joined) / DAY_MS;
      if (period === 'week') return diffDays <= 7;
      if (period === 'month') return diffDays <= 30;
      return true;
    });

    const traders = [...filtered];
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

// ─── Follow challenge (#4) ────────────────────────────────────────────────────

export function useFollowChallenge() {
  const [followed, setFollowed] = useState<Set<string>>(() =>
    lsGetSet(LS_FOLLOWED_CHALLENGES),
  );

  useEffect(() => {
    const sync = () => setFollowed(lsGetSet(LS_FOLLOWED_CHALLENGES));
    window.addEventListener('candl-follows-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('candl-follows-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((challengeId: string) => {
    setFollowed(prev => {
      const next = new Set(prev);
      if (next.has(challengeId)) next.delete(challengeId);
      else next.add(challengeId);
      lsSaveSet(LS_FOLLOWED_CHALLENGES, next);
      dispatch('candl-follows-updated');
      return next;
    });
  }, []);

  const isFollowing = useCallback((challengeId: string) => followed.has(challengeId), [followed]);

  return { toggle, isFollowing };
}

// ─── Like post (#4) ───────────────────────────────────────────────────────────

export function useLikePost() {
  const [liked, setLiked] = useState<Set<string>>(() =>
    lsGetSet(LS_LIKED_POSTS),
  );

  useEffect(() => {
    const sync = () => setLiked(lsGetSet(LS_LIKED_POSTS));
    window.addEventListener('candl-likes-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('candl-likes-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((postId: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      lsSaveSet(LS_LIKED_POSTS, next);
      dispatch('candl-likes-updated');
      return next;
    });
  }, []);

  const isLiked = useCallback((postId: string) => liked.has(postId), [liked]);

  return { toggle, isLiked };
}

// ─── Comments (#19) ───────────────────────────────────────────────────────────

function getAllComments(): Comment[] {
  const userComments = lsGetArray<Comment>(LS_POST_COMMENTS);
  // Merge demo comments, avoiding duplicates by id
  const userIds = new Set(userComments.map(c => c.id));
  const demoFiltered = DEMO_COMMENTS.filter(c => !userIds.has(c.id));
  return [...userComments, ...demoFiltered];
}

export function useComments(postId: string): Comment[] {
  const [comments, setComments] = useState<Comment[]>(() =>
    getAllComments().filter(c => c.postId === postId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  );

  useEffect(() => {
    const sync = () => {
      setComments(
        getAllComments()
          .filter(c => c.postId === postId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    };
    window.addEventListener('candl-comments-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('candl-comments-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [postId]);

  return comments;
}

export function useAddComment() {
  return useCallback((postId: string, text: string) => {
    const comment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      postId,
      userId: 'self',
      userName: 'You',
      userHandle: 'you',
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    const existing = lsGetArray<Comment>(LS_POST_COMMENTS);
    lsSaveArray(LS_POST_COMMENTS, [...existing, comment]);
    dispatch('candl-comments-updated');
  }, []);
}

export function useCommentCount(postId: string): number {
  const [count, setCount] = useState<number>(
    () => getAllComments().filter(c => c.postId === postId).length,
  );

  useEffect(() => {
    const sync = () =>
      setCount(getAllComments().filter(c => c.postId === postId).length);
    window.addEventListener('candl-comments-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('candl-comments-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [postId]);

  return count;
}
