import 'dotenv/config'
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { rateLimit } from 'elysia-rate-limit'
import { logger } from './plugins/logger.js'
import { database } from './plugins/database.js'
import { jwtPlugin } from './plugins/jwt.js'
import { audit } from './plugins/audit.js'
import { requestId } from './plugins/requestId.js'
import { validateConfig } from './config/index.js'
import { authRoutes } from './modules/auth/index.js'
import { gameRoutes } from './modules/game/index.js'
import { x402Routes } from './modules/x402/index.js'
import { isAppError } from './utils/errors.js'

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
  .use(requestId())
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
  // Add request ID to all response headers
  .onAfterHandle(({ set, requestId }) => {
    set.headers['x-request-id'] = requestId
  })
  // Global error handler
  .onError(({ code, error, set, requestId }) => {
    console.error('Error:', error)

    // Add request ID to response headers
    set.headers['x-request-id'] = requestId

    // Handle Elysia's built-in error codes
    if (code === 'VALIDATION') {
      set.status = 400
      return {
        error: 'Validation failed',
        issues: (error as any).all,
        requestId
      }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        error: 'Not found',
        requestId
      }
    }

    // Handle custom AppError instances with instanceof
    if (isAppError(error)) {
      set.status = (error as any).statusCode

      // Sanitize error messages in production
      if (config.nodeEnv === 'production') {
        return {
          error: (error as any).code,
          requestId
        }
      } else {
        return {
          error: (error as any).code,
          message: (error as Error).message,
          requestId
        }
      }
    }

    // Handle unknown errors
    set.status = 500
    if (config.nodeEnv === 'production') {
      return {
        error: 'INTERNAL_ERROR',
        requestId
      }
    } else {
      return {
        error: 'INTERNAL_ERROR',
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
