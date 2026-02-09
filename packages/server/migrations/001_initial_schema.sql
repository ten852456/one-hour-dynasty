-- One Hour Dynasty - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all tables for the game backend

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AGENTS TABLE
-- Stores agent registration and identity information
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(42) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  erc8004_token_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for agents
CREATE INDEX idx_agents_wallet ON agents(wallet);
CREATE INDEX idx_agents_erc8004_token_id ON agents(erc8004_token_id) WHERE erc8004_token_id IS NOT NULL;
CREATE INDEX idx_agents_created_at ON agents(created_at);

-- ============================================================================
-- GAMES TABLE
-- Stores game instance information
-- ============================================================================
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting', 'running', 'completed', 'aborted')),
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('arena', 'training')),
  entry_fee BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  tick INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for games
CREATE INDEX idx_games_state ON games(state);
CREATE INDEX idx_games_tier ON games(tier);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_games_started_at ON games(started_at) WHERE started_at IS NOT NULL;

-- ============================================================================
-- GAME_AGENTS TABLE
-- Junction table linking agents to games with role and performance data
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('emperor', 'minister', 'general', 'spy', 'merchant', 'assassin', 'monk', 'rebel')),
  final_rank INTEGER,
  final_score BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, agent_id)
);

-- Indexes for game_agents
CREATE INDEX idx_game_agents_game_id ON game_agents(game_id);
CREATE INDEX idx_game_agents_agent_id ON game_agents(agent_id);
CREATE INDEX idx_game_agents_final_rank ON game_agents(final_rank) WHERE final_rank IS NOT NULL;

-- ============================================================================
-- GAME_ACTIONS TABLE
-- Stores all actions submitted by agents during games
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  action_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for game_actions
CREATE INDEX idx_game_actions_game_id ON game_actions(game_id);
CREATE INDEX idx_game_actions_agent_id ON game_actions(agent_id);
CREATE INDEX idx_game_actions_tick ON game_actions(tick);
CREATE INDEX idx_game_actions_game_tick ON game_actions(game_id, tick);
CREATE INDEX idx_game_actions_agent_tick ON game_actions(agent_id, tick);

-- ============================================================================
-- GAME_RESULTS TABLE
-- Denormalized table for efficient querying of game results
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  agent_wallet VARCHAR(42) NOT NULL,
  agent_token_id BIGINT,
  final_rank INTEGER NOT NULL,
  final_score BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for game_results
CREATE INDEX idx_game_results_game_id ON game_results(game_id);
CREATE INDEX idx_game_results_agent_wallet ON game_results(agent_wallet);
CREATE INDEX idx_game_results_agent_token_id ON game_results(agent_token_id) WHERE agent_token_id IS NOT NULL;
CREATE INDEX idx_game_results_final_rank ON game_results(final_rank);
CREATE INDEX idx_game_results_created_at ON game_results(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at timestamp on row modification
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_agents_updated_at
  BEFORE UPDATE ON game_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE agents IS 'Stores agent registration and identity information';
COMMENT ON TABLE games IS 'Stores game instance information';
COMMENT ON TABLE game_agents IS 'Junction table linking agents to games with role and performance data';
COMMENT ON TABLE game_actions IS 'Stores all actions submitted by agents during games';
COMMENT ON TABLE game_results IS 'Denormalized table for efficient querying of game results';

COMMENT ON COLUMN agents.erc8004_token_id IS 'Optional ERC-8004 token ID for on-chain identity';
COMMENT ON COLUMN games.tier IS 'Game tier: arena (paid) or training (free)';
COMMENT ON COLUMN games.entry_fee IS 'Entry fee in MON tokens';
COMMENT ON COLUMN game_agents.role IS 'Role assigned to the agent in this game';
COMMENT ON COLUMN game_actions.action_data IS 'JSONB data containing action details';
COMMENT ON COLUMN game_results.agent_token_id IS 'ERC-8004 token ID if agent has on-chain identity';
