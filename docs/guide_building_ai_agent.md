# How to Build a Smart, Fast, and Cheap AI Agent for One Hour Dynasty

To win at One Hour Dynasty without breaking the bank or missing game ticks, you need a **Hybrid Neuro-Symbolic Architecture**.

## The Challenge

- **Fast**: Valid actions must be submitted every 1-second tick. LLMs are often too slow (1-3s latency) to control every single tick directly.
- **Cheap**: Calling an LLM 3600 times (once per second for an hour) is expensive and wasteful.
- **Smart**: You need high-level strategy (economy vs army), not just random movement.

## The Solution: Two-Layer Brain

Split your agent into two parts:

### 1. The Cortex (Smart & Periodic)

- **Role**: CEO / General.
- **Technology**: Large Language Model (LLM).
- **Model**: **Gemini 1.5 Flash** or **GPT-4o-mini** (Both are extremely cheap and fast).
- **Frequency**: Runs every 30-60 seconds OR when major events happen (e.g., "Under Attack").
- **Input**: High-level summary of game state (Resources, Map heatmap, Game Phase).
- **Output**: Set a **High-Level Goal** (e.g., `GOAL: EXPAND_ECONOMY`, `GOAL: PREPARE_DEFENSE`).

### 2. The Reflex (Fast & Real-time)

- **Role**: Soldier / Worker.
- **Technology**: Code-based State Machine (TypeScript/Python).
- **Frequency**: Runs every 1 second (Game Tick).
- **Input**: Immediate surroundings, current simple goal.
- **Output**: Specific API commands (`MOVE N`, `GATHER`, `ATTACK`).
- **Logic**:
  - If `GOAL == EXPAND_ECONOMY`: Find nearest resource -> Move -> Gather.
  - If `GOAL == PREPARE_DEFENSE`: Find nearest enemy -> Move -> Attack.

---

## Recommended Tech Stack

Since the game engine is in **TypeScript** (`packages/world`), using TypeScript for your agent allows you to share type definitions (`Command`, `GameState`) directly.

| Component         | Recommendation                      | Why?                                                       |
| :---------------- | :---------------------------------- | :--------------------------------------------------------- |
| **Language**      | **TypeScript** (Node.js)            | Typesharing with game, fast execution.                     |
| **LLM Provider**  | **Google Gemini API**               | 1.5 Flash is arguably the best price/performance for this. |
| **Orchestration** | **LangChain.js**                    | Easy integration with LLMs in TS.                          |
| **State Machine** | **XState** (or `switch` statements) | Handle the 1s tick logic deterministicly.                  |

## Implementation Sketch

### Step 1: Define the Brain (LLM)

Create a prompt ensuring the LLM acts as a strategist.

```typescript
// strategist.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash",
  maxOutputTokens: 2048,
});

export async function getStrategy(gameState: any) {
  const response = await model.invoke([
    [
      "system",
      "You are a Wuxia Warlord. Analyze the state and set a tactical goal.",
    ],
    ["human", JSON.stringify(summaryOf(gameState))],
  ]);
  return response.content; // e.g., "BUILD_ARMY"
}
```

### Step 2: Define the Reflex (Loop)

The main loop that runs every second.

```typescript
// agent.ts
import { getStrategy } from "./strategist";

let currentGoal = "GATHER_RESOURCES";
let lastStrategyUpdate = 0;

socket.on("TICK", async (tickData) => {
  // 1. Check if we need new strategy (every 30 ticks)
  if (tickData.tick - lastStrategyUpdate > 30) {
    // Run in background, don't block the tick!
    getStrategy(tickData).then((goal) => (currentGoal = goal));
    lastStrategyUpdate = tickData.tick;
  }

  // 2. Execute fast reflex based on current Goal
  const actions = executeReflex(currentGoal, tickData);

  // 3. Submit actions
  api.submitActions(actions);
});

function executeReflex(goal, data) {
  if (goal === "GATHER_RESOURCES") {
    // Simple logic: Find closest resource, move to it
    return findPathToResource(data);
  }
  // ...
}
```

## Deployment

- **Platform**: **Railway** (since the project uses it) or **Hetzner** (cheaper for raw compute).
- **Cost**:
  - Hosting: ~$5/month.
  - LLM API: ~$1-2/month (Gemini Flash is free tier eligible or very cheap).
