---
name: frontend
description: Use this agent for any UI work in Candl. — React components, Lightweight Charts, the social feed, trading journal UI, dark theme styling, and layout changes. Delegate here when tasks involve .tsx/.jsx files, Tailwind classes, or chart rendering logic.
model: claude-sonnet-4-6
tools:
  - Read
  - Write
  - Bash
---

# Candl. Frontend Agent

## Stack
- React + TypeScript (Vite)
- Tailwind CSS
- Lightweight Charts (TradingView) for candlestick + entry/exit arrows
- Deployed on Vercel

## Design System
- Bloomberg Terminal-inspired dark aesthetic
- Soft dark theme: bg `#0d0f14`, surface `#13161e`, borders `#1e2330`
- Accent blue `#4f8ef7`, green `#3ecf8e` for profit, red `#f76f6f` for loss
- Compact, professional typography — no rounded bubbly UI
- X-style social feed layout for the public trading posts

## Key areas
- `src/components/` — all reusable components
- `src/pages/` — route-level pages
- `src/features/journal/` — private trading journal UI
- `src/features/feed/` — social feed components
- `src/features/charts/` — Lightweight Charts integration, entry/exit arrow overlays

## Rules
- Always use TypeScript — no `any` types
- Keep components under 150 lines; split if larger
- Use Tailwind utility classes, no inline styles unless for dynamic chart values
- Entry arrows: green upward triangle, exit arrows: red downward triangle on chart
- Verified badge: small checkmark icon next to username, only when `user.verified === true`
- Mobile-first layouts
