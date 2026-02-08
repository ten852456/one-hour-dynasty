/**
 * Configuration module for the One Hour Dynasty server
 * Centralizes all environment variables and provides type-safe access
 */

export interface Config {
  // Server
  port: number;
  nodeEnv: string;
  logLevel: string;

  // Database
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };

  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
  };

  // Monad
  monad: {
    rpcUrl: string;
    payToAddress: string;
  };

  // x402
  x402: {
    facilitatorUrl: string;
    network: string;
  };

  // Game
  game: {
    queueTimeoutMs: number;
    gameTickMs: number;
    maxAgentsPerGame: number;
    minAgentsToStart: number;
    arenaEntryFeeMon: number;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

export const config: Config = {
  port: getEnvNumber('PORT', 3001),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),

  database: {
    host: getEnvVar('PGHOST', 'localhost'),
    port: getEnvNumber('PGPORT', 5432),
    database: getEnvVar('PGDATABASE', 'one_hour_dynasty'),
    user: getEnvVar('PGUSER', 'postgres'),
    password: getEnvVar('PGPASSWORD', 'postgres'),
  },

  jwt: {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: '24h',
  },

  monad: {
    rpcUrl: getEnvVar('MONAD_RPC_URL', 'https://testnet-rpc.monad.xyz/'),
    payToAddress: getEnvVar('PAY_TO_ADDRESS'),
  },

  x402: {
    facilitatorUrl: getEnvVar(
      'X402_FACILITATOR_URL',
      'https://x402-facilitator.molandak.org'
    ),
    network: getEnvVar('X402_NETWORK', 'eip155:10143'),
  },

  game: {
    queueTimeoutMs: getEnvNumber('QUEUE_TIMEOUT_MS', 300000), // 5 minutes
    gameTickMs: getEnvNumber('GAME_TICK_MS', 1000), // 1 second
    maxAgentsPerGame: getEnvNumber('MAX_AGENTS_PER_GAME', 8),
    minAgentsToStart: getEnvNumber('MIN_AGENTS_TO_START', 2),
    arenaEntryFeeMon: getEnvNumber('ARENA_ENTRY_FEE_MON', 10),
  },
};

export default config;
