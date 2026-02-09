import { Elysia } from 'elysia'
import { Pool, PoolClient } from 'pg'
import config from '../config/index.js'

/**
 * Database interface for type safety
 */
export interface Database {
  query(text: string, params?: any[]): Promise<any>
  connect(): Promise<PoolClient>
  end(): Promise<void>
  transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>
}

// Create PostgreSQL connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export const database = () => new Elysia({ name: 'plugin:database' })
  .derive(() => {
    return {
      db: {
        query: (text: string, params?: any[]) => pool.query(text, params),
        connect: () => pool.connect(),
        end: () => pool.end(),
        transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
          const client = await pool.connect()
          try {
            await client.query('BEGIN')
            const result = await callback(client)
            await client.query('COMMIT')
            return result
          } catch (error) {
            await client.query('ROLLBACK')
            throw error
          } finally {
            client.release()
          }
        }
      } as Database
    }
  })
  .onStart(async () => {
    try {
      const client = await pool.connect()
      console.log('✅ Database connected successfully')
      client.release()
    } catch (error) {
      console.warn('⚠️  Database connection failed - starting server anyway:', error)
      console.warn('   The server will run but database features will not work')
    }
  })
  .onStop(() => {
    pool.end()
    console.log('Database connection pool closed')
  })
