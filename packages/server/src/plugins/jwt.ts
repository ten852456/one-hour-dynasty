import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import config from '../config/index.js'

/**
 * Shared JWT plugin
 * Named to prevent re-execution across instances
 */
export const jwtPlugin = () => new Elysia({ name: 'plugin:jwt' })
  .use(jwt({
    name: 'jwt',
    secret: config.jwt.secret
  }))
  .derive(({ jwt, headers, set }) => {
    return {
      /**
       * Verify JWT and return payload
       * Throws error with appropriate status if invalid
       */
      verifyAuth: async () => {
        const authHeader = headers.authorization
        if (!authHeader) {
          set.status = 401
          throw new Error('Missing authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const payload = await jwt.verify(token)

        if (!payload) {
          set.status = 401
          throw new Error('Invalid token')
        }

        return payload
      }
    }
  })

