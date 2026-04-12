import { useRef, useState } from 'react';
import type { ShareCardUser } from './ShareableTradeCard';
import { useShareCard } from '../../hooks/useShareCard';
import type { Trade } from '../../types/trade';
import CardPreview from './CardPreview';

interface Props {
  trade: Trade;
  user: ShareCardUser;
  onClose: () => void;
}

type CardStyle = 'A' | 'C';

// ── SVG icons ─────────────────────────────────────────────────────────────────

function CandleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {/* Left candle (bullish) */}
      <rect x="1.5" y="5" width="3" height="6" fill={color} rx="0.5" />
      <line x1="3" y1="2.5" x2="3" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="3" y1="11" x2="3" y2="13.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Middle candle (bearish) */}
      <rect x="6.5" y="3" width="3" height="8" fill={color} rx="0.5" opacity="0.6" />
      <line x1="8" y1="1" x2="8" y2="3" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="8" y1="11" x2="8" y2="14" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Right candle (bullish) */}
      <rect x="11.5" y="5.5" width="3" height="5" fill={color} rx="0.5" />
      <line x1="13" y1="3" x2="13" y2="5.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="13" y1="10.5" x2="13" y2="13" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function LineIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <polyline
        points="1,13 4,8 7,10 10,4 13,6 15,3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ShareModal({ trade, user, onClose }: Props) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const [cardStyle, setCardStyle] = useState<CardStyle>('A');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState<'share' | 'copy' | 'download' | null>(null);
  const [copied, setCopied] = useState(false);

  const { handleShare, handleCopyImage, captureCard, handleDownload } = useShareCard();

  async function run(action: 'share' | 'copy' | 'download') {
    setBusy(action);
    try {
      if (action === 'share') {
        await handleShare(cardRef as React.RefObject<HTMLElement>, caption);
      }
      if (action === 'copy') {
        await handleCopyImage(cardRef as React.RefObject<HTMLElement>);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      if (action === 'download') {
        const c = await captureCard(cardRef as React.RefObject<HTMLElement>);
        handleDownload(c);
      }
    } finally {
      setBusy(null);
    }
  }

  // Style toggle button
  const STYLES: { key: CardStyle; label: string; sub: string }[] = [
    { key: 'A', label: 'Candle chart',  sub: 'Shows entry/exit skill'  },
    { key: 'C', label: 'Line chart',    sub: 'Shows trade narrative'   },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderTop: '2px solid var(--green)',
          borderRadius: 12,
          width: 480,
          maxWidth: 'calc(100% - 32px)',
          padding: '20px',
          position: 'relative',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
          }}
        >×</button>

        {/* Title */}
        <div style={{
          fontSize: 15, fontWeight: 600, color: 'var(--text)',
          marginBottom: 16, paddingRight: 36,
        }}>
          Share trade
        </div>

        {/* Card style toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {STYLES.map(({ key, label, sub }) => {
            const active = cardStyle === key;
            const iconColor = active ? 'var(--green)' : 'var(--text-3)';
            return (
              <button
                key={key}
                onClick={() => setCardStyle(key)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: active
                    ? '0.5px solid var(--green-border)'
                    : '0.5px solid var(--border)',
                  background: active ? 'var(--green-bg)' : 'transparent',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                {key === 'A'
                  ? <CandleIcon color={iconColor} />
                  : <LineIcon   color={iconColor} />
                }
                <div>
                  <div style={{
                    fontSize: 12, fontWeight: 500,
                    color: active ? 'var(--green)' : 'var(--text)',
                    lineHeight: 1.3,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                    {sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Card preview — scaled to fit the modal without breaking html2canvas */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          marginBottom: 16,
          // Clip the scaled card so it doesn't overflow the modal
          overflow: 'hidden',
          // Height = card natural height × scale factor
          // Card is ~430px tall; 430 × 0.88 ≈ 378px
          height: 378,
        }}>
          <div style={{
            transform: 'scale(0.88)',
            transformOrigin: 'top center',
            // The wrapper must be at natural card size so transform works correctly
            flexShrink: 0,
          }}>
            {/*
              cardRef is on the unscaled card — html2canvas ignores CSS transforms
              and captures at full 400px width, giving a clean 800px @2x image.
            */}
            <CardPreview
              trade={trade}
              user={user}
              style={cardStyle}
              cardRef={cardRef}
            />
          </div>
        </div>

        {/* Caption */}
        <div>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--text-4)', marginBottom: 6,
          }}>
            Caption (optional)
          </div>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's the story behind this trade?"
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-hard)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 13,
              color: 'var(--text)',
              fontFamily: 'Inter, sans-serif',
              resize: 'none',
              height: 72,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {/* Share */}
          <button
            onClick={() => run('share')}
            disabled={busy !== null}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'var(--green)', color: '#000',
              border: 'none', borderRadius: 6,
              padding: 10, fontSize: 13, fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy === 'share' ? 0.7 : 1,
            }}
          >
            <ShareIcon />
            {busy === 'share' ? 'Sharing…' : 'Share'}
          </button>

          {/* Copy image */}
          <button
            onClick={() => run('copy')}
            disabled={busy !== null}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              border: '0.5px solid var(--border-hard)',
              borderRadius: 6, padding: '10px 14px',
              fontSize: 13, color: copied ? 'var(--green)' : 'var(--text-2)',
              background: 'transparent',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy === 'copy' ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            <CopyIcon />
            {copied ? 'Copied ✓' : busy === 'copy' ? '…' : 'Copy image'}
          </button>

          {/* Download */}
          <button
            onClick={() => run('download')}
            disabled={busy !== null}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              border: '0.5px solid var(--border-hard)',
              borderRadius: 6, padding: '10px 14px',
              fontSize: 13, color: 'var(--text-2)',
              background: 'transparent',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy === 'download' ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            <DownloadIcon />
            {busy === 'download' ? '…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}
