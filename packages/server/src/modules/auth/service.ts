import { AgentModel } from '../../models/AgentModel.js'

export class AuthService {
  /**
   * Find or create an agent by wallet address
   */
  async findOrCreateAgent(
    agentWallet: string,
    agentName: string,
    erc8004TokenId?: string
  ) {
    // Try to find existing agent by wallet
    const existing = await AgentModel.findByWallet(agentWallet)
    if (existing) {
      return existing
    }

    // Create new agent
    return await AgentModel.create({
      wallet: agentWallet,
      name: agentName,
      erc8004_token_id: erc8004TokenId ? parseInt(erc8004TokenId) : undefined
    })
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string) {
    const agent = await AgentModel.findById(agentId)

    if (!agent) {
      throw new Error('Agent not found')
    }

    return agent
  }

  /**
   * Verify ERC-8004 token ownership (stub implementation)
   * TODO: Implement actual blockchain verification
   */
  async verifyERC8004Ownership(
    _agentId: string,
    _tokenId: string
  ): Promise<boolean> {
    // TODO: Verify NFT ownership on Monad blockchain
    // For now, return true for testing
    return true
  }
}

export const authService = new AuthService()
