// MT5 integration types

export type PendingTrade = {
  ticket: number
  symbol: string
  direction: 'long' | 'short'
  volume: number
  entry_price: number
  exit_price: number
  sl: number
  tp: number
  profit: number
  net_profit: number
  r_multiple: number
  duration_formatted: string
  open_time: string
  close_time: string
  status: 'pending' | 'published' | 'dismissed'
}

export type MT5TradePayload = {
  event: 'trade_closed' | 'trade_opened'
  api_key: string
  trade: {
    ticket: number
    symbol: string
    direction: 'long' | 'short'
    volume: number
    entry_price: number
    exit_price?: number
    sl: number
    tp: number
    profit?: number
    commission?: number
    swap?: number
    net_profit?: number
    open_time: string
    close_time?: string
    duration_seconds?: number
    magic_number?: number
    comment?: string
  }
}
