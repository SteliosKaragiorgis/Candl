import React from 'react';

export type FilterKey =
  | 'all' | 'long' | 'short'
  | 'fx' | 'stocks' | 'indices' | 'crypto'
  | 'winners' | 'losers'
  | 'published' | 'unpublished';

export type SortKey = 'latest' | 'pnl_desc' | 'pnl_asc' | 'r_multiple' | 'duration';

interface Props {
  activeFilter: FilterKey;
  activeSort: SortKey;
  onFilter: (f: FilterKey) => void;
  onSort: (s: SortKey) => void;
  onImport: () => void;
}

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'long',        label: 'Long'        },
  { key: 'short',       label: 'Short'       },
  { key: 'fx',          label: 'FX'          },
  { key: 'stocks',      label: 'Stocks'      },
  { key: 'indices',     label: 'Indices'     },
  { key: 'crypto',      label: 'Crypto'      },
  { key: 'winners',     label: 'Winners'     },
  { key: 'losers',      label: 'Losers'      },
  { key: 'published',   label: 'Published'   },
  { key: 'unpublished', label: 'Unpublished' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'latest',     label: 'Latest'          },
  { value: 'pnl_desc',   label: 'P&L (high–low)'  },
  { value: 'pnl_asc',    label: 'P&L (low–high)'  },
  { value: 'r_multiple', label: 'R multiple'       },
  { value: 'duration',   label: 'Duration'         },
];

export default function TradeFilterBar({ activeFilter, activeSort, onFilter, onSort, onImport }: Props) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderBottom: '0.5px solid var(--border)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      flexShrink: 0,
    }}>
      {CHIPS.map(chip => {
        const active = chip.key === activeFilter;
        return (
          <button
            key={chip.key}
            onClick={() => onFilter(chip.key)}
            style={{
              fontSize: 12,
              padding: '5px 12px',
              borderRadius: 5,
              border: `0.5px solid ${active ? 'var(--green-border)' : 'var(--border-hard)'}`,
              color: active ? 'var(--green)' : 'var(--text-2)',
              background: active ? 'var(--green-bg)' : 'transparent',
              fontWeight: active ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.1s',
            }}
          >
            {chip.label}
          </button>
        );
      })}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
        <select
          value={activeSort}
          onChange={e => onSort(e.target.value as SortKey)}
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 5,
            padding: '5px 10px',
            fontSize: 12,
            color: 'var(--text-2)',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={onImport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 5,
            border: '0.5px solid var(--border-hard)',
            color: 'var(--text-2)',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Import CSV
        </button>
      </div>
    </div>
  );
}
