# CLAUDE.md - Multi-Agent Project Instructions

> This file provides overview for all AI agents working on this project.

## Project: One Hour Dynasty

Wuxia strategy game for AI Agents | Monad AI Agent Hackathon

---

## 📁 Documentation Structure

```
docs/
├── agents/                   # Agent-specific architecture docs
│   ├── BACKEND.md           # Backend API, x402 integration
│   ├── BLOCKCHAIN.md        # Smart contracts, ERC-8004
│   ├── FRONTEND.md          # Next.js website
│   └── WORLD.md             # Game engine
├── tasks/                    # Quick task files for agents
│   ├── TASK_BACKEND.md      # Backend implementation task
│   └── TASK_BLOCKCHAIN.md   # Blockchain implementation task
├── WHITEPAPER.md            # Complete game rules
├── TOKENOMICS.md            # $WUXIA token details
├── ERC8004_X402_INTEGRATION.md  # Monad standards integration
├── LOBBY_SYSTEM.md          # Room/matchmaking design
└── LAUNCH_SIMULATION.md     # Token launch strategy
```

---

## 🤖 Agent Work Distribution

| Agent             | Docs                        | Task                            | Focus               |
| ----------------- | --------------------------- | ------------------------------- | ------------------- |
| ⛓️ **Blockchain** | `docs/agents/BLOCKCHAIN.md` | `docs/tasks/TASK_BLOCKCHAIN.md` | Contracts, ERC-8004 |
| 🖥️ **Backend**    | `docs/agents/BACKEND.md`    | `docs/tasks/TASK_BACKEND.md`    | API, x402 payments  |
| 🌍 **World**      | `docs/agents/WORLD.md`      | -                               | Game engine         |
| 🎨 **Frontend**   | `docs/agents/FRONTEND.md`   | -                               | Website, dashboard  |

---

## 🔑 Key Technologies

| Feature        | Standard                | Status      |
| -------------- | ----------------------- | ----------- |
| Agent Identity | **ERC-8004** (optional) | ✅ Designed |
| Room Payment   | **x402** (MON)          | ✅ Designed |
| Token          | **$WUXIA** (ERC-20)     | ✅ Designed |

---

## Project Structure

```
monad_wuxia/
├── docs/                    # All documentation
├── website/                 # 🎨 Frontend (EXISTING)
│   └── src/app/
├── packages/
│   ├── world/              # 🌍 Game engine (TO CREATE)
│   ├── contracts/          # ⛓️ Smart contracts (TO CREATE)
│   └── server/             # 🖥️ Backend (TO CREATE)
└── CLAUDE.md               # This file
```

---

## Build Order

1. ⛓️ **Blockchain**: Token + ItemStore contracts
2. 🖥️ **Backend**: x402 payment + API
3. 🌍 **World**: Game engine
4. 🎨 **Frontend**: Connect all pieces
