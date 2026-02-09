import { GameModel } from '../../models/GameModel.js'
import { GameAgentModel } from '../../models/GameAgentModel.js'
import { GameActionModel } from '../../models/GameActionModel.js'
import config from '../../config/index.js'

export class GameService {
  /**
   * Create a new game instance
   */
  async createGame(
    tier: 'bronze' | 'silver' | 'gold',
    entryFeeMon: number
  ) {
    const arenaId = tier === 'bronze' ? 1 : tier === 'silver' ? 2 : 3

    return await GameModel.create({
      game_type: 'arena',
      arena_tier: tier,
      arena_id: arenaId,
      entry_fee_mon: entryFeeMon,
      max_agents: config.game.maxAgentsPerGame,
      min_agents_to_start: config.game.minAgentsToStart,
      phase: 'recruiting'
    })
  }

  /**
   * Create a training game
   */
  async createTrainingGame() {
    return await GameModel.create({
      game_type: 'training',
      entry_fee_mon: 0,
      max_agents: 10,
      min_agents_to_start: 2,
      phase: 'recruiting'
    })
  }

  /**
   * Get game by ID
   */
  async getGame(gameId: string) {
    const game = await GameModel.findById(gameId)

    if (!game) {
      throw new Error('Game not found')
    }

    // Get agent count
    const agents = await GameAgentModel.findByGameId(gameId)

    return {
      ...game,
      currentAgents: agents.length
    }
  }

  /**
   * List available games (recruiting phase)
   * Optimized to use single query with JOIN to avoid N+1 problem
   */
  async listAvailableGames() {
    // Single query with JOIN instead of N+1 queries
    return await GameModel.findAvailableWithCounts()
  }

  /**
   * Find recruiting games by arena tier
   */
  async findRecruitingByTier(tier: 'bronze' | 'silver' | 'gold') {
    return await GameModel.findRecruitingByTier(tier)
  }

  /**
   * Join agent to game
   */
  /**
   * Join an agent to a game (with transaction to prevent race conditions)
   */
  async joinGame(gameId: string, agentId: string) {
    const { transaction } = await import('../models/database.js')

    return await transaction(async (client) => {
      // Check if already joined within transaction
      const existingResult = await client.query(
        'SELECT * FROM game_agents WHERE game_id = $1 AND agent_id = $2',
        [gameId, agentId]
      )

      if (existingResult.rows.length > 0) {
        throw new Error('Agent already in this game')
      }

      // Add agent to game within transaction
      await client.query(
        'INSERT INTO game_agents (game_id, agent_id) VALUES ($1, $2)',
        [gameId, agentId]
      )

      // Check if game should start
      await this.checkGameStart(gameId)

      return { success: true }
    })
  }

  /**
   * Check if game has enough agents to start
   */
  /**
   * Check if game should start and start it (with transaction to prevent race condition)
   */
  private async checkGameStart(gameId: string) {
    const { transaction } = await import('../models/database.js')

    return await transaction(async (client) => {
      // Lock the game row to prevent concurrent updates
      const gameResult = await client.query(
        'SELECT * FROM games WHERE id = $1 FOR UPDATE',
        [gameId]
      )

      const game = gameResult.rows[0]
      if (!game || game.phase !== 'recruiting') return

      const agentsResult = await client.query(
        'SELECT COUNT(*) as count FROM game_agents WHERE game_id = $1',
        [gameId]
      )

      const count = parseInt(agentsResult.rows[0].count)

      if (count >= game.min_agents_to_start) {
        // Start the game within the transaction
        await client.query(
          'UPDATE games SET phase = $1, started_at = NOW(), current_tick = 0 WHERE id = $2',
          ['playing', gameId]
        )
        console.log(`Game ${gameId} started with ${count} agents`)
      }
    })
  }

  /**
   * Submit agent action
   */
  async submitAction(
    gameId: string,
    agentId: string,
    action: any
  ) {
    // Get current tick
    const game = await GameModel.findById(gameId)

    if (!game) {
      throw new Error('Game not found')
    }

    const currentTick = game.current_tick || 0

    // Check if already submitted for this tick
    const existing = await GameActionModel.findByGameAgentAndTick(
      gameId,
      agentId,
      currentTick
    )

    if (existing) {
      // Update existing action
      return await GameActionModel.update(existing.id, {
        action_data: action
      })
    }

    // Create new action
    return await GameActionModel.create({
      game_id: gameId,
      agent_id: agentId,
      tick: currentTick,
      action_data: action
    })
  }

  /**
   * Get game state with agents
   */
  async getGameState(gameId: string) {
    const game = await this.getGame(gameId)

    // Get agents in game
    const agents = await GameAgentModel.findByGameId(gameId)

    return {
      ...game,
      agents: agents.map((ga) => ({
        agentId: ga.agent_id,
        role: ga.role,
        finalRank: ga.final_rank,
        finalScore: ga.final_score
      }))
    }
  }

  /**
   * Increment game tick
   */
  async incrementTick(gameId: string) {
    return await GameModel.incrementTick(gameId)
  }

  /**
   * Complete game
   */
  async completeGame(gameId: string) {
    return await GameModel.completeGame(gameId)
  }

  /**
   * Abort game
   */
  async abortGame(gameId: string) {
    return await GameModel.abortGame(gameId)
  }

  /**
   * Get agent count in game
   */
  async getAgentCount(gameId: string) {
    return await GameAgentModel.countByGameId(gameId)
  }

  /**
   * Find active (playing) games
   */
  async findActiveGames() {
    return await GameModel.findActive()
  }

  /**
   * Get game statistics
   */
  async getGameStats(gameId: string) {
    return await GameModel.getGameStats(gameId)
  }
}

export const gameService = new GameService()
