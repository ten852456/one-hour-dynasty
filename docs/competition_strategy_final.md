# The Winning Strategy: One Hour Dynasty Competition

To win the $10,000 bounty for "One Hour Dynasty", you need an agent that is **Smart**, **Fast**, and **Reliable**.

Based on our analysis, this is the **Definitive Tech Stack** for the competition.

---

## 1. The Architecture: "The Hybrid Warlord"

**Why?** The game runs on **1-second ticks**. Pure LLMs are too slow. Pure scripts are too dumb.
**The Solution:** Combine them.

1.  **The Reflex (Fast Loop)**
    - **Tech**: **TypeScript** (Node.js).
    - **Role**: Handles movement, combat calculations, and resource gathering.
    - **Speed**: Executed every 100ms.
    - **Logic**: "If enemy is in range, attack. If resource is close, gather."

2.  **The Strategist (Smart Brain)**
    - **Tech**: **Gemini 1.5 Flash** (via API) or **GPT-4o-mini**.
    - **Role**: Analyzes the map every 30-60 seconds to set the "Grand Strategy".
    - **Input**: "We have 500 Gold, 20 Troops. Enemy is to the North."
    - **Output**: `CURRENT_GOAL = "BUILD_DEFENSE_WALL"`

---

## 2. The Infrastructure: "The Fortress"

**Why?** You cannot afford downtime. A 1-minute internet outage on your laptop = 60 missed turns = Defeat.
**The Solution:** A cheap, high-performance Cloud VPS.

- **Provider**: **Hetzner Cloud** (Model CX22) or **DigitalOcean** (Basic Droplet).
  - **Region**: Pick the one closest to the Game Server (Check with organizers).
- **OS**: Ubuntu 24.04 LTS.
- **Containerization**: **Docker Compose**.
  - `agent` (Your code)
  - `redis` (Fast memory for state)
- **Cost**: ~$5 - $10 USD / Month.

---

## 3. The Management: "The Ops Center"

**Why?** You need to see what's happening without SSH-ing into the server every minute.
**The Solution:** **OpenClaw** (Moltbot).

- **Role**: Your personal "Jarvis".
- **Deployment**: Run it on the _same VPS_ as your agent (if it fits) or a separate small instance.
- **Capabilities**:
  - "Check Status" -> Pings your agent.
  - "Emergency Stop" -> Stops the Docker container.
  - "Monad Balance" -> Checks your wallet on-chain.

---

## 4. Execution Plan (Step-by-Step)

1.  **Develop Locally**: Write the TypeScript `Reflex` loop and verify it works with the game's mock server.
2.  **Add the Brain**: Integrate the Gemini API to change the `Reflex` state based on high-level analysis.
3.  **Dockerize**: Wrap it all in a `Dockerfile`.
4.  **Rent VPS**: Buy a $5 Hetzner/DigitalOcean server.
5.  **Deploy**: Use `docker compose up -d` on the VPS.
6.  **Monitor**: Connect OpenClaw to Telegram to get alerts if your agent crashes.

**This stack gives you the speed of a bot, the intelligence of an LLM, and the reliability of the cloud.**
