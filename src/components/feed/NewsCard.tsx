import type { NewsItem } from '../../data/demo';

/** Interpolate Y on the sparkline at a given X (viewBox coords) */
function getSparkY(points: string, targetX: number): number {
  const pts = points.trim().split(/\s+/).map(p => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].x <= targetX && pts[i + 1].x >= targetX) {
      const t = (targetX - pts[i].x) / (pts[i + 1].x - pts[i].x)
      return pts[i].y + t * (pts[i + 1].y - pts[i].y)
    }
  }
  return pts[pts.length - 1]?.y ?? 16
}

export default function NewsCard({ item }: { item: NewsItem }) {
  const isUp = item.up;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Headline */}
      <div style={{ padding: '12px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
            padding: '3px 7px', borderRadius: 4, flexShrink: 0, marginTop: 1,
            background: item.sourceColor,
            color: '#fff',
          }}>
            {item.source}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, marginBottom: 4 }}>
              {item.headline}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text4)' }}>
              {item.time} · {item.category}
            </div>
          </div>
        </div>
      </div>

      {/* Impact row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px',
        borderTop: '1px solid var(--border2)',
        borderBottom: '1px solid var(--border2)',
        background: 'var(--surface2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text4)', textTransform: 'uppercase' }}>
            IMPACT
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
            {item.ticker}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text4)' }}>
            ${item.priceBefore.toFixed(2)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text4)' }}>→</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: isUp ? 'var(--green)' : 'var(--red)' }}>
            ${item.priceAfter.toFixed(2)}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
            background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
            color: isUp ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${isUp ? 'var(--green-border)' : 'var(--red-border)'}`,
          }}>
            {item.changePct}
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>
          in {item.timeAgo}
        </span>
      </div>

      {/* Mini sparkline */}
      <div style={{ padding: '8px 14px 10px' }}>
        <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 5 }}>
          {item.ticker} intraday
        </div>
        {(() => {
          const NEWS_X = 78        // 65% of viewBox width 120
          const SPARK_H = 32       // sparkline SVG height px
          const TOP_PAD = 14       // space above sparkline for label
          const dotY = getSparkY(item.sparkline, NEWS_X)
          const color = isUp ? 'var(--green)' : 'var(--red)'
          const dotTopPx = TOP_PAD + dotY  // px from top of container

          return (
            <div style={{ position: 'relative', height: TOP_PAD + SPARK_H }}>

              {/* Sparkline SVG — no text, safe to stretch */}
              <svg
                width="100%" height={SPARK_H}
                viewBox="0 0 120 32" fill="none"
                preserveAspectRatio="none"
                style={{ position: 'absolute', top: TOP_PAD, left: 0, display: 'block' }}
              >
                <polyline
                  points={item.sparkline}
                  stroke={color} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  fill="none"
                />
              </svg>

              {/* News marker overlay — CSS only, no stretching */}
              <div style={{ position: 'absolute', left: '65%', top: 0, bottom: 0 }}>
                {/* Label */}
                <div style={{
                  position: 'absolute', top: 0, left: 5,
                  fontSize: 9, fontWeight: 700, color,
                  whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', letterSpacing: 0.2,
                }}>
                  News drop
                </div>
                {/* Dashed line from below label to bottom */}
                <div style={{
                  position: 'absolute', top: 10, bottom: 0, left: 0,
                  borderLeft: `1.5px dashed ${color}`, opacity: 0.65,
                }} />
                {/* Dot on sparkline */}
                <div style={{
                  position: 'absolute',
                  top: dotTopPx - 3,
                  left: -3,
                  width: 7, height: 7, borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 0 2px var(--surface)`,
                }} />
              </div>

            </div>
          )
        })()}
      </div>
    </div>
  );
}
