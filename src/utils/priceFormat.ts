/**
 * Shared price formatting helpers used by both trades/TradeChart and feed/TradeChart.
 */

export function getPriceFormat(
  symbol: string,
  price: number,
): { precision: number; minMove: number } {
  const s = symbol.toUpperCase();
  if (s.includes('JPY'))  return { precision: 3, minMove: 0.001 };
  if (price >= 10_000)    return { precision: 1, minMove: 0.1 };
  if (price >= 1_000)     return { precision: 2, minMove: 0.01 };
  if (price >= 100)       return { precision: 2, minMove: 0.01 };
  if (price >= 10)        return { precision: 3, minMove: 0.001 };
  if (price >= 1)         return { precision: 5, minMove: 0.00001 };
  return                         { precision: 5, minMove: 0.00001 };
}

export function formatPrice(price: number, symbol = ''): string {
  const { precision } = getPriceFormat(symbol, price);
  return price.toFixed(precision);
}
