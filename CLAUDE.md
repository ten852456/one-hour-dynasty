# CLAUDE.md - Multi-Agent Project Instructions

> This file provides overview for all AI agents working on this project.

## Project: One Hour Dynasty

Wuxia strategy game for AI Agents | Monad AI Agent Hackathon

---

## 🤖 Agent Work Distribution

| Agent             | File                   | Responsibility                            |
| ----------------- | ---------------------- | ----------------------------------------- |
| 🌍 **World**      | `CLAUDE_WORLD.md`      | Game engine, world state, tick processing |
| 🎨 **Frontend**   | `CLAUDE_FRONTEND.md`   | Next.js website (already created)         |
| ⛓️ **Blockchain** | `CLAUDE_BLOCKCHAIN.md` | Solidity contracts, Monad deployment      |
| 🖥️ **Backend**    | `CLAUDE_BACKEND.md`    | REST API, WebSocket, game orchestration   |

---

## Project Structure (Current)

```
monad_wuxia/
├── docs/
│   ├── WHITEPAPER.md       # Game rules
│   ├── ARCHITECTURE.md     # Sequence diagrams
│   └── PHASE1_SCOPE.md     # Simplified scope
├── website/                # 🎨 Frontend (EXISTING)
│   ├── src/app/
│   │   ├── page.tsx        # Homepage
│   │   ├── docs/           # Docs viewer
│   │   └── dashboard/      # Dashboard
│   └── public/
├── packages/
│   ├── world/              # 🌍 Game engine (TO CREATE)
│   ├── contracts/          # ⛓️ Smart contracts (TO CREATE)
│   └── api/                # 🖥️ Backend (TO CREATE)
├── CLAUDE_WORLD.md
├── CLAUDE_FRONTEND.md
├── CLAUDE_BLOCKCHAIN.md
└── CLAUDE_BACKEND.md
```

---

## Phase 1 Scope (All Agents)

| ✅ Build            | ❌ Skip        |
| ------------------- | -------------- |
| Basic game loop     | Combat system  |
| Resource gathering  | Tech tree      |
| Building structures | Market trading |
| REST API            | MON payments   |
| Static dashboard    | Live WebSocket |
| Testnet deploy      | Mainnet        |

---

## How to Start

```
# World Agent
Read CLAUDE_WORLD.md and implement the game engine

# Frontend Agent (website already exists)
Read CLAUDE_FRONTEND.md and enhance the existing website

# Blockchain Agent
Read CLAUDE_BLOCKCHAIN.md and create smart contracts

# Backend Agent
Read CLAUDE_BACKEND.md and build the API server
```

---

## Build Order

1. **Frontend** ← Already started ✓
2. **World** (game engine)
3. **Blockchain** (can be parallel)
4. **Backend** (depends on World)
