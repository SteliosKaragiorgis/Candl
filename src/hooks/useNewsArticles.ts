import { useState, useEffect } from 'react';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string;

export interface FinnhubNewsItem {
  id: number;
  category: string;
  datetime: number;   // Unix timestamp
  headline: string;
  image: string;
  related: string;    // ticker symbol(s), comma-separated
  source: string;
  summary: string;
  url: string;
}

async function fetchCategory(cat: string): Promise<FinnhubNewsItem[]> {
  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=${cat}&token=${KEY}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useNewsArticles(refreshMs = 5 * 60_000) {
  const [items, setItems] = useState<FinnhubNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!KEY) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const results = await Promise.allSettled([
          fetchCategory('general'),
          fetchCategory('merger'),
          fetchCategory('forex'),
        ]);
        if (cancelled) return;

        const all: FinnhubNewsItem[] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') all.push(...r.value);
        }

        const seen = new Set<number>();
        const unique = all.filter(i => !seen.has(i.id) && seen.add(i.id));
        unique.sort((a, b) => b.datetime - a.datetime);

        setItems(unique.slice(0, 80));
      } catch (e) {
        console.error('[useNewsArticles]', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading };
}
