import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types/post';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useLikes } from '../../hooks/useLikes';
import { useComments } from '../../hooks/useComments';
import ShareDropdown from './ShareDropdown';

interface PostActionsProps {
  post: Post
  showFullJournal?: boolean
  showViewRecap?: boolean
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
}

export default function PostActions({
  post,
  showFullJournal,
  showViewRecap,
  onLike,
  onComment,
  onShare,
}: PostActionsProps) {
  const navigate = useNavigate();
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks();
  const { toggle: toggleLike, isLiked, getLikeCount } = useLikes();
  const { commentCount } = useComments();

  const saved = isBookmarked(post.id);
  const liked = isLiked(post.id, post.isLiked);
  const likeCount = getLikeCount(post.id, post.likes);
  const totalComments = commentCount(post.id, post.comments);

  const shareRef = useRef<HTMLButtonElement>(null);
  const [shareOpen, setShareOpen] = useState(false);

  function handleLike() {
    toggleLike(post);
    onLike?.();
  }

  function handleComment() {
    navigate(`/post/${post.id}#comments`);
    onComment?.();
  }

  function handleShare() {
    setShareOpen(v => !v);
    onShare?.();
  }

  const shareTitle = post.tradeData
    ? `${post.tradeData.symbol} ${post.tradeData.direction} trade by @${post.author.handle}`
    : post.body
    ? post.body.slice(0, 80)
    : `Post by @${post.author.handle}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
      {/* Like */}
      <button
        onClick={handleLike}
        aria-label={liked ? 'Unlike' : 'Like'}
        className={liked ? '' : ''}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12,
          color: liked ? '#f91880' : 'var(--text-4)',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { if (!liked) e.currentTarget.style.color = 'var(--text-2)'; }}
        onMouseLeave={e => { if (!liked) e.currentTarget.style.color = 'var(--text-4)'; }}
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill={liked ? '#f91880' : 'none'}
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className={liked ? 'like-pop' : ''}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {likeCount}
      </button>

      {/* Comment */}
      <button
        onClick={handleComment}
        aria-label="Comment"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: 'var(--text-4)',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalComments}
      </button>

      {/* Share */}
      <button
        ref={shareRef}
        onClick={handleShare}
        aria-label="Share"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: shareOpen ? 'var(--text-2)' : 'var(--text-4)',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)'; }}
        onMouseLeave={e => { if (!shareOpen) e.currentTarget.style.color = 'var(--text-4)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Bookmark */}
      <button
        onClick={() => toggleBookmark(post.id)}
        aria-label={saved ? 'Remove bookmark' : 'Bookmark'}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: saved ? 'var(--blue)' : 'var(--text-4)',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { if (!saved) e.currentTarget.style.color = 'var(--text-2)'; }}
        onMouseLeave={e => { if (!saved) e.currentTarget.style.color = 'var(--text-4)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? 'var(--blue)' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* Full journal link */}
      {showFullJournal && (
        <button style={{
          marginLeft: 'auto', color: 'var(--green)', fontSize: 12,
          cursor: 'pointer', background: 'none', border: 'none', padding: 0,
        }}>
          Full journal &#8599;
        </button>
      )}

      {/* View recap link */}
      {showViewRecap && (
        <button style={{
          marginLeft: 'auto', color: 'var(--blue)', fontSize: 12,
          cursor: 'pointer', background: 'none', border: 'none', padding: 0,
        }}>
          View full recap &#8599;
        </button>
      )}
    </div>
  );
}
