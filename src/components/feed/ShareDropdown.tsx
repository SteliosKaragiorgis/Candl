import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  postId: string;
  title: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export default function ShareDropdown({ postId, title, anchorRef, onClose }: Props) {
  const url = `${window.location.origin}/post/${postId}`;
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate position from the anchor button
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropW = 280;
      // Position above the button, right-aligned, but keep inside viewport
      const left = Math.min(
        rect.right - dropW,
        window.innerWidth - dropW - 8
      );
      setPos({
        top: rect.top + window.scrollY,
        left: Math.max(8, left),
        width: dropW,
      });
    }
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1500);
  }

  const options = [
    {
      label: 'X (Twitter)',
      color: '#000',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.265 5.632 5.9-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'WhatsApp',
      color: '#25D366',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
      label: 'Telegram',
      color: '#0088cc',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
  ];

  const DROPDOWN_H = 148; // approximate height

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.top - DROPDOWN_H - 8,
        left: pos.left,
        width: pos.width,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 14,
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Share this post</div>

      {/* URL + copy */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          readOnly
          value={url}
          style={{
            flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '6px 9px', fontSize: 10,
            color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace',
            outline: 'none', minWidth: 0,
          }}
        />
        <button
          onClick={copyLink}
          style={{
            flexShrink: 0, padding: '6px 11px', borderRadius: 7,
            border: '1px solid var(--border)',
            background: copied ? 'var(--green-bg)' : 'var(--surface2)',
            color: copied ? 'var(--green)' : 'var(--text)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
          }}
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>

      {/* Share options */}
      <div style={{ display: 'flex', gap: 7 }}>
        {options.map(({ label, color, icon, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '9px 4px', borderRadius: 9, border: '1px solid var(--border)',
              background: 'var(--bg)', textDecoration: 'none', color,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
          >
            {icon}
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{label}</span>
          </a>
        ))}
      </div>
    </div>,
    document.body
  );
}
