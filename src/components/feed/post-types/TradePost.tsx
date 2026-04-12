import TradePostDark from './TradePostDark';
import LossPost from './LossPost';
import type { Post } from '../../../types/post';

interface TradePostProps {
  post: Post
}

/**
 * Routing layer — decides which trade card variant to render.
 *
 * Post B (TradePostDark): all wins, and losses without a meaningful lesson
 * Post D (LossPost):      losses where the user has written a lesson (> 20 chars)
 */
export default function TradePost({ post }: TradePostProps) {
  const t = post.tradeData;
  if (!t) return null;

  const isLoss   = t.pnl < 0;
  const hasLesson = !!post.lesson && post.lesson.length > 5;

  if (isLoss && hasLesson) {
    return <LossPost post={post} />;
  }

  return <TradePostDark post={post} />;
}
