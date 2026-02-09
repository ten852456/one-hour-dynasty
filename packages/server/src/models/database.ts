/**
 * Database connection pool module
 * Provides PostgreSQL connection pooling with pg library
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config/index.js';

/**
 * Database connection pool configuration
 */
const poolConfig = {
  // Connection limits
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds

  // Connection retry
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established

  // PostgreSQL configuration
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,

  // Additional settings
  statement_timeout: 10000, // Cancel queries that run longer than 10 seconds
  query_timeout: 10000, // Return error after 10 seconds if query not completed
};

/**
 * PostgreSQL connection pool
 */
export const pool = new Pool(poolConfig);

/**
 * Pool event handlers
 */
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  // Log connection in development mode
  if (config.nodeEnv === 'development') {
    console.log('New client connected to PostgreSQL');
  }
});

pool.on('remove', () => {
  // Log disconnection in development mode
  if (config.nodeEnv === 'development') {
    console.log('Client removed from pool');
  }
});

/**
 * Execute a SQL query with parameters
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult<any>> {
  const start = Date.now();

  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries in development
    if (config.nodeEnv === 'development' && duration > 100) {
      console.log('Slow query:', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', { text, params, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns Pool client
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Execute a function within a transaction
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');

    // Log transaction rollback for debugging
    console.error('❌ Transaction rolled back due to error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 * @returns true if database is healthy, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get pool statistics
 * @returns Pool statistics object
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Close all connections in the pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
}

/**
 * Initialize database connection
 * Call this during application startup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    await healthCheck();
    console.log('Database connection established successfully');
    console.log('Database config:', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export default {
  pool,
  query,
  getClient,
  transaction,
  healthCheck,
  getPoolStats,
  closePool,
  initializeDatabase,
};
