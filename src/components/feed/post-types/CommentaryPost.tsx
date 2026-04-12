import PostHeader from '../PostHeader';
import PostActions from '../PostActions';
import { FormattedText } from '../../../lib/postUtils';
import type { Post } from '../../../types/post';

interface CommentaryPostProps {
  post: Post
}

export default function CommentaryPost({ post }: CommentaryPostProps) {
  return (
    <>
      <PostHeader post={post} />

      {post.body && (
        <div style={{
          borderLeft: '3px solid var(--amber)',
          paddingLeft: 14,
          marginBottom: 10,
        }}>
          <p style={{
            fontSize: 14, color: 'var(--text)', lineHeight: 1.65,
            marginTop: 0, marginBottom: 0,
          }}>
            <FormattedText text={post.body} />
          </p>
        </div>
      )}

      <PostActions post={post} />
    </>
  );
}
