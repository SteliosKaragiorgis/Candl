---
name: recap
description: Use this agent for anything related to the AI weekly recap feature — prompt engineering, recap generation logic, output formatting, and the Anthropic API integration. Delegate here when working on how Claude analyses trade data and generates the weekly summary.
model: claude-sonnet-4-6
tools:
  - Read
  - Write
---

# Candl. AI Recap Agent

## Purpose
Generates a weekly trading recap for the user using their trade data from the past 7 days. Calls the Anthropic API (claude-sonnet-4-6) and returns a structured summary.

## Key file
`src/lib/recap.ts` — main recap generation logic

## Recap output shape
```ts
type WeeklyRecap = {
  weekOf: string
  totalTrades: number
  winRate: number
  totalPnl: number
  bestTrade: Trade
  worstTrade: Trade
  topSymbols: string[]
  summary: string       // AI narrative paragraph
  insights: string[]    // 3-5 bullet insights
  focusArea: string     // one thing to improve next week
}
```

## Prompt guidelines
- Tone: professional, concise, like a trading desk analyst — not motivational coach
- Lead with numbers, then narrative
- Insights should be specific to the actual trades, not generic advice
- focusArea should be honest and direct, even if it means calling out a weakness
- Keep summary under 120 words
- Never hallucinate trade data — only reference what's passed in

## Rules
- Always pass the full trade array as context to the API call
- Use `max_tokens: 1000`
- Parse response and map to `WeeklyRecap` type before returning
- If fewer than 3 trades in the week, return a minimal recap with a note
