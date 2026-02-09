/**
 * Game Result Model - CRUD operations for game_results table
 */

import { query } from './database.js';

export interface GameResult {
  id: string;
  game_id: string;
  agent_wallet: string;
  agent_token_id: number | null;
  final_rank: number;
  final_score: number;
  created_at: Date;
}

export interface CreateGameResultInput {
  game_id: string;
  agent_wallet: string;
  agent_token_id?: number;
  final_rank: number;
  final_score: number;
}

export class GameResultModel {
  static async create(input: CreateGameResultInput): Promise<GameResult> {
    const text = 'INSERT INTO game_results (game_id, agent_wallet, agent_token_id, final_rank, final_score) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const params = [
      input.game_id,
      input.agent_wallet,
      input.agent_token_id || null,
      input.final_rank,
      input.final_score
    ];
    const result = await query(text, params);
    if (result.rows.length === 0) throw new Error('Failed to create game result');
    return result.rows[0];
  }

  static async findById(id: string): Promise<GameResult | null> {
    const result = await query('SELECT * FROM game_results WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByGameId(gameId: string): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results WHERE game_id = $1 ORDER BY final_rank ASC';
    const result = await query(text, [gameId]);
    return result.rows;
  }

  static async findByAgentWallet(wallet: string, limit = 100, offset = 0): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results WHERE agent_wallet = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(text, [wallet, limit, offset]);
    return result.rows;
  }

  static async findByAgentTokenId(tokenId: number, limit = 100, offset = 0): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results WHERE agent_token_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(text, [tokenId, limit, offset]);
    return result.rows;
  }

  static async findByAgentWalletAndGame(wallet: string, gameId: string): Promise<GameResult | null> {
    const text = 'SELECT * FROM game_results WHERE agent_wallet = $1 AND game_id = $2';
    const result = await query(text, [wallet, gameId]);
    return result.rows[0] || null;
  }

  static async findAll(limit = 100, offset = 0): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await query(text, [limit, offset]);
    return result.rows;
  }

  static async getLeaderboard(limit = 100): Promise<{ agent_wallet: string; total_score: number; games_played: number }[]> {
    const text = `
      SELECT 
        agent_wallet,
        SUM(final_score) as total_score,
        COUNT(*) as games_played
      FROM game_results
      GROUP BY agent_wallet
      ORDER BY total_score DESC
      LIMIT $1
    `;
    const result = await query(text, [limit]);
    return result.rows;
  }

  static async getTopAgentsByRank(limit = 100): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results WHERE final_rank = 1 ORDER BY created_at DESC LIMIT $1';
    const result = await query(text, [limit]);
    return result.rows;
  }

  static async getBestResultsForWallet(wallet: string, limit = 10): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results WHERE agent_wallet = $1 ORDER BY final_rank ASC, final_score DESC LIMIT $2';
    const result = await query(text, [wallet, limit]);
    return result.rows;
  }

  static async delete(id: string): Promise<boolean> {
    const text = 'DELETE FROM game_results WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows.length > 0;
  }

  static async deleteByGameId(gameId: string): Promise<number> {
    const text = 'DELETE FROM game_results WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return result.rowCount || 0;
  }

  static async count(): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_results';
    const result = await query(text);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByGameId(gameId: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_results WHERE game_id = $1';
    const result = await query(text, [gameId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByAgentWallet(wallet: string): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM game_results WHERE agent_wallet = $1';
    const result = await query(text, [wallet]);
    return parseInt(result.rows[0].count, 10);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<GameResult[]> {
    const text = 'SELECT * FROM game_results WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at DESC';
    const result = await query(text, [startDate, endDate]);
    return result.rows;
  }

  static async getTotalScoreForWallet(wallet: string): Promise<number> {
    const text = 'SELECT COALESCE(SUM(final_score), 0) as total_score FROM game_results WHERE agent_wallet = $1';
    const result = await query(text, [wallet]);
    return parseInt(result.rows[0].total_score, 10);
  }

  static async getAverageRankForWallet(wallet: string): Promise<number> {
    const text = 'SELECT COALESCE(AVG(final_rank), 0) as avg_rank FROM game_results WHERE agent_wallet = $1';
    const result = await query(text, [wallet]);
    return parseFloat(result.rows[0].avg_rank);
  }

  static async batchCreate(results: CreateGameResultInput[]): Promise<GameResult[]> {
    if (results.length === 0) return [];

    const text = 'INSERT INTO game_results (game_id, agent_wallet, agent_token_id, final_rank, final_score) VALUES ' +
      results.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ') +
      ' RETURNING *';

    const params: any[] = [];
    for (const result of results) {
      params.push(
        result.game_id,
        result.agent_wallet,
        result.agent_token_id || null,
        result.final_rank,
        result.final_score
      );
    }

    const queryResult = await query(text, params);
    return queryResult.rows;
  }
}

export default GameResultModel;
