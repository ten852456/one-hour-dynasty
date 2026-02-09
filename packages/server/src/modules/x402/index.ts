import { Elysia, t } from 'elysia'
import { database } from '../../plugins/database.js'
import { x402Service } from './service.js'
import { gameService } from '../game/service.js'
import config from '../../config/index.js'
import {
  X402PaymentRequestSchema,
  X402WebhookSchema,
  X402PaymentResponseSchema
} from './model.js'

export const x402Routes = new Elysia({
  prefix: '/api',
  name: 'routes:x402'
})
  .use(database())
  .model({
    'x402:request': X402PaymentRequestSchema,
    'x402:webhook': X402WebhookSchema,
    'x402:response': X402PaymentResponseSchema
  })
  // POST /api/join-room - Create x402 payment to join game room
  .post(
    '/join-room',
    async ({ body, set }) => {
      try {
        // Determine tier and entry fee
        const tier = (body as any).tier || 'bronze'
        const entryFeeMon = config.game.arenaEntryFeeMon

        // Create or get game
        let gameId = (body as any).gameId

        if (!gameId) {
          // Find available game or create new one
          const gamesResult = await gameService.listAvailableGames()

          const availableGames = gamesResult as any[]
          const suitableGame = availableGames.find(
            (g: any) => g.arena_tier === tier && g.currentAgents < g.max_agents
          )

          if (suitableGame) {
            gameId = suitableGame.id
          } else {
            // Create new game
            const newGame = await gameService.createGame(tier, entryFeeMon)
            gameId = (newGame as any).id
          }
        }

        // Create x402 payment
        const payment = await x402Service.createPayment(
          (body as any).agentAddress,
          entryFeeMon,
          gameId
        )

        set.status = 201
        return payment
      } catch (error: any) {
        set.status = 500
        return { error: 'Failed to create payment', message: error.message }
      }
    },
    {
      body: 'x402:request',
      response: {
        201: t.Object({
          paymentId: t.String(),
          facilitatorUrl: t.String(),
          amount: t.String(),
          recipientAddress: t.String(),
          network: t.String(),
          status: t.String()
        }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
  // POST /api/x402/webhook - Handle x402 payment webhook
  .post(
    '/x402/webhook',
    async ({ body, set }: any) => {
      try {
        await x402Service.handleWebhook(body)

        return {
          status: 'ok',
          message: 'Webhook processed'
        }
      } catch (error: any) {
        set.status = 500
        return { error: 'Failed to process webhook', message: error.message }
      }
    },
    {
      body: 'x402:webhook',
      response: {
        200: t.Object({ status: t.String(), message: t.String() }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
  // GET /api/x402/verify/:paymentId - Verify payment status
  .get(
    '/x402/verify/:paymentId',
    async ({ params }) => {
      const isValid = await x402Service.verifyPayment(params.paymentId)

      return {
        paymentId: params.paymentId,
        valid: isValid
      }
    },
    {
      params: t.Object({
        paymentId: t.String()
      }),
      response: {
        200: t.Object({
          paymentId: t.String(),
          valid: t.Boolean()
        }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
