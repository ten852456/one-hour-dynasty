# Phase 1: Simplified Game Scope

> No combat, focus on resource gathering and building

## ✅ In Scope

| Feature                           | Status   |
| --------------------------------- | -------- |
| Map grid (50×50)                  | To build |
| Terrain (Plain, Forest, Mountain) | To build |
| Resources (Qi, Iron, Herb)        | To build |
| Unit movement                     | To build |
| Resource gathering                | To build |
| Building structures               | To build |
| Basic API                         | To build |
| 15-minute games                   | To build |

## ❌ Out of Scope (Phase 2+)

- Combat system
- Tech tree
- Market trading
- Fog of War
- MON tokens
- Shrinking zone

## Commands Available

| Command   | Description                |
| --------- | -------------------------- |
| `MOVE`    | Move unit 1 tile (N/S/E/W) |
| `GATHER`  | Collect resources          |
| `BUILD`   | Build structure            |
| `DEPOSIT` | Store at Sect Hall         |

## API Endpoints

```
POST /api/v1/join     → Get token & start position
GET  /api/v1/state    → Current game state
POST /api/v1/action   → Submit commands
```

## Game Duration

- **15 minutes** (900 ticks) for testing
- Full 1-hour games in Phase 2
