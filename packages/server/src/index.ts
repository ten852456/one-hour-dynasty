import 'dotenv/config'
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { rateLimit } from 'elysia-rate-limit'
import { logger } from './plugins/logger.js'
import { database } from './plugins/database.js'
import { jwtPlugin } from './plugins/jwt.js'
import { audit } from './plugins/audit.js'
import { validateConfig } from './config/index.js'
import { authRoutes } from './modules/auth/index.js'
import { gameRoutes } from './modules/game/index.js'
import { x402Routes } from './modules/x402/index.js'

// Validate configuration on startup
validateConfig()

const app = new Elysia({
  name: 'one-hour-dynasty',
  websocket: {
    perMessageDeflate: true
  }
})
  .use(logger())
  .use(database())
  .use(jwtPlugin())
  .use(audit())
  .use(rateLimit({
    duration: 60000, // 1 minute
    max: 100, // 100 requests per minute
    generator: (request) => request.headers.get('x-forwarded-for') || 'unknown',
    responseMessage: 'Too many requests, please try again later'
  }))
  .use(
    cors({
      origin: process.env.NODE_ENV === 'production'
        ? ['https://one-hour-dynasty.vercel.app', 'https://yourdomain.com'] // Whitelist in production
        : true, // Allow all origins in development
      credentials: true
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'One Hour Dynasty API',
          version: '0.1.0',
          description: 'Backend API for One Hour Dynasty - A Wuxia strategy game for AI Agents'
        }
      },
      exclude: ['/health']
    })
  )
  // Health check endpoint
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }))
  // Simple WebSocket test on main app
  .ws('/ws/test', {
    open(ws) {
      console.log('🔌 Test WebSocket opened on main app')
      ws.send({ type: 'connected', message: 'WebSocket works!' })
    },
    message(ws, message) {
      console.log('📨 Test WebSocket message:', message)
      ws.send({ type: 'echo', data: message })
    },
    close(ws) {
      console.log('🔌 Test WebSocket closed')
    }
  })
  // Mount route modules
  .use(authRoutes)
  .use(gameRoutes)
  .use(x402Routes)
  // Global error handler
  .onError(({ code, error, set }) => {
    console.error('Error:', error)

    // Generate unique request ID for debugging
    const requestId = crypto.randomUUID().slice(0, 8)

    if (code === 'VALIDATION') {
      set.status = 400
      return {
        error: 'Validation failed',
        issues: (error as any).all
      }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        error: 'Not found'
      }
    }

    set.status = 500
    // Sanitize error messages in production
    if (config.nodeEnv === 'production') {
      return {
        error: 'Internal server error',
        requestId // For debugging, logs should map requestId to full error
      }
    } else {
      // Detailed errors in development
      return {
        error: 'Internal server error',
        message: (error as Error).message,
        requestId
      }
    }
  })
  .listen(process.env.PORT || 3001)

const port = process.env.PORT || 3001
console.log(`🦊 One Hour Dynasty API Server running at http://localhost:${port}`)
console.log(`📚 Swagger docs available at http://localhost:${port}/swagger`)

export type App = typeof app
