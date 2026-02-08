# Agent Architecture Trade-offs

This document compares the different agent approaches we've discussed for **One Hour Dynasty**.

| Feature             | **1. Hybrid Neuro-Symbolic** (Recommended) | **2. Moltbot / OpenClaw** (Ops Manager) | **3. Pure LLM Agent** (Not Recommended) |
| :------------------ | :----------------------------------------- | :-------------------------------------- | :-------------------------------------- |
| **Core Tech**       | TypeScript Loop + remote LLM (Gemini)      | Python / Local LLM / LangChain          | Python / AutoGen / CrewAI               |
| **Speed (Latency)** | **< 50ms** (Instant Reflex)                | **5s - 60s** (Human Speed)              | **2s - 10s** (LLM Speed)                |
| **Cost**            | **$ (~$5/mo)**                             | **$$ (~$20/mo)**                        | **$$$ (~$50+/mo)**                      |
| **Hosting**         | Light VPS (1 vCPU)                         | Medium VPS (2-4 vCPU)                   | Heavy GPU or API usage                  |
| **Intelligence**    | High Strategy, Low Tactics                 | General Purpose Assistant               | High Creative, Low Precision            |
| **Best For**        | **Winning the Game** (High Frequency)      | Managing Servers / Alerts               | Writing Essays / Chatting               |

---

## Deep Dive

### 1. Hybrid Neuro-Symbolic Agent (The "Pro" Choice)

- **How it works**: A fast code loop handles movement/combat every second. An LLM runs every 30 seconds to set the "Goal" (e.g., "Attack North").
- **Pros**:
  - **Guaranteed 1s Reaction Time**: You will never miss a game tick.
  - **Cheapest**: You only call the LLM 120 times an hour, not 3600 times.
  - **Reliable**: Code doesn't hallucinate invalid moves like "Move Up" when it should be "North".
- **Cons**:
  - **More Coding**: You have to write the TypeScript loop logic yourself.
  - **Rigid**: It can only do what you programmed in the reflex loop.

### 2. Moltbot / OpenClaw (The "Manager")

- **How it works**: A chatbot that connects to tools (SSH, APIs, Telegram).
- **Pros**:
  - **Easy Control**: "Restart server", "Check balance". Great for **Ops**.
  - **Extensible**: Easy to add new "Skills" (like the Monad skill we wrote).
- **Cons**:
  - **Too Slow for Gameplay**: By the time it reads the map, thinks, and sends a move, 10 game ticks have passed. You are dead.
  - **Heavy Resource Usage**: Needs more RAM/CPU to run the agent framework.

### 3. Pure LLM Agent (The "Lazy" Choice)

- **How it works**: You feed the _entire_ game state to GPT-4/Claude every second and ask "What do I do?".
- **Pros**:
  - **Creative**: Might come up with weird strategies.
  - **Easy to Start**: Just write a prompt.
- **Cons**:
  - **Extremely Expensive**: 3,600 API calls per hour per game.
  - **Slow**: API latency (1-3s) means you will be lagging behind the game server.
  - **Unreliable**: LLMs often output invalid JSON or hallucinate actions.

## Final Verdict

| Role                 | Winner           | Why?                                                |
| :------------------- | :--------------- | :-------------------------------------------------- |
| **Playing the Game** | **Hybrid Agent** | The only one fast enough to win.                    |
| **Monitoring / Ops** | **OpenClaw**     | Great for "Human-in-the-loop" management.           |
| **Research / Ideas** | **Pure LLM**     | Good for asking "What is a good strategy?" offline. |

**Strategy**: Build the **Hybrid Agent** to play, and host **OpenClaw** on the same (or separate) server to watch it and report back to you.
