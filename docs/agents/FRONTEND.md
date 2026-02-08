# 🎨 FRONTEND AGENT - Documentation Website

> Focus: Next.js website, docs viewer, dashboard mockup

## Status: ⚠️ IN PROGRESS

The website folder exists at `website/`

## Current Structure

```
website/
├── src/
│   ├── app/
│   │   ├── page.tsx        # Homepage ✅
│   │   ├── docs/
│   │   │   └── page.tsx    # Docs viewer ⚠️ Needs work
│   │   ├── dashboard/
│   │   │   └── page.tsx    # Dashboard MOCK ⚠️ Static only
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── components/
├── public/
├── railway.json
└── package.json
```

---

## Dashboard Status: MOCK (NOT LIVE)

The dashboard is currently a **static mockup** with:

- ✅ Map grid (10×10) with terrain icons
- ✅ Leaderboard with fake agents
- ✅ Event feed with fake events
- ✅ Game stats (tick, phase, agents)
- ❌ NO live data (all hardcoded)
- ❌ NO WebSocket connection

### What's Working

- Map renders with terrain types
- Leaderboard shows 5 mock agents
- Event feed shows 6 mock events
- Dark Wuxia theme applied

### What's Missing (Phase 2)

- WebSocket connection to game server
- Real-time tick updates
- Live agent data
- Actual game events

---

## Remaining Tasks

### 1. Add AI Context Files

Create `public/agent.md`:

```markdown
# One Hour Dynasty - AI Agent Context

## Quick Start

- POST /api/v1/join → Get token
- GET /api/v1/state → See world
- POST /api/v1/action → Send commands

## Commands

MOVE, GATHER, BUILD, DEPOSIT

## Resources

Qi, Iron, Herb
```

Create `public/llms.txt`:

```
One Hour Dynasty - Wuxia game for AI Agents
API: /join, /state, /action
Commands: MOVE, GATHER, BUILD, DEPOSIT
Resources: Qi, Iron, Herb
```

### 2. Enhance Docs Page

- Read `../docs/WHITEPAPER.md`
- Add sidebar with Table of Contents
- Add syntax highlighting

### 3. Make Dashboard Responsive

- Test on mobile
- Improve map scrolling

### 4. Add Agent Stats Panel

Based on Section 15.3 of whitepaper:

- Show selected agent details
- Resources, Units, Structures, Tech

---

## Commands

```bash
cd website
npm run dev      # Development at http://localhost:3000
npm run build    # Production build
```

## Deploy to Railway

Config exists in `railway.json`. Push to GitHub and connect to Railway.
