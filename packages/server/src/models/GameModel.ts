/**
 * Game Model - CRUD operations for games table
 * Updated to match One Hour Dynasty game requirements
 */

import { query } from './database.js';

/**
 * Game interface matching updated database schema
 */
export interface Game {
  id: string;
  phase: 'recruiting' | 'playing' | 'completed' | 'aborted';
  game_type: 'training' | 'arena';
  arena_tier: 'bronze' | 'silver' | 'gold' | null;
  arena_id: number;
  max_agents: number;
  min_agents_to_start: number;
  entry_fee_mon: number;
  prize_pool_mon: number;
  current_tick: number;
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Legacy fields for backward compatibility
  state?: 'waiting' | 'running' | 'completed' | 'aborted';
  tier?: 'arena' | 'training';
  entry_fee?: number;
  tick?: number;
}

/**
 * Input for creating a new game
 */
export interface CreateGameInput {
  phase?: 'recruiting' | 'playing' | 'completed' | 'aborted';
  game_type: 'training' | 'arena';
  arena_tier?: 'bronze' | 'silver' | 'gold';
  arena_id?: number;
  max_agents?: number;
  min_agents_to_start?: number;
  entry_fee_mon?: number;
  prize_pool_mon?: number;
  current_tick?: number;
}

/**
 * Input for updating a game
 */
export interface UpdateGameInput {
  phase?: 'recruiting' | 'playing' | 'completed' | 'aborted';
  arena_tier?: 'bronze' | 'silver' | 'gold';
  current_tick?: number;
  started_at?: Date | null;
  ended_at?: Date | null;
  prize_pool_mon?: number;
}

/**
 * Game statistics
 */
export interface GameStats {
  id: string;
  phase: string;
  game_type: string;
  arena_tier: string | null;
  current_tick: number;
  max_agents: number;
  agent_count: number;
}

/**
 * Game Model Class
 */
export class GameModel {
  /**
   * Create a new game
   */
  static async create(input: CreateGameInput): Promise<Game> {
    const defaults = {
      phase: 'recruiting',
      arena_id: 1,
      max_agents: input.game_type === 'training' ? 10 : 20,
      min_agents_to_start: 2,
      entry_fee_mon: 0,
      prize_pool_mon: 0,
      current_tick: 0
    };

    const merged = { ...defaults, ...input };

    const text = `
      INSERT INTO games (
        phase, game_type, arena_tier, arena_id,
        max_agents, min_agents_to_start, entry_fee_mon, prize_pool_mon,
        current_tick
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      merged.phase,
      merged.game_type,
      merged.arena_tier || null,
      merged.arena_id,
      merged.max_agents,
      merged.min_agents_to_start,
      merged.entry_fee_mon,
      merged.prize_pool_mon,
      merged.current_tick
    ];

    const result = await query(text, params);

    if (result.rows.length === 0) {
      throw new Error('Failed to create game');
    }

    return result.rows[0];
  }

  /**
   * Find game by ID
   */
  static async findById(id: string): Promise<Game | null> {
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find games by phase
   */
  static async findByPhase(
    phase: 'recruiting' | 'playing' | 'completed' | 'aborted',
    limit = 100,
    offset = 0
  ): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      WHERE phase = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(text, [phase, limit, offset]);
    return result.rows;
  }

  /**
   * Find recruiting games by arena tier
   */
  static async findRecruitingByTier(
    arenaTier: 'bronze' | 'silver' | 'gold',
    limit = 10
  ): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      WHERE phase = 'recruiting'
        AND game_type = 'arena'
        AND arena_tier = $1
      ORDER BY created_at ASC
      LIMIT $2
    `;
    const result = await query(text, [arenaTier, limit]);
    return result.rows;
  }

  /**
   * Find available games (recruiting phase)
   */
  static async findAvailable(limit = 50): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      WHERE phase = 'recruiting'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await query(text, [limit]);
    return result.rows;
  }

  /**
   * Find available games with agent counts (optimized to avoid N+1 query)
   * Returns games with current_agents field included
   */
  static async findAvailableWithCounts(limit = 50): Promise<any[]> {
    const text = `
      SELECT
        g.*,
        COUNT(ga.agent_id) as current_agents
      FROM games g
      LEFT JOIN game_agents ga ON g.id = ga.game_id
      WHERE g.phase = 'recruiting'
      GROUP BY g.id
      ORDER BY g.created_at ASC
      LIMIT $1
    `;
    const result = await query(text, [limit]);
    return result.rows;
  }

  /**
   * Find games by type and tier
   */
  static async findByTypeAndTier(
    gameType: 'training' | 'arena',
    arenaTier?: 'bronze' | 'silver' | 'gold',
    limit = 100
  ): Promise<Game[]> {
    let text = `
      SELECT * FROM games
      WHERE game_type = $1
    `;

    const params: any[] = [gameType];

    if (arenaTier) {
      text += ` AND arena_tier = $2`;
      params.push(arenaTier);
    }

    text += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(text, params);
    return result.rows;
  }

  /**
   * Find active (playing) games
   */
  static async findActive(limit = 50): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      WHERE phase = 'playing'
      ORDER BY started_at ASC
      LIMIT $1
    `;
    const result = await query(text, [limit]);
    return result.rows;
  }

  /**
   * Find all games
   */
  static async findAll(limit = 100, offset = 0): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(text, [limit, offset]);
    return result.rows;
  }

  /**
   * Update game
   */
  static async update(id: string, input: UpdateGameInput): Promise<Game> {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (input.phase !== undefined) {
      updates.push(`phase = $${idx++}`);
      params.push(input.phase);
    }

    if (input.arena_tier !== undefined) {
      updates.push(`arena_tier = $${idx++}`);
      params.push(input.arena_tier);
    }

    if (input.current_tick !== undefined) {
      updates.push(`current_tick = $${idx++}`);
      params.push(input.current_tick);
    }

    if (input.started_at !== undefined) {
      updates.push(`started_at = $${idx++}`);
      params.push(input.started_at);
    }

    if (input.ended_at !== undefined) {
      updates.push(`ended_at = $${idx++}`);
      params.push(input.ended_at);
    }

    if (input.prize_pool_mon !== undefined) {
      updates.push(`prize_pool_mon = $${idx++}`);
      params.push(input.prize_pool_mon);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const text = `
      UPDATE games
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;
    params.push(id);

    const result = await query(text, params);

    if (result.rows.length === 0) {
      throw new Error('Game not found');
    }

    return result.rows[0];
  }

  /**
   * Increment current_tick by 1
   */
  static async incrementTick(id: string): Promise<Game> {
    const text = `
      UPDATE games
      SET current_tick = current_tick + 1,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(text, [id]);

    if (result.rows.length === 0) {
      throw new Error('Game not found');
    }

    return result.rows[0];
  }

  /**
   * Set tick to specific value
   */
  static async setTick(id: string, tick: number): Promise<Game> {
    return await this.update(id, { current_tick: tick });
  }

  /**
   * Update prize pool
   */
  static async updatePrizePool(id: string, prizePoolMon: number): Promise<Game> {
    return await this.update(id, { prize_pool_mon: prizePoolMon });
  }

  /**
   * Start game (transition from recruiting to playing)
   */
  static async startGame(id: string): Promise<Game> {
    const text = `
      UPDATE games
      SET phase = 'playing',
          started_at = NOW(),
          current_tick = 0,
          updated_at = NOW()
      WHERE id = $1 AND phase = 'recruiting'
      RETURNING *
    `;
    const result = await query(text, [id]);

    if (result.rows.length === 0) {
      throw new Error('Game not found or not in recruiting phase');
    }

    return result.rows[0];
  }

  /**
   * Complete game (transition from playing to completed)
   */
  static async completeGame(id: string): Promise<Game> {
    const text = `
      UPDATE games
      SET phase = 'completed',
          ended_at = NOW(),
          updated_at = NOW()
      WHERE id = $1 AND phase = 'playing'
      RETURNING *
    `;
    const result = await query(text, [id]);

    if (result.rows.length === 0) {
      throw new Error('Game not found or not in playing phase');
    }

    return result.rows[0];
  }

  /**
   * Abort game
   */
  static async abortGame(id: string): Promise<Game> {
    const text = `
      UPDATE games
      SET phase = 'aborted',
          ended_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(text, [id]);

    if (result.rows.length === 0) {
      throw new Error('Game not found');
    }

    return result.rows[0];
  }

  /**
   * Delete game
   */
  static async delete(id: string): Promise<boolean> {
    const text = 'DELETE FROM games WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows.length > 0;
  }

  /**
   * Count games by phase
   */
  static async countByPhase(phase: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM games WHERE phase = $1';
    const result = await query(text, [phase]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Count all games
   */
  static async count(): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM games';
    const result = await query(text);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Find games stuck in playing state (for cleanup)
   */
  static async findStuckGames(maxDurationHours = 2): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      WHERE phase = 'playing'
        AND started_at < NOW() - INTERVAL '1 hour' * $1
      ORDER BY started_at ASC
    `;
    const result = await query(text, [maxDurationHours]);
    return result.rows;
  }

  /**
   * Get game statistics with agent count
   */
  static async getGameStats(gameId: string): Promise<GameStats | null> {
    const text = `
      SELECT
        g.id,
        g.phase,
        g.game_type,
        g.arena_tier,
        g.current_tick,
        g.max_agents,
        COUNT(ga.agent_id) as agent_count
      FROM games g
      LEFT JOIN game_agents ga ON g.id = ga.game_id
      WHERE g.id = $1
      GROUP BY g.id, g.phase, g.game_type, g.arena_tier, g.current_tick, g.max_agents
    `;
    const result = await query(text, [gameId]);
    return result.rows[0] || null;
  }

  /**
   * Find games with agent counts
   */
  static async findWithAgentCounts(
    phase: 'recruiting' | 'playing' | 'completed' | 'aborted',
    limit = 100
  ): Promise<GameStats[]> {
    const text = `
      SELECT
        g.id,
        g.phase,
        g.game_type,
        g.arena_tier,
        g.current_tick,
        g.max_agents,
        COUNT(ga.agent_id) as agent_count
      FROM games g
      LEFT JOIN game_agents ga ON g.id = ga.game_id
      WHERE g.phase = $1
      GROUP BY g.id, g.phase, g.game_type, g.arena_tier, g.current_tick, g.max_agents
      ORDER BY g.created_at DESC
      LIMIT $2
    `;
    const result = await query(text, [phase, limit]);
    return result.rows;
  }

  /**
   * Find games by date range
   */
  static async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit = 100
  ): Promise<Game[]> {
    const text = `
      SELECT * FROM games
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
    const result = await query(text, [startDate, endDate, limit]);
    return result.rows;
  }
}

export default GameModel;
