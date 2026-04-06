import { useState, useEffect } from 'react';
import { ECONOMIC_EVENTS } from '../../data/demo';
import type { EconomicEvent } from '../../data/demo';
import { useTheme } from '../../context/ThemeContext';

interface TimeLeft {
  days: number;
  hrs: number;
  mins: number;
  secs: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function calcTimeLeft(date: Date): TimeLeft {
  const diff = Math.max(0, date.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hrs:  Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

const DOT_COLORS: Record<EconomicEvent['category'], string> = {
  fomc:     '#dc2626',
  cpi:      '#ea580c',
  nfp:      '#ca8a04',
  gdp:      '#0047FF',
  earnings: '#7c3aed',
  pce:      '#16a34a',
};

export default function NewsCountdown() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const sorted = [...ECONOMIC_EVENTS].sort((a, b) => a.date.getTime() - b.date.getTime());
  const now = Date.now();
  const event = sorted.find(e => e.date.getTime() > now);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    event ? calcTimeLeft(event.date) : { days: 0, hrs: 0, mins: 0, secs: 0 }
  );

  useEffect(() => {
    if (!event) return;
    const id = setInterval(() => setTimeLeft(calcTimeLeft(event.date)), 1000);
    return () => clearInterval(id);
  }, [event]);

  if (!event) return null;

  const upcomingEvents = sorted
    .filter(e => e.date.getTime() > event.date.getTime())
    .slice(0, 4);

  const days = timeLeft.days;
  const urgency =
    days === 0 ? 'today' :
    days === 1 ? 'tomorrow' :
    days <= 5  ? 'soon' : 'upcoming';

  const urgencyColor  = urgency === 'today' ? '#dc2626' : urgency === 'tomorrow' ? '#ea580c' : urgency === 'soon' ? '#ca8a04' : (isLight ? '#16a34a' : '#4ade80');
  const urgencyBg     = urgency === 'today' ? 'rgba(220,38,38,0.10)' : urgency === 'tomorrow' ? 'rgba(234,88,12,0.10)' : urgency === 'soon' ? 'rgba(202,138,4,0.10)' : (isLight ? '#f0fdf4' : 'rgba(34,197,94,0.06)');
  const urgencyBorder = urgency === 'today' ? 'rgba(220,38,38,0.28)' : urgency === 'tomorrow' ? 'rgba(234,88,12,0.28)' : urgency === 'soon' ? 'rgba(202,138,4,0.28)' : (isLight ? '#bbf7d0' : 'rgba(34,197,94,0.18)');
  const urgencyLabel  = urgency === 'today' ? 'TODAY' : urgency === 'tomorrow' ? 'TOMORROW' : `${days}D AWAY`;

  const unitStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 7, padding: '6px 4px',
  };

  return (
    <div style={{
      background: urgencyBg,
      border: `1px solid ${urgencyBorder}`,
      borderRadius: 10,
      padding: '12px 12px 10px',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: urgencyColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
        }}>
          {event.icon}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
          {event.shortName === 'FOMC' ? 'FOMC Decision' : event.name}
        </div>
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: 1,
          padding: '2px 6px', borderRadius: 20, textTransform: 'uppercase',
          background: urgencyColor, color: 'white',
        }}>
          {urgencyLabel}
        </span>
      </div>

      {/* Date + time */}
      <div style={{
        fontSize: 10, color: 'var(--text3)',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 10,
      }}>
        {event.date.toLocaleDateString('en-US', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        })} · {event.time} {event.timezone}
      </div>

      {/* Countdown grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 10 }}>
        {timeLeft.days > 0 && (
          <div style={unitStyle}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: urgencyColor, lineHeight: 1 }}>
              {pad(timeLeft.days)}
            </span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginTop: 2 }}>
              days
            </span>
          </div>
        )}

        {[
          { val: timeLeft.hrs,  lbl: 'hrs' },
          { val: timeLeft.mins, lbl: 'min' },
          { val: timeLeft.secs, lbl: 'sec' },
        ].map(u => (
          <div key={u.lbl} style={unitStyle}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: urgencyColor, lineHeight: 1 }}>
              {pad(u.val)}
            </span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginTop: 2 }}>
              {u.lbl}
            </span>
          </div>
        ))}

        {timeLeft.days === 0 && (
          <div style={{ ...unitStyle, background: 'var(--surface2)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', lineHeight: 1 }}>live</span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginTop: 2 }}>
              feed
            </span>
          </div>
        )}
      </div>

      {/* Upcoming events list */}
      {upcomingEvents.length > 0 && (
        <div>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
            color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Up next
          </div>
          {upcomingEvents.map((ev, i) => {
            const daysUntil = Math.floor((ev.date.getTime() - Date.now()) / 86400000);
            const label =
              ev.shortName === ev.name ? ev.shortName :
              ev.shortName + ' ' + (
                ev.category === 'earnings' ? 'Earnings' :
                ev.category === 'fomc'     ? 'Decision' : 'Report'
              );
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 0',
                borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--border2)' : 'none',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: DOT_COLORS[ev.category] ?? 'var(--text4)',
                  flexShrink: 0,
                }} />
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', flex: 1 }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>
                  {daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tmrw' : `${daysUntil}d`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
