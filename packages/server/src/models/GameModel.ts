/**
 * Game Model - CRUD operations for games table
 */

import { query } from './database.js';

export interface Game {
  id: string;
  state: 'waiting' | 'running' | 'completed' | 'aborted';
  tier: 'arena' | 'training';
  entry_fee: number;
  started_at: Date | null;
  ended_at: Date | null;
  tick: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGameInput {
  state?: 'waiting' | 'running' | 'completed' | 'aborted';
  tier: 'arena' | 'training';
  entry_fee: number;
}

export interface UpdateGameInput {
  state?: 'waiting' | 'running' | 'completed' | 'aborted';
  started_at?: Date | null;
  ended_at?: Date | null;
  tick?: number;
}

export class GameModel {
  static async create(input: CreateGameInput): Promise<Game> {
    const text = 'INSERT INTO games (state, tier, entry_fee) VALUES ($1, $2, $3) RETURNING *';
    const params = [input.state || 'waiting', input.tier, input.entry_fee];
    const result = await query(text, params);
    if (result.rows.length === 0) throw new Error('Failed to create game');
    return result.rows[0];
  }

  static async findById(id: string): Promise<Game | null> {
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByState(state: string, limit = 100, offset = 0): Promise<Game[]> {
    const text = 'SELECT * FROM games WHERE state = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(text, [state, limit, offset]);
    return result.rows;
  }

  static async findByTier(tier: string, limit = 100, offset = 0): Promise<Game[]> {
    const text = 'SELECT * FROM games WHERE tier = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(text, [tier, limit, offset]);
    return result.rows;
  }

  static async findWaitingByTier(tier: string): Promise<Game[]> {
    const text = "SELECT * FROM games WHERE state = 'waiting' AND tier = $1 ORDER BY created_at ASC";
    const result = await query(text, [tier]);
    return result.rows;
  }

  static async findAll(limit = 100, offset = 0): Promise<Game[]> {
    const text = 'SELECT * FROM games ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await query(text, [limit, offset]);
    return result.rows;
  }

  static async update(id: string, input: UpdateGameInput): Promise<Game> {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (input.state !== undefined) {
      updates.push(`state = $${idx++}`);
      params.push(input.state);
    }
    if (input.started_at !== undefined) {
      updates.push(`started_at = $${idx++}`);
      params.push(input.started_at);
    }
    if (input.ended_at !== undefined) {
      updates.push(`ended_at = $${idx++}`);
      params.push(input.ended_at);
    }
    if (input.tick !== undefined) {
      updates.push(`tick = $${idx++}`);
      params.push(input.tick);
    }

    if (updates.length === 0) throw new Error('No fields to update');

    const text = `UPDATE games SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    params.push(id);

    const result = await query(text, params);
    if (result.rows.length === 0) throw new Error('Game not found');
    return result.rows[0];
  }

  static async incrementTick(id: string): Promise<Game> {
    const text = 'UPDATE games SET tick = tick + 1 WHERE id = $1 RETURNING *';
    const result = await query(text, [id]);
    if (result.rows.length === 0) throw new Error('Game not found');
    return result.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const text = 'DELETE FROM games WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows.length > 0;
  }

  static async count(): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM games';
    const result = await query(text);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByState(state: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM games WHERE state = $1';
    const result = await query(text, [state]);
    return parseInt(result.rows[0].count, 10);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<Game[]> {
    const text = 'SELECT * FROM games WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at DESC';
    const result = await query(text, [startDate, endDate]);
    return result.rows;
  }

  static async findActiveGames(): Promise<Game[]> {
    const text = "SELECT * FROM games WHERE state = 'running' ORDER BY started_at ASC";
    const result = await query(text);
    return result.rows;
  }

  static async findStuckGames(maxDurationHours = 2): Promise<Game[]> {
    const text = "SELECT * FROM games WHERE state = 'running' AND started_at < NOW() - INTERVAL '1 hour' * $1 ORDER BY started_at ASC";
    const result = await query(text, [maxDurationHours]);
    return result.rows;
  }
}

export default GameModel;
