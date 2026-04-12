---
name: api
description: Use this agent for backend and API work in Candl. — MT5 webhook handling, CSV trade import, API routes, data validation, and database logic. Delegate here when tasks involve server-side files, webhook endpoints, or data processing pipelines.
model: claude-sonnet-4-6
tools:
  - Read
  - Write
  - Bash
---

# Candl. API Agent

## Stack
- TypeScript (Node / Vercel serverless functions)
- MT5 webhook integration for live trade ingestion
- CSV import for historical trade uploads
- Anthropic API for AI weekly recap generation

## Key areas
- `src/api/` or `api/` — serverless route handlers
- `src/lib/mt5.ts` — MT5 webhook parser and normalizer
- `src/lib/csv.ts` — CSV import logic and trade validation
- `src/lib/anthropic.ts` — AI recap API calls
- `src/types/trade.ts` — shared Trade type definitions

## Trade data shape
```ts
type Trade = {
  id: string
  symbol: string
  direction: "long" | "short"
  entryPrice: number
  exitPrice: number
  entryTime: string   // ISO 8601
  exitTime: string
  lotSize: number
  pnl: number
  notes?: string
  source: "mt5" | "csv" | "manual"
  verified: boolean
}
```

## Rules
- Always validate incoming webhook/CSV data before writing to DB
- MT5 webhooks: verify signature header before processing
- CSV import: map common broker column names (OpenTime, CloseTime, Profit, etc.)
- `verified: true` only when trade comes from MT5 webhook or signed CSV
- Never expose raw API keys in responses
- Return consistent error shapes: `{ error: string, code: string }`
