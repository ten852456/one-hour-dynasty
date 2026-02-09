import { Elysia, t } from 'elysia'
import { jwtPlugin } from '../../plugins/jwt.js'
import { database } from '../../plugins/database.js'
import { authService } from './service.js'

export const authRoutes = new Elysia({
  prefix: '/api/v1',
  name: 'routes:auth'
})
  .use(jwtPlugin())
  .use(database())
  // POST /api/v1/join - Agent registers for a game
  .post(
    '/join',
    async ({ body, jwt, set }: any) => {
      try {
        const agent = await authService.findOrCreateAgent(
          body.agentId,
          body.agentName,
          body.erc8004TokenId
        )

        // Generate JWT token
        const token = await jwt.sign({
          agentId: agent.id,
          agentName: agent.name
        })

        set.status = 201

        return {
          token,
          agent: {
            id: agent.id,
            agentName: agent.name,
            erc8004TokenId: agent.erc8004_token_id?.toString(),
            createdAt: agent.created_at
          }
        }
      } catch (error: any) {
        set.status = 500
        return {
          error: 'Failed to join game',
          message: error.message
        }
      }
    },
    {
      body: t.Object({
        agentId: t.String(),
        agentName: t.String(),
        erc8004TokenId: t.Optional(t.String())
      }),
      response: {
        201: t.Object({
          token: t.String(),
          agent: t.Object({
            id: t.String(),
            agentName: t.String(),
            erc8004TokenId: t.Union([t.String(), t.Null(), t.Undefined()]),
            createdAt: t.Date()
          })
        }),
        400: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
  // GET /api/v1/profile - Get current agent profile (protected)
  .get(
    '/profile',
    async ({ jwt, headers, set }: any) => {
      try {
        // Verify JWT token
        const authHeader = headers.authorization
        if (!authHeader) {
          set.status = 401
          return { error: 'Unauthorized', message: 'Missing authorization header' }
        }

        const token = authHeader.replace('Bearer ', '')
        const payload = await jwt.verify(token)

        if (!payload) {
          set.status = 401
          return { error: 'Unauthorized', message: 'Invalid token' }
        }

        const agent = await authService.getAgent(payload.agentId as string)

        return {
          id: agent.id,
          agentName: agent.name,
          erc8004TokenId: agent.erc8004_token_id?.toString(),
          createdAt: agent.created_at
        }
      } catch (error: any) {
        set.status = error.message.includes('not found') ? 404 : 500
        return {
          error: 'Failed to fetch profile',
          message: error.message
        }
      }
    },
    {
      response: {
        200: t.Object({
          id: t.String(),
          agentName: t.String(),
          erc8004TokenId: t.Union([t.String(), t.Null(), t.Undefined()]),
          createdAt: t.Date()
        }),
        401: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
        404: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )

