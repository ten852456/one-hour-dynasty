import { Elysia, t } from 'elysia'
import { jwtPlugin } from '../../plugins/jwt.js'
import { database } from '../../plugins/database.js'
import { gameService } from './service.js'
import { GameAgentModel } from '../../models/GameAgentModel.js'
import {
  SubmitActionSchema,
  GameStateSchema,
  GameActionResponseSchema
} from './model.js'

// Store WebSocket connections by game
// Using Map<socketId, ws> instead of Set<ws> because Elysia creates different proxy objects
// See: https://github.com/elysiajs/elysia/issues/XXXX
const gameConnections = new Map<string, Map<string, any>>()

// WebSocket heartbeat configuration
const WS_HEARTBEAT_INTERVAL = 30000 // Check every 30 seconds
const WS_HEARTBEAT_TIMEOUT = 60000 // Close connections after 60 seconds of no activity

// WebSocket message schema
const WebSocketMessageSchema = t.Object({
  type: t.Union([
    t.Literal('subscribe'),
    t.Literal('action'),
    t.Literal('ping'),
    t.Literal('unsubscribe')
  ]),
  data: t.Optional(t.Any())
})

const WebSocketResponseSchema = t.Object({
  type: t.String(),
  gameId: t.Optional(t.String()),
  timestamp: t.Optional(t.Number()),
  data: t.Optional(t.Any())
})

export const gameRoutes = new Elysia({
  prefix: '/api/v1',
  name: 'routes:game'
})
  .use(jwtPlugin())
  .use(database())
  .model({
    'game:action': SubmitActionSchema,
    'game:state': GameStateSchema,
    'game:action-response': GameActionResponseSchema,
    'game:ws-message': WebSocketMessageSchema,
    'game:ws-response': WebSocketResponseSchema
  })
  // GET /api/v1/state/:gameId - Get game state
  .get(
    '/state/:gameId',
    async ({ params, set }: any) => {
      try {
        const gameState = await gameService.getGameState(params.gameId)
        return gameState
      } catch (error: any) {
        set.status = error.message.includes('not found') ? 404 : 500
        return { error: 'Failed to fetch game state', message: error.message }
      }
    },
    {
      params: t.Object({
        gameId: t.String()
      }),
      response: {
        200: t.Any(),
        404: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
  // GET /api/v1/games - List available games
  .get(
    '/games',
    async ({ set }: any) => {
      try {
        const games = await gameService.listAvailableGames()
        return games
      } catch (error: any) {
        set.status = 500
        return { error: 'Failed to list games', message: error.message }
      }
    },
    {
      response: {
        200: t.Array(t.Any()),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
  // POST /api/v1/action - Submit agent action
  .post(
    '/action',
    async ({ body, jwt, headers, set }: any) => {
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

        // Verify agent is in the game before allowing action
        const agentInGame = await GameAgentModel.findByGameIdAndAgentId(body.gameId, payload.agentId as string)

        if (!agentInGame) {
          set.status = 403
          return { error: 'Forbidden', message: 'Agent is not participating in this game' }
        }

        const action = await gameService.submitAction(
          body.gameId,
          payload.agentId as string,
          body.action
        )

        // Broadcast to WebSocket subscribers

        // Broadcast to WebSocket subscribers
        const connections = gameConnections.get(body.gameId)
        if (connections) {
          const message = {
            type: 'action',
            gameId: body.gameId,
            timestamp: Date.now(),
            data: action
          }
          // Iterate over Map values (the ws objects)
          for (const ws of connections.values()) {
            ws.send(message)
          }
        }

        set.status = 201
        return action
      } catch (error: any) {
        const isForbidden = error.name === 'ForbiddenError'
        set.status = isForbidden ? 403 : (error.message.includes('not found') ? 404 : 500)
        return {
          error: isForbidden ? 'Forbidden' : 'Failed to submit action',
          message: error.message
        }
      }
    },
    {
      body: 'game:action',
      response: {
        201: t.Any(),
        401: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
        500: t.Object({ error: t.String(), message: t.Optional(t.String()) })
      }
    }
  )
  // Simple test WebSocket
  .ws('/ws/test', {
    open(ws) {
      const socketId = crypto.randomUUID()
      ws.data.socketId = socketId
      ws.data.lastHeartbeat = Date.now()
      console.log('🔌 Test WebSocket opened, socket ID:', socketId)
      ws.send({ type: 'connected', socketId, message: 'WebSocket works!' })
    },
    message(ws, message) {
      ws.data.lastHeartbeat = Date.now()
      console.log('📨 Test WebSocket message from socket:', ws.data.socketId, message)
      ws.send({ type: 'echo', socketId: ws.data.socketId, data: message })
    },
    close(ws, code, reason) {
      console.log('🔌 Test WebSocket closed, socket ID:', ws.data.socketId, 'code:', code)
    }
  })
  // WebSocket /ws/game/:gameId - Game state updates (with authentication)
  .ws('/ws/game/:gameId', {
    async open(ws) {
      const gameId = ws.data.params.gameId

      // Extract token from query parameters
      const token = new URL(ws.data.params.url, 'http://localhost').searchParams.get('token')

      if (!token) {
        ws.close(4001, 'Missing authentication token')
        console.log(`❌ WebSocket rejected for game ${gameId}: No token provided`)
        return
      }

      // Verify JWT token
      let payload
      try {
        const { jwt: jwtFn } = await import('@elysiajs/jwt')
        const jwt = jwtFn({ name: 'jwt', secret: (await import('../config/index.js')).default.jwt.secret })

        payload = await jwt.verify(token)

        if (!payload || !payload.agentId) {
          ws.close(4002, 'Invalid authentication token')
          console.log(`❌ WebSocket rejected for game ${gameId}: Invalid token`)
          return
        }
      } catch (error) {
        ws.close(4003, 'Authentication failed')
        console.log(`❌ WebSocket rejected for game ${gameId}: Auth error`)
        return
      }

      // Verify agent is actually in this game
      const agentInGame = await GameAgentModel.findByGameIdAndAgentId(gameId, payload.agentId)

      if (!agentInGame) {
        ws.close(4003, 'Not authorized for this game')
        console.log(`❌ WebSocket rejected for game ${gameId}: Agent ${payload.agentId} not in game`)
        return
      }

      // Authentication successful - set up connection
      const socketId = crypto.randomUUID()
      ws.data.socketId = socketId
      ws.data.agentId = payload.agentId
      ws.data.lastHeartbeat = Date.now()

      console.log(`🔌 WebSocket opened for game ${gameId}, socket: ${socketId}, agent: ${payload.agentId}`)

      if (!gameConnections.has(gameId)) {
        gameConnections.set(gameId, new Map())
      }

      gameConnections.get(gameId)!.set(socketId, ws)

      // Send initial state
      ws.send({
        type: 'connected',
        gameId,
        socketId,
        agentId: payload.agentId,
        timestamp: Date.now()
      })
    },
    message(ws, message) {
      const gameId = ws.data.params.gameId
      const socketId = ws.data.socketId
      ws.data.lastHeartbeat = Date.now() // Update heartbeat on any message
      console.log(`📨 WebSocket message from game ${gameId}, socket ${socketId}:`, message)

      // Handle different message types
      switch ((message as any).type) {
        case 'ping':
          ws.send({
            type: 'pong',
            gameId,
            socketId,
            timestamp: Date.now()
          })
          break
        case 'subscribe':
          ws.send({
            type: 'subscribed',
            gameId,
            socketId,
            timestamp: Date.now()
          })
          break
        case 'unsubscribe':
          ws.send({
            type: 'unsubscribed',
            gameId,
            socketId,
            timestamp: Date.now()
          })
          ws.close()
          break
        default:
          ws.send({
            type: 'echo',
            gameId,
            socketId,
            timestamp: Date.now(),
            data: message
          })
      }
    },
    close(ws, code, reason) {
      const gameId = ws.data.params.gameId
      const socketId = ws.data.socketId

      const connections = gameConnections.get(gameId)
      if (connections && socketId) {
        connections.delete(socketId)
        if (connections.size === 0) {
          gameConnections.delete(gameId)
        }
      }

      console.log(`🔌 WebSocket closed for game ${gameId}, socket ${socketId} (code: ${code})`)
    }
  })

// WebSocket heartbeat cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  let cleaned = 0

  for (const [gameId, connections] of gameConnections.entries()) {
    for (const [socketId, ws] of connections.entries()) {
      // Check if connection is stale
      if (now - ws.data.lastHeartbeat > WS_HEARTBEAT_TIMEOUT) {
        console.log(`💀 Closing stale WebSocket ${socketId} for game ${gameId}`)
        try {
          ws.terminate()
        } catch (err) {
          // Connection already closed
        }
        connections.delete(socketId)
        cleaned++
      }
    }

    // Clean up empty game connection maps
    if (connections.size === 0) {
      gameConnections.delete(gameId)
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} stale WebSocket connections`)
  }
}, WS_HEARTBEAT_INTERVAL)
