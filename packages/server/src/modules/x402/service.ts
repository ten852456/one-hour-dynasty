import { v4 as uuidv4 } from 'uuid'
import config from '../../config/index.js'

export class X402Service {
  /**
   * Create x402 payment request
   */
  async createPayment(
    _agentAddress: string,
    amount: number,
    _gameId?: string
  ): Promise<{
    paymentId: string
    facilitatorUrl: string
    amount: string
    recipientAddress: string
    network: string
    status: string
  }> {
    const paymentId = uuidv4()

    // TODO: Implement actual x402 facilitator integration
    // For now, return a mock response
    const paymentData = {
      paymentId,
      facilitatorUrl: `${config.x402.facilitatorUrl}/pay/${paymentId}`,
      amount: amount.toString(),
      recipientAddress: config.monad.payToAddress,
      network: config.x402.network,
      status: 'pending'
    }

    // In production, would call:
    // await axios.post(`${config.x402.facilitatorUrl}/payments`, {
    //   paymentId,
    //   amount,
    //   recipientAddress: config.monad.payToAddress,
    //   network: config.x402.network,
    //   metadata: { gameId, agentAddress }
    // })

    return paymentData
  }

  /**
   * Verify x402 payment
   * ⚠️ SECURITY: Currently in stub mode - always returns true
   * MUST implement actual verification before production deployment
   */
  async verifyPayment(paymentId: string): Promise<boolean> {
    // Check if running in stub mode (for development/hackathon only)
    if (process.env.X402_STUB_MODE === 'true') {
      console.warn(`⚠️  X402 PAYMENT VERIFICATION IN STUB MODE`)
      console.warn(`   Payment ID: ${paymentId}`)
      console.warn(`   This is NOT secure and should NEVER be used in production!`)
      return true
    }

    // TODO: Implement actual x402 verification for production
    // const response = await axios.get(`${config.x402.facilitatorUrl}/payments/${paymentId}`)
    // if (response.data.status !== 'completed') {
    //   throw new Error(`Payment ${paymentId} not completed`)
    // }
    // return true

    // For now, throw error to prevent insecure deployment
    throw new Error('X402 payment verification not implemented. Set X402_STUB_MODE=true for development only.')
  }

  /**
   * Handle x402 webhook callback
   */
  async handleWebhook(webhookData: {
    paymentId: string
    status: string
    transactionHash: string
    amount: string
    agentAddress: string
  }): Promise<void> {
    // TODO: Process payment completion
    // 1. Verify payment on blockchain
    // 2. Update database
    // 3. Add agent to game
    console.log('x402 Webhook received:', webhookData)

    if (webhookData.status === 'completed') {
      // Payment successful - agent can join game
      // This would be implemented with actual game logic
    }
  }
}

export const x402Service = new X402Service()
