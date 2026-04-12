import React from 'react';

// ── Relative time ─────────────────────────────────────────────────────────────

export function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay} days ago`;

  const d = new Date(isoTimestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Formatted post body ───────────────────────────────────────────────────────

// Parses $TICKER mentions and **bold** markers from post body text.
// Returns a React fragment with styled spans.

type Segment =
  | { kind: 'ticker'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'text'; text: string }

function parseBody(text: string): Segment[] {
  const segments: Segment[] = [];
  // Split on $TICKER or **bold** patterns
  const re = /(\$[A-Z]{1,6}(?:\.[A-Z]{1,4})?)|(\*\*(.+?)\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ kind: 'text', text: text.slice(last, match.index) });
    }
    if (match[1]) {
      segments.push({ kind: 'ticker', text: match[1] });
    } else if (match[2]) {
      segments.push({ kind: 'bold', text: match[3] });
    }
    last = re.lastIndex;
  }

  if (last < text.length) {
    segments.push({ kind: 'text', text: text.slice(last) });
  }

  return segments;
}

export function FormattedText({ text }: { text: string }): React.ReactElement {
  const segments = parseBody(text);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'ticker') {
          return (
            <span key={i} style={{ color: 'var(--blue)', fontWeight: 500 }}>
              {seg.text}
            </span>
          );
        }
        if (seg.kind === 'bold') {
          return (
            <span key={i} style={{ fontWeight: 500, color: 'var(--text)' }}>
              {seg.text}
            </span>
          );
        }
        return <React.Fragment key={i}>{seg.text}</React.Fragment>;
      })}
    </>
  );
}
