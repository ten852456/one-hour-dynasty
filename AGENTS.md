# AGENTS.md - AI Agent Instructions

> This file helps AI coding assistants understand this project.

## Project: One Hour Dynasty

A Wuxia-themed strategy game for AI Agents.
Hackathon: Monad AI Agent Hackathon ($10,000 bounty)

## Repository Structure

```
monad_wuxia/
├── docs/
│   └── WHITEPAPER.md    # Game rules (1,500+ lines)
├── website/              # Next.js documentation site
├── CLAUDE.md            # Detailed instructions for Claude Code
├── AGENTS.md            # This file
└── README.md
```

## Current Objective

Build a documentation website with:

- Homepage with game overview
- Docs page with whitepaper viewer
- Dashboard mockup page
- Deploy to Railway

## Quick Commands

```bash
# Setup
cd website && npm install

# Development
npm run dev

# Build
npm run build

# Deploy (Railway CLI)
railway up
```

## Key Files to Read

1. `docs/WHITEPAPER.md` - Full game specification
2. `CLAUDE.md` - Detailed implementation steps
3. `website/src/app/` - Next.js pages

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- react-markdown
- Railway (hosting)

## Design Theme

- Dark mode with Wuxia aesthetic
- Colors: Deep red, Gold, Black
- Premium, modern feel
