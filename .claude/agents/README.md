# Candl. Claude Code Agents

Drop these files into your project:

```
Candl./
└── .claude/
    └── agents/
        ├── frontend.md   — UI, charts, feed, journal components
        ├── api.md        — MT5 webhooks, CSV import, API routes
        ├── recap.md      — AI weekly recap generation
        └── reviewer.md   — pre-commit code review (runs on Haiku = cheap)
```

---

## How to use

### Automatic delegation
Claude Code reads each agent's `description` and delegates automatically when it recognises a matching task. Just work normally — it picks the right agent.

### Manual delegation
You can also be explicit:

```
"Use the frontend agent to add entry/exit arrows to the chart component"
"Use the api agent to fix the MT5 webhook signature check"
"Use the recap agent to improve the weekly summary prompt"
```

### Parallel builds (big features)
When building something that spans multiple layers:

```
"In parallel: use the frontend agent to build the prop firm tracker UI,
and use the api agent to build the tracker data endpoints"
```

### Pre-commit review
```
"Use the reviewer agent to check the changes in src/features/journal/ before I commit"
```

---

## Token cost guide

| Pattern | When | Cost |
|---|---|---|
| Single agent | Small focused task | ~1× normal |
| 2 parallel agents | Feature spanning UI + API | ~2× |
| 3 parallel agents | Large feature (UI + API + recap) | ~3× |
| reviewer only | Every commit | Low (Haiku model) |

**Rule of thumb:** Use parallel agents for features that touch 2+ domains.
Use single agents (or no agents) for quick edits and bug fixes.
