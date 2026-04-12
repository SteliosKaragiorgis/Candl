import { useState, type ReactNode } from 'react';
import TradePost from './post-types/TradePost';
import InvestPost from './post-types/InvestPost';
import CommentaryPost from './post-types/CommentaryPost';
import PropFirmPost from './post-types/PropFirmPost';
import WeeklyRecapPost from './post-types/WeeklyRecapPost';
import type { Post } from '../../types/post';

const LEFT_BORDER: Record<Post['type'], string> = {
  TRADE:        'var(--green)',
  INVEST:       'var(--amber)',
  COMMENTARY:   'var(--border)',
  PROP_FIRM:    '#8b5cf6',
  WEEKLY_RECAP: 'var(--blue)',
};

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const [hovered, setHovered] = useState(false);

  // TRADE posts are self-contained cards — TradePost manages its own wrapper,
  // hover state, border, and border-radius, so bypass PostCard's shell.
  if (post.type === 'TRADE') {
    return <TradePost post={post} />;
  }

  let content: ReactNode;
  switch (post.type) {
    case 'INVEST':       content = <InvestPost post={post} />;       break;
    case 'COMMENTARY':   content = <CommentaryPost post={post} />;   break;
    case 'PROP_FIRM':    content = <PropFirmPost post={post} />;     break;
    case 'WEEKLY_RECAP': content = <WeeklyRecapPost post={post} />;  break;
    default:             content = null;
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-hard)' : 'var(--border)'}`,
        borderLeft: `2px solid ${LEFT_BORDER[post.type]}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }}
    >
      {content}
    </div>
  );
}
