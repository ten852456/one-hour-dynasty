# Tokenomics Design Skill - Baseline Test Scenarios

## Purpose
These scenarios test what AI agents do WRONG when designing tokenomics without proper guidance.

## Test Methodology
For each scenario:
1. Present to AI agent WITHOUT the skill
2. Document their response verbatim
3. Identify rationalizations for poor decisions
4. Look for the 3 baseline failures: (1) worthless token, (2) no utility, (3) excessive inflation

---

## Scenario 1: DeFi Protocol Token Design

**Prompt:**
> "I'm launching a new DeFi lending protocol on Monad. Design the tokenomics for our native token. We want to attract users and raise funding. What should we consider?"

**Expected WRONG behaviors (baseline failures):**
- Focus on token price targets ("$1 by end of year")
- Ignore actual utility - what DOES the token do?
- No clear use cases beyond speculation
- Don't specify if/how tokens burn
- Don't address user value proposition
- Skip staking mechanism details
- Missing: revenue share, governance rights, protocol fees

**Red Flags to Watch:**
- Talks about price before utility
- No mention of token sinks (burn/use)
- Distribution percentages without justification
- No vesting schedules mentioned
- Assumes "community will buy it"

---

## Scenario 2: High APY Staking (Inflation Trap)

**Prompt:**
> "Design a staking rewards system for our governance token. We need high APY to attract users (500%+). How do we structure this?"

**Expected WRONG behaviors:**
- Sets unsustainable APY (500%, 1000%, etc.)
- Doesn't calculate inflation rate from rewards
- Doesn't model token price dilution
- Ignores sell pressure when rewards unlock
- No cap on reward emissions
- Doesn't consider sustainability beyond 6-12 months
- Missing: emission schedules, reward halving, vesting on rewards

**Red Flags to Watch:**
- "High APY attracts users" without addressing dilution
- No calculation of tokens emitted per year
- Doesn't answer: "What happens to price when rewards unlock?"
- No mention of emission caps or decay

---

## Scenario 3: Team/Advisor Distribution (Dump Risk)

**Prompt:**
> "We have a team of 5, 3 advisors, and need to raise $2M. Design the token allocation breakdown for everyone."

**Expected WRONG behaviors:**
- Gives team too much (30-40%+)
- No vesting for team/advisors
- Advisors get liquid tokens at TGE
- Team can dump immediately
- Doesn't calculate unlock impact on price
- No cliff period (team gets tokens day 1)
- Missing: lock schedules, unlock cliffs, price impact analysis

**Red Flags to Watch:**
- "Team deserves 40%" without market comparison
- No vesting schedules mentioned
- Advisors "get tokens at launch" (liquidity risk)
- Doesn't ask: "What if team dumps at 3x?"

---

## Scenario 4: Long-term Sustainability (Project Collapse)

**Prompt:**
> "Will this token model still be valuable in 3 years? Show your work."

**Expected WRONG behaviors:**
- Can't quantify sustainability
- No simulation/model of token flows
- Doesn't calculate sell pressure from unlocks
- Missing revenue/buy pressure analysis
- Doesn't address: "What if bear market lasts 2 years?"
- No protocol revenue model to support token value
- Hand-wavy: "community will drive value"

**Red Flags to Watch:**
- "Yes, because utility" without numbers
- Doesn't know token supply at year 1, 2, 3
- Can't calculate inflation rate
- No mention of protocol revenue backing token value
- Doesn't model worst-case scenarios

---

## Scenario 5: Token Utility Definition

**Prompt:**
> "List all the ways users will actually USE this token in the protocol. Not 'hold to sell later' - actual utility."

**Expected WRONG behaviors:**
- Lists vague utilities ("governance", "staking")
- No concrete user actions requiring token
- Doesn't specify token sinks (burn/use events)
- Missing: fee discounts, voting power, collateral requirements
- No examples: "User pays 100 tokens to do X"
- Doesn't differentiate between utility and speculation

**Red Flags to Watch:**
- "Staking" listed as utility (it's not - it's just holding)
- "Governance" with no actual proposal types
- Can't describe user journey with token
- No burning mechanisms mentioned
- Utilities don't create demand (just give tokens away)

---

## Scenario 6: Multi-Pressure Test (Time + Complexity)

**Prompt:**
> "We need tokenomics designed by tomorrow for investor meetings. Quick summary: gameFi project, P2E rewards, NFT integration, need $3M raise. Go."

**Expected WRONG behaviors (under pressure):**
- Skips critical analysis ("no time for simulations")
- Copies standard P2E model without adaptation
- Doesn't flag obvious problems (P2E = inflation death spiral)
- Makes assumptions to save time
- Doesn't ask clarifying questions
- Template answer instead of custom design

**Red Flags to Watch:**
- "Standard model is..." without adaptation
- Doesn't identify P2E inflation trap
- No time to calculate (but makes up numbers anyway)
- Rushed answer missing key components

---

## Scoring Key: Agent Compliance

For each scenario, document:
1. **What they got right** (if anything)
2. **What they missed** (critical gaps)
3. **Rationalizations used** ("standard practice", "too complex", "users will understand")
4. **Which baseline failure** triggered (worthless token, no utility, excessive inflation)

**PASS Criteria (with skill):**
- Defines concrete utility use cases
- Calculates and justifies inflation rates
- Models long-term sustainability (2-3+ years)
- Specifies vesting/cliff schedules
- Addresses sell pressure from unlocks
- Quantifies token flows (not just percentages)

**FAIL Criteria (without skill):**
- Vague utilities without concrete use cases
- Unsustainable APY/inflation
- No long-term viability analysis
- Missing vesting or lock schedules
- Can't quantify token supply over time
- Assumes price appreciation without fundamentals
