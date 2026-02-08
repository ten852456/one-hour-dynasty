# 🌍 WORLD AGENT - Game Engine

> Focus: Core game logic, world state, tick processing

## Your Responsibility

Build the **Game Engine** that manages:

- World state (map, units, structures)
- Tick-based game loop
- Resource mechanics
- Unit commands processing

## Folder Structure

```
packages/world/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── Game.ts           # Main game class
│   ├── World.ts          # Map & terrain
│   ├── Sect.ts           # Player faction
│   ├── Unit.ts           # Unit class
│   ├── Structure.ts      # Building class
│   ├── ResourceManager.ts
│   └── TickProcessor.ts
└── tests/
    └── game.test.ts
```

## Core Classes

### Game.ts

```typescript
export class Game {
  id: string;
  tick: number = 0;
  phase: "GENESIS" | "GOLDEN" | "TRIBULATION" = "GENESIS";
  world: World;
  sects: Map<string, Sect>;

  constructor(config: GameConfig) {}

  join(agentName: string): Sect {}

  submitAction(sectId: string, commands: Command[]): ActionResult {}

  getState(sectId: string): GameState {}

  processTick(): void {
    this.tick++;
    this.processMovement();
    this.processGathering();
    this.processBuilding();
    this.processProduction();
    this.updatePhase();
  }
}
```

### World.ts

```typescript
export class World {
  width: number = 50;
  height: number = 50;
  tiles: Tile[][];

  generateMap(): void {}
  getTile(x: number, y: number): Tile {}
  getResourceAt(x: number, y: number): Resource | null {}
}

interface Tile {
  x: number;
  y: number;
  terrain: "PLAIN" | "FOREST" | "MOUNTAIN" | "WATER";
  resource?: { type: string; amount: number };
}
```

## Phase 1 Scope

| ✅ Build            | ❌ Skip        |
| ------------------- | -------------- |
| Map generation      | Combat         |
| Unit movement       | Fog of War     |
| Resource gathering  | Tech tree      |
| Building structures | Market         |
| Tick processing     | Zone shrinking |

## Commands to Implement

```typescript
type Command =
  | { type: "MOVE"; unitId: string; direction: "N" | "S" | "E" | "W" }
  | { type: "GATHER"; unitId: string }
  | { type: "BUILD"; unitId: string; structureType: string }
  | { type: "DEPOSIT"; unitId: string };
```

## Integration Points

- **Backend** calls: `game.join()`, `game.submitAction()`, `game.getState()`
- Export as npm package: `@one-hour-dynasty/world`

## Commands to Run

```bash
cd packages/world
npm init -y
npm install typescript @types/node -D
npx tsc --init
npm run build
npm test
```
