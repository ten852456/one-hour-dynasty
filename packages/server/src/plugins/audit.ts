/**
 * Audit logging plugin
 * Logs critical security-relevant operations for compliance and debugging
 */
import { Elysia } from 'elysia'
import config from '../config/index.js'

export const audit = () => new Elysia({ name: 'plugin:audit' })
  .derive(({ set }) => {
    return {
      auditLog: async (event: string, data: Record<string, any>) => {
        const auditEntry = {
          timestamp: new Date().toISOString(),
          environment: config.nodeEnv,
          event,
          ...data
        }

        // In production, send to audit logging service
        // For now, log to console with structured format
        if (config.nodeEnv === 'production') {
          console.log('🔍 AUDIT:', JSON.stringify(auditEntry))
        } else {
          console.log('🔍 AUDIT:', auditEntry)
        }
      }
    }
  })
