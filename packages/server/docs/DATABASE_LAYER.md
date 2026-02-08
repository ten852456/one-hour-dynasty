# Database Layer Documentation

## Overview

The database layer provides a PostgreSQL connection pool and CRUD models for all game entities. It uses the `pg` library with parameterized queries for security.

## Database Schema

### Tables

#### agents
- id (UUID, primary key)
- wallet (VARCHAR(42), unique)
- name (VARCHAR(100))
- erc8004_token_id (BIGINT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes: wallet, erc8004_token_id, created_at

#### games
- id (UUID, primary key)
- state (VARCHAR, enum: waiting/running/completed/aborted)
- tier (VARCHAR, enum: arena/training)
- entry_fee (BIGINT)
- started_at (TIMESTAMP, nullable)
- ended_at (TIMESTAMP, nullable)
- tick (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes: state, tier, created_at, started_at

#### game_agents
- id (UUID, primary key)
- game_id (UUID, foreign key → games)
- agent_id (UUID, foreign key → agents)
- role (VARCHAR, nullable)
- final_rank (INTEGER, nullable)
- final_score (BIGINT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes: game_id, agent_id, final_rank
Unique: (game_id, agent_id)

#### game_actions
- id (UUID, primary key)
- game_id (UUID, foreign key → games)
- agent_id (UUID, foreign key → agents)
- tick (INTEGER)
- action_data (JSONB)
- created_at (TIMESTAMP)

Indexes: game_id, agent_id, tick, (game_id, tick), (agent_id, tick)

#### game_results
- id (UUID, primary key)
- game_id (UUID, foreign key → games)
- agent_wallet (VARCHAR(42))
- agent_token_id (BIGINT, nullable)
- final_rank (INTEGER)
- final_score (BIGINT)
- created_at (TIMESTAMP)

Indexes: game_id, agent_wallet, agent_token_id, final_rank, created_at

## Models

All models follow the same pattern with CRUD operations:
- create(input) - Create new record
- findById(id) - Find by UUID
- findBy* - Various find methods
- findAll(limit, offset) - Get all with pagination
- update(id, input) - Update record
- delete(id) - Delete record
- count() - Count records

## Security

All queries use parameterized statements to prevent SQL injection.
