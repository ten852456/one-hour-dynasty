-- Migration: 002_update_games_schema.sql
-- Description: Update games table to match One Hour Dynasty game requirements
-- Date: 2025-02-08

-- ============================================================================
-- PHASE 1: Add new columns for proper game structure
-- ============================================================================

-- Add phase column (game lifecycle state)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS phase VARCHAR(20)
    CHECK (phase IN ('recruiting', 'playing', 'completed', 'aborted'));

-- Add game_type column (training vs arena)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS game_type VARCHAR(20)
    CHECK (game_type IN ('training', 'arena'));

-- Add arena_tier column (bronze, silver, gold - only for arena games)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS arena_tier VARCHAR(10)
    CHECK (arena_tier IN ('bronze', 'silver', 'gold'));

-- Add arena configuration
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS arena_id INTEGER;

-- Add agent configuration
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS max_agents INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS min_agents_to_start INTEGER DEFAULT 2;

-- Add fee configuration (in MON tokens)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS entry_fee_mon BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_pool_mon BIGINT DEFAULT 0;

-- Add tick tracking (rename from tick if exists, else add new)
-- We'll keep both for migration compatibility
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS current_tick INTEGER DEFAULT 0;

-- ============================================================================
-- PHASE 2: Migrate existing data
-- ============================================================================

-- Migrate state → phase
UPDATE games
SET phase = CASE
  WHEN state = 'waiting' THEN 'recruiting'
  WHEN state = 'running' THEN 'playing'
  WHEN state = 'completed' THEN 'completed'
  WHEN state = 'aborted' THEN 'aborted'
  ELSE 'recruiting'
END
WHERE phase IS NULL;

-- Migrate tier → game_type
UPDATE games
SET game_type = tier
WHERE game_type IS NULL;

-- Set default arena_tier for arena games
UPDATE games
SET arena_tier = 'bronze'
WHERE game_type = 'arena' AND arena_tier IS NULL;

-- Migrate entry_fee → entry_fee_mon
UPDATE games
SET entry_fee_mon = entry_fee
WHERE entry_fee_mon = 0 AND entry_fee IS NOT NULL;

-- Initialize current_tick from tick
UPDATE games
SET current_tick = tick
WHERE current_tick = 0 AND tick IS NOT NULL;

-- Set default max_agents based on game_type
UPDATE games
SET max_agents = CASE
  WHEN game_type = 'training' THEN 10
  WHEN game_type = 'arena' THEN 20
  ELSE 10
END
WHERE max_agents = 10 OR max_agents IS NULL;

-- ============================================================================
-- PHASE 3: Create indexes for performance
-- ============================================================================

-- Index for phase lookups (recruiting games)
CREATE INDEX IF NOT EXISTS idx_games_phase ON games(phase);

-- Index for game_type and arena_tier combination
CREATE INDEX IF NOT EXISTS idx_games_type_tier ON games(game_type, arena_tier);

-- Index for recruiting games by tier
CREATE INDEX IF NOT EXISTS idx_games_recruiting_tier ON games(phase, arena_tier)
  WHERE phase = 'recruiting';

-- Index for active games
CREATE INDEX IF NOT EXISTS idx_games_active ON games(phase, started_at)
  WHERE phase = 'playing';

-- ============================================================================
-- PHASE 4: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN games.phase IS 'Game lifecycle: recruiting → playing → completed/aborted';
COMMENT ON COLUMN games.game_type IS 'Game type: training (15min, free) or arena (1hr, paid)';
COMMENT ON COLUMN games.arena_tier IS 'Arena tier: bronze (10 MON), silver (50 MON), gold (100 MON)';
COMMENT ON COLUMN games.arena_id IS 'Arena identifier (1=basic, 2=standard, etc.)';
COMMENT ON COLUMN games.max_agents IS 'Maximum agents allowed in game';
COMMENT ON COLUMN games.min_agents_to_start IS 'Minimum agents before auto-start';
COMMENT ON COLUMN games.entry_fee_mon IS 'Entry fee in MON tokens';
COMMENT ON COLUMN games.prize_pool_mon IS 'Total prize pool (entry × agents × 0.9)';
COMMENT ON COLUMN games.current_tick IS 'Current game tick (0-3600 for 1 hour games)';

-- ============================================================================
-- PHASE 5: Set NOT NULL constraints after migration
-- ============================================================================

-- Once data is migrated, make phase and game_type required
-- (Commented out for safety - uncomment after verifying migration)
-- ALTER TABLE games ALTER COLUMN phase SET NOT NULL;
-- ALTER TABLE games ALTER COLUMN game_type SET NOT NULL;
-- ALTER TABLE games ALTER COLUMN max_agents SET NOT NULL;
-- ALTER TABLE games ALTER COLUMN min_agents_to_start SET NOT NULL;

-- ============================================================================
-- Verification query
-- ============================================================================

-- Run this to verify migration success:
-- SELECT id, phase, game_type, arena_tier, max_agents, entry_fee_mon, current_tick
-- FROM games
-- ORDER BY created_at DESC
-- LIMIT 10;
