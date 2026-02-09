import { Elysia } from 'elysia'

import config from '../config/index.js'

/**
 * Logger plugin with proper hook order
 * IMPORTANT: derive must come BEFORE hooks that use its values
 * Reference: SKILL.md - "Order Matters" section
 */
export const logger = () => new Elysia({ name: 'plugin:logger' })
  .derive(({ set }) => {
    // Set start time FIRST, before other hooks use it
    if (config.logLevel !== 'none') {
      set.headers['x-start-time'] = Date.now().toString()
    }
    return {}
  })
  .onBeforeHandle(({ request, path }) => {
    if (config.logLevel === 'debug' || config.logLevel === 'info') {
      console.log(`→ ${request.method} ${path}`)
    }
  })
  .onAfterHandle(({ request, path, set }) => {
    if (config.logLevel === 'debug' || config.logLevel === 'info') {
      const startTime = parseInt(set.headers['x-start-time'] as string || '0')
      const duration = Date.now() - startTime
      console.log(`← ${request.method} ${path} ${set.status} (${duration}ms)`)
    }
  })
  .onError(({ request, path, error }) => {
    if (config.logLevel !== 'none') {
      console.error(`✖ ${request.method} ${path}`, error)
    }
  })
