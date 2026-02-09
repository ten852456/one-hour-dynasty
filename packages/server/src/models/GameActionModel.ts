/**
 * Game Action Model - CRUD operations for game_actions table
 */

import { query } from './database.js';

export interface GameAction {
  id: string;
  game_id: string;
  agent_id: string;
  tick: number;
  action_data: Record<string, any>;
  created_at: Date;
}

export interface CreateGameActionInput {
  game_id: string;
  agent_id: string;
  tick: number;
  action_data: Record<string, any>;
}

export interface UpdateGameActionInput {
  action_data?: Record<string, any>;
}

export class GameActionModel {
  static async create(input: CreateGameActionInput): Promise<GameAction> {
    const text = 'INSERT INTO game_actions (game_id, agent_id, tick, action_data) VALUES ($1, $2, $3, $4) RETURNING *';
    const params = [input.game_id, input.agent_id, input.tick, JSON.stringify(input.action_data)];
    const result = await query(text, params);
    if (result.rows.length === 0) throw new Error('Failed to create game action');
    return result.rows[0];
  }

  static async findById(id: string): Promise<GameAction | null> {
    const result = await query('SELECT * FROM game_actions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async update(id: string, input: UpdateGameActionInput): Promise<GameAction> {
    if (input.action_data === undefined) {
      throw new Error('No fields to update');
    }

    const text = 'UPDATE game_actions SET action_data = $1 WHERE id = $2 RETURNING *';
    const result = await query(text, [JSON.stringify(input.action_data), id]);

    if (result.rows.length === 0) {
      throw new Error('Game action not found');
    }

    return result.rows[0];
  }

  static async findByGameId(gameId: string, limit = 1000, offset = 0): Promise<GameAction[]> {
    const text = 'SELECT * FROM game_actions WHERE game_id = $1 ORDER BY tick ASC, created_at ASC LIMIT $2 OFFSET $3';
    const result = await query(text, [gameId, limit, offset]);
    return result.rows;
  }

  static async findByGameIdAndTick(gameId: string, tick: number): Promise<GameAction[]> {
    const text = 'SELECT * FROM game_actions WHERE game_id = $1 AND tick = $2 ORDER BY created_at ASC';
    const result = await query(text, [gameId, tick]);
    return result.rows;
  }

  static async findByGameAgentAndTick(gameId: string, agentId: string, tick: number): Promise<GameAction | null> {
    const text = 'SELECT * FROM game_actions WHERE game_id = $1 AND agent_id = $2 AND tick = $3';
    const result = await query(text, [gameId, agentId, tick]);
    return result.rows[0] || null;
  }

  static async findByAgentId(agentId: string, limit = 100, offset = 0): Promise<GameAction[]> {
    const text = 'SELECT * FROM game_actions WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(text, [agentId, limit, offset]);
    return result.rows;
  }

  static async findByAgentIdAndTick(agentId: string, tick: number): Promise<GameAction | null> {
    const text = 'SELECT * FROM game_actions WHERE agent_id = $1 AND tick = $2';
    const result = await query(text, [agentId, tick]);
    return result.rows[0] || null;
  }

  static async findAll(limit = 100, offset = 0): Promise<GameAction[]> {
    const text = 'SELECT * FROM game_actions ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await query(text, [limit, offset]);
    return result.rows;
  }

  static async delete(id: string): Promise<boolean> {
    const text = 'DELETE FROM game_actions WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows.length > 0;
  }

  static async deleteByGameId(gameId: string): Promise<number> {
    const text = 'DELETE FROM game_actions WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return result.rowCount || 0;
  }

  static async count(): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_actions';
    const result = await query(text);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByGameId(gameId: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_actions WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async getLatestTickByGameId(gameId: string): Promise<number> {
    const text = 'SELECT COALESCE(MAX(tick), 0) as max_tick FROM game_actions WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return parseInt(result.rows[0].max_tick, 10);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<GameAction[]> {
    const text = 'SELECT * FROM game_actions WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at DESC';
    const result = await query(text, [startDate, endDate]);
    return result.rows;
  }

  static async batchCreate(actions: CreateGameActionInput[]): Promise<GameAction[]> {
    if (actions.length === 0) return [];

    const text = 'INSERT INTO game_actions (game_id, agent_id, tick, action_data) VALUES ' +
      actions.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ') +
      ' RETURNING *';

    const params: any[] = [];
    for (const action of actions) {
      params.push(action.game_id, action.agent_id, action.tick, JSON.stringify(action.action_data));
    }

    const result = await query(text, params);
    return result.rows;
  }

  static async getActionHistoryByAgent(agentId: string, gameId: string, limit = 100): Promise<GameAction[]> {
    const text = 'SELECT * FROM game_actions WHERE agent_id = $1 AND game_id = $2 ORDER BY tick ASC LIMIT $3';
    const result = await query(text, [agentId, gameId, limit]);
    return result.rows;
  }
}

export default GameActionModel;
