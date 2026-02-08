/**
 * Game Agent Model - CRUD operations for game_agents junction table
 */

import { query } from './database.js';

export interface GameAgent {
  id: string;
  game_id: string;
  agent_id: string;
  role: string | null;
  final_rank: number | null;
  final_score: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGameAgentInput {
  game_id: string;
  agent_id: string;
  role?: string;
}

export interface UpdateGameAgentInput {
  role?: string;
  final_rank?: number;
  final_score?: number;
}

export class GameAgentModel {
  static async create(input: CreateGameAgentInput): Promise<GameAgent> {
    const text = 'INSERT INTO game_agents (game_id, agent_id, role) VALUES ($1, $2, $3) RETURNING *';
    const params = [input.game_id, input.agent_id, input.role || null];
    const result = await query(text, params);
    if (result.rows.length === 0) throw new Error('Failed to create game agent');
    return result.rows[0];
  }

  static async findById(id: string): Promise<GameAgent | null> {
    const result = await query('SELECT * FROM game_agents WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByGameId(gameId: string): Promise<GameAgent[]> {
    const text = 'SELECT * FROM game_agents WHERE game_id = $1 ORDER BY created_at ASC';
    const result = await query(text, [gameId]);
    return result.rows;
  }

  static async findByAgentId(agentId: string): Promise<GameAgent[]> {
    const text = 'SELECT * FROM game_agents WHERE agent_id = $1 ORDER BY created_at DESC';
    const result = await query(text, [agentId]);
    return result.rows;
  }

  static async findByGameIdAndAgentId(gameId: string, agentId: string): Promise<GameAgent | null> {
    const text = 'SELECT * FROM game_agents WHERE game_id = $1 AND agent_id = $2';
    const result = await query(text, [gameId, agentId]);
    return result.rows[0] || null;
  }

  static async findAll(limit = 100, offset = 0): Promise<GameAgent[]> {
    const text = 'SELECT * FROM game_agents ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await query(text, [limit, offset]);
    return result.rows;
  }

  static async update(id: string, input: UpdateGameAgentInput): Promise<GameAgent> {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (input.role !== undefined) {
      updates.push(`role = $${idx++}`);
      params.push(input.role);
    }
    if (input.final_rank !== undefined) {
      updates.push(`final_rank = $${idx++}`);
      params.push(input.final_rank);
    }
    if (input.final_score !== undefined) {
      updates.push(`final_score = $${idx++}`);
      params.push(input.final_score);
    }

    if (updates.length === 0) throw new Error('No fields to update');

    const text = `UPDATE game_agents SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    params.push(id);

    const result = await query(text, params);
    if (result.rows.length === 0) throw new Error('Game agent not found');
    return result.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const text = 'DELETE FROM game_agents WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows.length > 0;
  }

  static async deleteByGameId(gameId: string): Promise<number> {
    const text = 'DELETE FROM game_agents WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return result.rowCount || 0;
  }

  static async deleteByAgentId(agentId: string): Promise<number> {
    const text = 'DELETE FROM game_agents WHERE agent_id = $1';
    const result = await query(text, [agentId]);
    return result.rowCount || 0;
  }

  static async count(): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_agents';
    const result = await query(text);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByGameId(gameId: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_agents WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByAgentId(agentId: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_agents WHERE agent_id = $1';
    const result = await query(text, [agentId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async batchCreate(agents: CreateGameAgentInput[]): Promise<GameAgent[]> {
    if (agents.length === 0) return [];

    const text = 'INSERT INTO game_agents (game_id, agent_id, role) VALUES ' +
      agents.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ') +
      ' RETURNING *';

    const params: any[] = [];
    for (const agent of agents) {
      params.push(agent.game_id, agent.agent_id, agent.role || null);
    }

    const result = await query(text, params);
    return result.rows;
  }

  static async findByRole(role: string, limit = 100, offset = 0): Promise<GameAgent[]> {
    const text = 'SELECT * FROM game_agents WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(text, [role, limit, offset]);
    return result.rows;
  }

  static async getTopPerformers(limit = 10): Promise<GameAgent[]> {
    const text = 'SELECT * FROM game_agents WHERE final_rank IS NOT NULL ORDER BY final_rank ASC, final_score DESC LIMIT $1';
    const result = await query(text, [limit]);
    return result.rows;
  }
}

export default GameAgentModel;
