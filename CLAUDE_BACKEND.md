# 🖥️ BACKEND AGENT - API Server

> Focus: REST API, WebSocket, game orchestration

## Your Responsibility

Build the **API Server** that:

- Exposes REST endpoints for agents
- Manages game instances
- Handles WebSocket for spectators
- Integrates World engine & Blockchain

## Folder Structure

```
packages/api/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Express server
│   ├── routes/
│   │   ├── join.ts       # POST /api/v1/join
│   │   ├── state.ts      # GET /api/v1/state
│   │   ├── action.ts     # POST /api/v1/action
│   │   └── spectate.ts   # WebSocket
│   ├── middleware/
│   │   ├── auth.ts       # JWT validation
│   │   └── rateLimit.ts
│   ├── services/
│   │   ├── GameManager.ts
│   │   └── TickRunner.ts
│   └── types/
│       └── index.ts
├── Dockerfile
└── .env.example
```

## API Endpoints

### POST /api/v1/join

```typescript
// Request
{ agentName: string; wallet?: string }

// Response
{ token: string; sectId: string; startLocation: [number, number] }
```

### GET /api/v1/state

```typescript
// Headers: Authorization: Bearer <token>

// Response
{
  tick: number;
  phase: 'GENESIS' | 'GOLDEN' | 'TRIBULATION';
  self: { qi: number; iron: number; herb: number };
  units: Unit[];
  structures: Structure[];
  map: Tile[];  // Visible tiles only
}
```

### POST /api/v1/action

```typescript
// Request
{
  tick: number;
  commands: [
    { unitId: string; type: 'MOVE'; direction: 'N'|'S'|'E'|'W' },
    { unitId: string; type: 'GATHER' },
    { unitId: string; type: 'BUILD'; structureType: string }
  ]
}

// Response
{ success: boolean; executed: number; failed?: string[] }
```

## WebSocket (Spectator)

```typescript
// Connect: ws://localhost:3001/spectate/game_001

// Events sent to clients:
{ type: 'TICK_UPDATE', tick: 105, phase: 'GENESIS' }
{ type: 'UNIT_MOVE', sect: 's_001', unit: 'u_001', to: [10, 11] }
{ type: 'GATHER', sect: 's_001', resource: 'HERB', amount: 5 }
```

## GameManager Service

```typescript
export class GameManager {
  private games: Map<string, Game> = new Map();

  createGame(): string {}
  getGame(gameId: string): Game {}
  joinGame(gameId: string, agentName: string): JoinResult {}

  startTickRunner(gameId: string): void {
    setInterval(() => {
      const game = this.getGame(gameId);
      game.processTick();
      this.broadcastState(gameId);
    }, 1000);
  }
}
```

## Phase 1 Scope

| ✅ Build             | ❌ Skip                |
| -------------------- | ---------------------- |
| join, state, action  | Blockchain integration |
| JWT auth             | MON payment            |
| Basic WebSocket      | Complex spectator      |
| Single game instance | Multi-game             |

## Dependencies

```bash
npm install express cors jsonwebtoken ws
npm install -D typescript @types/express @types/node @types/ws
```

## Commands to Run

```bash
cd packages/api
npm init -y
npm install express cors jsonwebtoken ws uuid
npm install @one-hour-dynasty/world  # Link to world package
npm run dev
```

## Integration Points

- Uses: `@one-hour-dynasty/world` (Game engine)
- Calls: `packages/contracts` (Phase 2)
- Serves: Frontend via CORS
