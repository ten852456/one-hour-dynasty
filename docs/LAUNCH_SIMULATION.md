# $WUXIA Launch Simulation

> Scenario Analysis: Week 1-4 After Launch

---

## 📊 Assumptions

| Parameter              | Value              |
| ---------------------- | ------------------ |
| Total Supply           | 100,000,000 $WUXIA |
| Launch Price (nad.fun) | ~$0.0001           |
| Initial Market Cap     | ~$10,000           |
| Daily Active Agents    | 50 → 200 (growth)  |
| Games per Day          | 20 → 100           |

---

## 📅 Week 1: Launch Phase

### Day 1: Token Launch on nad.fun

```
┌─────────────────────────────────────────────────────────────────┐
│  nad.fun Launch                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Initial Liquidity: 20M WUXIA (20%)                             │
│  Bonding Curve: Price increases with buys                       │
│                                                                  │
│  Hour 1:  Price $0.0001  │  MC: $10K                            │
│  Hour 6:  Price $0.0005  │  MC: $50K   (early buyers)           │
│  Hour 24: Price $0.001   │  MC: $100K  (awareness)              │
└─────────────────────────────────────────────────────────────────┘
```

### Day 1-3: Early Adopters

| Actor       | Action                | WUXIA Flow |
| ----------- | --------------------- | ---------- |
| Speculators | Buy on nad.fun        | +Demand    |
| Agent Devs  | Buy to test utilities | +Demand    |
| Team        | Don't sell (vesting)  | Hold       |

**Token Distribution:**

```
Circulating: 20M (liquidity)
Locked: 80M (team, ecosystem, prizes)
```

### Day 3-7: First Utilities Used

| Utility           | Users     | WUXIA Spent | Burn?    |
| ----------------- | --------- | ----------- | -------- |
| Speed Start Boost | 10 agents | 100 WUXIA   | 🔥 Yes   |
| Bronze Pass       | 5 agents  | 500 WUXIA   | Treasury |
| Custom Avatar     | 3 agents  | 150 WUXIA   | 🔥 Yes   |

**Week 1 Summary:**

```
Price: $0.001 → $0.002 (2x)
Market Cap: $100K → $200K
Burned: 250 WUXIA
Treasury: 500 WUXIA
Games Played: 50
```

---

## 📅 Week 2: Growth Phase

### Scenario A: Organic Growth ✅

```
Daily Users: 50 → 100
Games per Day: 20 → 50

New Utility Usage:
├── Pre-game Boosts: 50 purchases/day = 500 WUXIA burned/day
├── Subscriptions: 20 new subs = 2000 WUXIA to treasury/week
└── Tournaments: 1 weekly cup = 5000 WUXIA entry (redistributed)
```

**Price Movement:**

```
Week 2 Start: $0.002
Week 2 End:   $0.005
Reason: Utility usage + burn = supply reduction
```

### Scenario B: Viral Moment 🚀

```
Twitter post goes viral
1000 new agent developers sign up

Buying pressure:
├── 500 people buy $50 avg = $25K buy volume
├── Price spikes to $0.02
└── Market Cap: $2M
```

### Scenario C: Dump Risk ⚠️

```
Early buyers take profit
├── Sell pressure at $0.005
├── Price drops to $0.003
└── Recovery depends on utility usage
```

---

## 📅 Week 3-4: Stabilization

### Token Velocity Model

```
Inflows (Buy Pressure):
├── New agent devs buying for utilities
├── Prize winners holding (not selling immediately)
├── Stakers locking for priority queue
└── Speculators betting on growth

Outflows (Sell Pressure):
├── Prize winners cashing out
├── Early investors taking profit
└── Unlocked team tokens (if any)

Net: Depends on game adoption rate
```

### Simulation: 100 Games/Day

```
Per Game:
├── Entry: 10 MON (goes to prize pool, NOT WUXIA)
├── Boost purchases: ~20 WUXIA avg (burned)
├── Winner: Gets MON prize

Daily:
├── 100 games × 20 WUXIA = 2000 burned
├── Monthly burn: 60,000 WUXIA
├── Annual burn: 720,000 WUXIA (0.72% of supply)
```

### Simulation: 1000 Games/Day (Success)

```
Daily burn: 20,000 WUXIA
Monthly burn: 600,000 WUXIA
Annual burn: 7,200,000 WUXIA (7.2% of supply)

At this rate:
├── Year 1: 92.8M supply remaining
├── Year 2: 85.6M supply remaining
├── Year 5: 64M supply remaining
```

---

## 💰 Revenue Simulation

### Treasury Income (Subscriptions + Analytics)

| Source      | Price     | Users/Month | Revenue             |
| ----------- | --------- | ----------- | ------------------- |
| Bronze Pass | 100 WUXIA | 100         | 10,000 WUXIA        |
| Silver Pass | 300 WUXIA | 30          | 9,000 WUXIA         |
| Gold Pass   | 500 WUXIA | 10          | 5,000 WUXIA         |
| Analytics   | 50 WUXIA  | 50          | 2,500 WUXIA         |
| **Total**   |           |             | **26,500 WUXIA/mo** |

At $0.01/WUXIA = **$265/month** revenue
At $0.10/WUXIA = **$2,650/month** revenue

---

## 🏆 Hackathon Target: Market Cap

### Goal: Win $40K AUSD Liquidity Boost

Need: **Highest market cap on nad.fun**

```
Strategy Timeline:
├── Day 1-3: Launch, seed liquidity
├── Day 4-7: Marketing push, demo game
├── Day 8-14: Utility usage, burn announcements
└── Hackathon End: Peak market cap moment
```

### Market Cap Scenarios

| Scenario     | Price | Market Cap | Likelihood |
| ------------ | ----- | ---------- | ---------- |
| Conservative | $0.01 | $1M        | High       |
| Moderate     | $0.05 | $5M        | Medium     |
| Viral        | $0.10 | $10M       | Low        |
| Moon         | $0.50 | $50M       | Very Low   |

---

## ⚠️ Risk Analysis

### Risk 1: No Game Adoption

```
Problem: Token launched but no one plays
Result: No utility usage, price dumps
Mitigation: Demo game must work before launch
```

### Risk 2: Too Much Burn

```
Problem: If burn rate too high, no tokens left for prizes
Result: Prize pool depleted
Mitigation: Balance burn vs treasury allocation
```

### Risk 3: Early Dump

```
Problem: Speculators dump after quick pump
Result: Price crashes, sentiment negative
Mitigation: Lock team tokens, gradual unlock
```

### Risk 4: No Liquidity

```
Problem: nad.fun bonding curve runs out
Result: Can't sell, stuck tokens
Mitigation: Add external DEX liquidity post-launch
```

---

## ✅ Recommended Launch Strategy

### Phase 1: Pre-Launch (Before nad.fun)

```
1. ✅ Game demo working
2. ✅ Smart contracts deployed to testnet
3. ✅ Agent.md ready for developers
4. ✅ Discord community started
```

### Phase 2: Launch Day

```
1. Deploy token on nad.fun
2. Announce on Twitter with demo video
3. First 10 games running
4. Early adopter boost discount
```

### Phase 3: Week 1-2

```
1. Daily game stats posted
2. First tournament announced
3. Burn counter on website
4. Partner with AI Twitter accounts
```

### Phase 4: Hackathon End

```
1. Final push for market cap
2. Show total games played
3. Show total tokens burned
4. Win $40K liquidity boost!
```

---

## 📈 Success Metrics

| Metric        | Target           |
| ------------- | ---------------- |
| Market Cap    | Top 3 on nad.fun |
| Games Played  | 500+             |
| Active Agents | 100+             |
| Tokens Burned | 50,000+          |
| Subscribers   | 50+              |
