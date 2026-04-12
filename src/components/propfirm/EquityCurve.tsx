import { useRef, useEffect, useCallback } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  type UTCTimestamp,
  type IChartApi,
  type ISeriesApi,
  type AreaStyleOptions,
  type SeriesOptionsCommon,
} from 'lightweight-charts';
import type { Challenge } from '../../types/propfirm';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  challenge: Challenge;
  height?: number;
}

interface EquityPoint {
  time: UTCTimestamp;
  value: number;
  dailyPnl: number;
  dateLabel: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Read a CSS variable from the document root, falling back to `fallback`.
 * This runs at chart-init time so the DOM must be mounted.
 */
function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function fmtBalance(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPnl(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

// ── Build equity series from trading_days ──────────────────────────────────────

function buildEquityPoints(challenge: Challenge): EquityPoint[] {
  const today = todayStr();

  // Filter to days that have actually happened and have a real trade or pnl
  const pastDays = challenge.trading_days
    .filter(d => d.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (pastDays.length === 0) return [];

  const points: EquityPoint[] = [];
  let runningBalance = challenge.starting_balance;

  for (const day of pastDays) {
    runningBalance += day.pnl;
    // Convert YYYY-MM-DD to UTC timestamp (seconds)
    const ts = Math.floor(new Date(day.date + 'T00:00:00Z').getTime() / 1000) as UTCTimestamp;
    points.push({
      time: ts,
      value: runningBalance,
      dailyPnl: day.pnl,
      dateLabel: day.date,
    });
  }

  return points;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function EquityCurve({ challenge, height = 180 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef   = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<any>(null);
  const pointsRef    = useRef<EquityPoint[]>([]);

  const buildAndRender = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Destroy previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const points = buildEquityPoints(challenge);
    pointsRef.current = points;

    // Read theme colours from CSS variables at render time
    const bg          = cssVar('--bg-card',     '#13161e');
    const textMuted   = cssVar('--text-muted',  '#6b7280');
    const borderColor = cssVar('--border',      '#1e2330');
    const green       = cssVar('--green',       '#3ecf8e');
    const red         = cssVar('--red',         '#f76f6f');

    const chart = createChart(el, {
      width:  el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: textMuted,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'transparent' },
        horzLines: { color: borderColor },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: { top: 0.15, bottom: 0.1 },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
      handleScale: false,
      handleScroll: false,
    } as any);

    chartRef.current = chart;

    // ── Area series (green above starting_balance, red below) ──────────────
    // Lightweight Charts v5 doesn't support dynamic fill color per value,
    // so we use the overall pnl direction for the dominant colour, and
    // rely on price lines to communicate the bounds.
    const isProfit = (points[points.length - 1]?.value ?? challenge.starting_balance) >= challenge.starting_balance;

    const lineColor       = isProfit ? green : red;
    const topColorAlpha   = isProfit ? 'rgba(62,207,142,0.18)' : 'rgba(247,111,111,0.14)';
    const bottomColorAlpha = 'rgba(0,0,0,0)';

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor:    topColorAlpha,
      bottomColor: bottomColorAlpha,
      lineWidth:   2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      crosshairMarkerVisible: true,
      crosshairMarkerRadius:  4,
    });

    seriesRef.current = series;

    if (points.length === 0) {
      // No data yet — draw a flat line at starting balance using today as
      // a synthetic single point so the chart still renders
      const nowTs = Math.floor(Date.now() / 1000) as UTCTimestamp;
      series.setData([{ time: nowTs, value: challenge.starting_balance }]);
    } else if (points.length === 1) {
      // Single point: duplicate with a slight offset so the line is visible
      const p = points[0];
      const prevTs = (p.time - 86400) as UTCTimestamp;
      series.setData([
        { time: prevTs, value: challenge.starting_balance },
        { time: p.time, value: p.value },
      ]);
    } else {
      series.setData(points.map(p => ({ time: p.time, value: p.value })));
    }

    // ── Reference line: starting balance ───────────────────────────────────
    series.createPriceLine({
      price:            challenge.starting_balance,
      color:            borderColor,
      lineWidth:        1,
      lineStyle:        LineStyle.Solid,
      axisLabelVisible: false,
      title:            '',
    });

    // ── Reference line: profit target ─────────────────────────────────────
    const profitRule = challenge.rules.find(r => r.type === 'profit_target');
    if (profitRule) {
      const targetBalance = challenge.starting_balance + profitRule.limit;
      series.createPriceLine({
        price:            targetBalance,
        color:            green,
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            'Target',
      });
    }

    // ── Reference line: max drawdown floor ────────────────────────────────
    const ddRule = challenge.rules.find(r => r.type === 'total_drawdown');
    if (ddRule) {
      const ddFloor = challenge.starting_balance - ddRule.limit;
      series.createPriceLine({
        price:            ddFloor,
        color:            red,
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            'Max DD',
      });
    }

    chart.timeScale().fitContent();

    // ── Crosshair tooltip ─────────────────────────────────────────────────
    const crosshairHandler = (param: any) => {
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;

      if (!param.point || !param.time) {
        tooltipEl.style.display = 'none';
        return;
      }

      const ts = param.time as UTCTimestamp;
      const pt = pointsRef.current.find(p => p.time === ts);
      if (!pt) {
        tooltipEl.style.display = 'none';
        return;
      }

      // Build tooltip content via DOM to avoid innerHTML
      tooltipEl.textContent = '';

      const dateLine = document.createElement('div');
      dateLine.style.cssText = `font-size:10px;color:${textMuted};margin-bottom:3px;`;
      dateLine.textContent = pt.dateLabel;

      const balanceLine = document.createElement('div');
      balanceLine.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums;';
      balanceLine.textContent = `$${fmtBalance(pt.value)}`;

      const pnlLine = document.createElement('div');
      const pnlColor = pt.dailyPnl >= 0 ? green : red;
      pnlLine.style.cssText = `font-size:11px;color:${pnlColor};font-variant-numeric:tabular-nums;`;
      pnlLine.textContent = `${fmtPnl(pt.dailyPnl)} today`;

      tooltipEl.appendChild(dateLine);
      tooltipEl.appendChild(balanceLine);
      tooltipEl.appendChild(pnlLine);

      // Position tooltip: keep it inside the container
      const containerRect = el.getBoundingClientRect();
      const x = param.point.x;
      const y = param.point.y;

      const ttW = 110;
      const ttH = 58;
      const LEFT_OFFSET  = 12;
      const RIGHT_EDGE   = el.clientWidth - ttW - 8;

      const leftPos  = Math.min(x + LEFT_OFFSET, RIGHT_EDGE);
      const topPos   = Math.max(0, Math.min(y - ttH - 8, height - ttH - 4));

      // Only show if cursor is within component bounds
      if (param.point.x < 0 || param.point.x > containerRect.width) {
        tooltipEl.style.display = 'none';
        return;
      }

      tooltipEl.style.display  = 'block';
      tooltipEl.style.left     = `${leftPos}px`;
      tooltipEl.style.top      = `${topPos}px`;
    };

    chart.subscribeCrosshairMove(crosshairHandler);

    // ── Resize observer ───────────────────────────────────────────────────
    const ro = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        chartRef.current.resize(entries[0].contentRect.width, height);
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(crosshairHandler);
    };
  }, [challenge, height]);

  useEffect(() => {
    const cleanup = buildAndRender();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [buildAndRender]);

  const isEmpty = buildEquityPoints(challenge).length === 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Lightweight Charts canvas */}
      <div ref={containerRef} style={{ width: '100%' }} />

      {/* Floating tooltip */}
      <div
        ref={tooltipRef}
        style={{
          display:       'none',
          position:      'absolute',
          pointerEvents: 'none',
          zIndex:        20,
          background:    'var(--bg-surface)',
          border:        '0.5px solid var(--border)',
          borderRadius:  6,
          padding:       '6px 8px',
          lineHeight:    1.5,
          minWidth:      100,
          boxShadow:     '0 2px 8px rgba(0,0,0,0.35)',
        }}
      />

      {/* Empty state overlay */}
      {isEmpty && (
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          pointerEvents:  'none',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            No trading data yet
          </span>
        </div>
      )}

      {/* Hide Lightweight Charts logo */}
      <div style={{
        position:      'absolute',
        bottom:        0,
        left:          0,
        width:         52,
        height:        24,
        background:    'var(--bg-card)',
        zIndex:        10,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
