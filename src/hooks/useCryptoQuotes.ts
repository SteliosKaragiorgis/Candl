import { useState, useEffect } from 'react'
import type { Quote } from '../context/MarketDataContext'

// Maps our display symbol → CoinGecko coin ID
const COINS: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  XRP:  'ripple',
  DOGE: 'dogecoin',
  ADA:  'cardano',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  BNB:  'binancecoin',
}

const IDS = Object.values(COINS).join(',')

export function useCryptoQuotes(refreshMs = 5 * 60_000): Record<string, Quote> {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${IDS}&vs_currencies=usd&include_24hr_change=true`
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        const result: Record<string, Quote> = {}
        for (const [sym, coinId] of Object.entries(COINS)) {
          const d = data[coinId]
          if (d) {
            result[sym] = {
              ticker: sym,
              price: d.usd ?? 0,
              change: 0,
              changePct: d.usd_24h_change ?? 0,
              open: 0, high: 0, low: 0,
            }
          }
        }
        setQuotes(result)
      } catch (e) {
        console.error('[useCryptoQuotes]', e)
      }
    }

    load()
    const id = setInterval(load, refreshMs)
    return () => { cancelled = true; clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return quotes
}
