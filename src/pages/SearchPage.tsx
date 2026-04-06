import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DEMO_POSTS, DEMO_USERS } from '../data/demo';
import { fetchSearch, type SearchResult } from '../components/feed/TickerChart';
import type { Post, User } from '../types/index';
import { useMobile } from '../hooks/useMobile';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function UserCard({ user }: { user: User }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/profile/${user.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${user.avatarGradient[0]}, ${user.avatarGradient[1]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 13, fontWeight: 700,
      }}>
        {user.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
          {user.verified && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#2563EB">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>@{user.username}</div>
        {user.bio && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.bio}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>{user.followersCount.toLocaleString()}</div>
        <div>followers</div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const navigate = useNavigate();
  const ticker = 'ticker' in post ? post.ticker : undefined;
  const tagColor =
    post.postType === 'trade' ? '#2563EB' :
    post.postType === 'investment' ? '#16a34a' :
    post.postType === 'commentary' ? '#7c3aed' : '#6b7280';

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      style={{
        padding: '14px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${post.user.avatarGradient[0]}, ${post.user.avatarGradient[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10, fontWeight: 700,
        }}>
          {post.user.initials}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{post.user.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{post.createdAt}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600,
          padding: '2px 6px', borderRadius: 4,
          background: tagColor + '22', color: tagColor,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {post.postType}
        </span>
        {ticker && (
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            padding: '2px 6px', borderRadius: 4,
            background: 'var(--surface-2)', color: 'var(--text-2)',
            border: '1px solid var(--border)',
          }}>
            {ticker}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.body}
      </div>
    </div>
  );
}

function TickerCard({ result }: { result: SearchResult }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/ticker/${result.symbol}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--text)',
      }}>
        {result.symbol.slice(0, 4)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>
          {result.symbol}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {result.instrument_name}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', flexShrink: 0 }}>
        <div>{result.exchange}</div>
        <div style={{ marginTop: 1 }}>{result.instrument_type}</div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);
  const isMobile = useMobile();

  const [tickerResults, setTickerResults] = useState<SearchResult[]>([]);
  const [tickerLoading, setTickerLoading] = useState(false);
  const debouncedInput = useDebounce(inputValue, 300);

  // Sync input when URL param changes (e.g. navigating from topbar)
  useEffect(() => { setInputValue(q); }, [q]);

  // Update URL as user types (debounced)
  useEffect(() => {
    if (debouncedInput !== q) {
      setSearchParams(debouncedInput ? { q: debouncedInput } : {}, { replace: true });
    }
  }, [debouncedInput]);

  // Ticker search via API
  useEffect(() => {
    if (!q) { setTickerResults([]); return; }
    let cancelled = false;
    setTickerLoading(true);
    fetchSearch(q)
      .then(r => { if (!cancelled) { setTickerResults(r); setTickerLoading(false); } })
      .catch(() => { if (!cancelled) { setTickerResults([]); setTickerLoading(false); } });
    return () => { cancelled = true; };
  }, [q]);

  const lower = q.toLowerCase();

  const matchedUsers = q
    ? Object.values(DEMO_USERS).filter(u =>
        u.name.toLowerCase().includes(lower) ||
        u.username.toLowerCase().includes(lower) ||
        u.bio.toLowerCase().includes(lower)
      )
    : [];

  const matchedPosts = q
    ? DEMO_POSTS.filter(p =>
        p.body.toLowerCase().includes(lower) ||
        p.user.name.toLowerCase().includes(lower) ||
        p.user.username.toLowerCase().includes(lower) ||
        ('ticker' in p && p.ticker?.toLowerCase().includes(lower)) ||
        p.hashtags?.some(h => h.toLowerCase().includes(lower))
      )
    : [];

  const hasResults = matchedUsers.length > 0 || matchedPosts.length > 0 || tickerResults.length > 0;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '0' : '0 16px' }}>
      {/* Search input (visible on mobile where topbar search navigates here) */}
      {isMobile && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '0 12px', height: 38,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search posts, users, tickers…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: 'var(--text)',
              }}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', lineHeight: 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {!q ? (
        <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--text-3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12, opacity: 0.4 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Search TradeFlow</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Find posts, traders, and tickers</div>
        </div>
      ) : !hasResults && !tickerLoading ? (
        <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>No results for "{q}"</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try a different search term</div>
        </div>
      ) : (
        <>
          {/* Users */}
          {matchedUsers.length > 0 && (
            <section>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                People
              </div>
              {matchedUsers.map(u => <UserCard key={u.id} user={u} />)}
            </section>
          )}

          {/* Tickers */}
          {(tickerResults.length > 0 || tickerLoading) && (
            <section>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tickers
              </div>
              {tickerLoading && tickerResults.length === 0 ? (
                <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)' }}>Searching…</div>
              ) : (
                tickerResults.map(r => <TickerCard key={r.symbol + r.exchange} result={r} />)
              )}
            </section>
          )}

          {/* Posts */}
          {matchedPosts.length > 0 && (
            <section>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Posts
              </div>
              {matchedPosts.map(p => <PostCard key={p.id} post={p} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
