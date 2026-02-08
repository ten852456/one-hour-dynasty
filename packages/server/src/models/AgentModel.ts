/**
 * Agent Model - CRUD operations for agents table
 */

import { PoolClient } from 'pg';
import { query, transaction, getClient } from './database.js';

/**
 * Agent entity interface
 */
export interface Agent {
  id: string;
  wallet: string;
  name: string;
  erc8004_token_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create agent input interface
 */
export interface CreateAgentInput {
  wallet: string;
  name: string;
  erc8004_token_id?: number;
}

/**
 * Update agent input interface
 */
export interface UpdateAgentInput {
  name?: string;
  erc8004_token_id?: number;
}

/**
 * Agent Model Class
 */
export class AgentModel {
  /**
   * Create a new agent
   * @param input - Agent creation data
   * @returns Created agent
   */
  static async create(input: CreateAgentInput): Promise<Agent> {
    const text = `
      INSERT INTO agents (wallet, name, erc8004_token_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const params = [input.wallet, input.name, input.erc8004_token_id || null];

    const result = await query<Agent>(text, params);

    if (result.rows.length === 0) {
      throw new Error('Failed to create agent');
    }

    return result.rows[0];
  }

  /**
   * Find agent by ID
   * @param id - Agent ID
   * @returns Agent or null if not found
   */
  static async findById(id: string): Promise<Agent | null> {
    const text = 'SELECT * FROM agents WHERE id = $1';
    const params = [id];

    const result = await query<Agent>(text, params);

    return result.rows[0] || null;
  }

  /**
   * Find agent by wallet address
   * @param wallet - Wallet address
   * @returns Agent or null if not found
   */
  static async findByWallet(wallet: string): Promise<Agent | null> {
    const text = 'SELECT * FROM agents WHERE wallet = $1';
    const params = [wallet];

    const result = await query<Agent>(text, params);

    return result.rows[0] || null;
  }

  /**
   * Find agent by ERC-8004 token ID
   * @param tokenId - ERC-8004 token ID
   * @returns Agent or null if not found
   */
  static async findByERC8004TokenId(tokenId: number): Promise<Agent | null> {
    const text = 'SELECT * FROM agents WHERE erc8004_token_id = $1';
    const params = [tokenId];

    const result = await query<Agent>(text, params);

    return result.rows[0] || null;
  }

  /**
   * Find or create agent by wallet
   * @param wallet - Wallet address
   * @param name - Agent name (used for creation if not found)
   * @returns Agent
   */
  static async findOrCreate(wallet: string, name: string): Promise<Agent> {
    // Try to find existing agent
    const existing = await this.findByWallet(wallet);
    if (existing) {
      return existing;
    }

    // Create new agent
    return this.create({ wallet, name });
  }

  /**
   * Get all agents with pagination
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of agents
   */
  static async findAll(limit = 100, offset = 0): Promise<Agent[]> {
    const text = `
      SELECT * FROM agents
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const params = [limit, offset];

    const result = await query<Agent>(text, params);

    return result.rows;
  }

  /**
   * Update agent by ID
   * @param id - Agent ID
   * @param input - Update data
   * @returns Updated agent
   */
  static async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(input.name);
    }

    if (input.erc8004_token_id !== undefined) {
      updates.push(`erc8004_token_id = $${paramIndex++}`);
      params.push(input.erc8004_token_id);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const text = `
      UPDATE agents
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    params.push(id);

    const result = await query<Agent>(text, params);

    if (result.rows.length === 0) {
      throw new Error('Agent not found');
    }

    return result.rows[0];
  }

  /**
   * Delete agent by ID
   * @param id - Agent ID
   * @returns true if deleted, false if not found
   */
  static async delete(id: string): Promise<boolean> {
    const text = 'DELETE FROM agents WHERE id = $1 RETURNING id';
    const params = [id];

    const result = await query(text, params);

    return result.rows.length > 0;
  }

  /**
   * Count total number of agents
   * @returns Total count
   */
  static async count(): Promise<number> {
    const text = 'SELECT COUNT(*) as count FROM agents';
    const result = await query<{ count: string }>(text);

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get agents created within a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of agents
   */
  static async findByDateRange(startDate: Date, endDate: Date): Promise<Agent[]> {
    const text = `
      SELECT * FROM agents
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC
    `;
    const params = [startDate, endDate];

    const result = await query<Agent>(text, params);

    return result.rows;
  }

  /**
   * Search agents by name (case-insensitive partial match)
   * @param name - Name to search for
   * @param limit - Maximum number of results
   * @returns Array of agents
   */
  static async searchByName(name: string, limit = 50): Promise<Agent[]> {
    const text = `
      SELECT * FROM agents
      WHERE name ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const params = [`%${name}%`, limit];

    const result = await query<Agent>(text, params);

    return result.rows;
  }
}

export default AgentModel;
