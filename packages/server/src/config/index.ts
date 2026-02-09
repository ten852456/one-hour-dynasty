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
    // No default - force explicit configuration for security
    secret: getEnvVar('JWT_SECRET', ''),
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
    gameTickMs: getEnvNumber('GAME_TICK_MS', 3000), // 3 seconds - LLM friendly
    maxAgentsPerGame: getEnvNumber('MAX_AGENTS_PER_GAME', 8),
    minAgentsToStart: getEnvNumber('MIN_AGENTS_TO_START', 2),
    arenaEntryFeeMon: getEnvNumber('ARENA_ENTRY_FEE_MON', 10),
  },
};

/**
 * Validates configuration for production environment
 * Call this during server startup to ensure all required settings are properly configured
 * @throws {Error} If production configuration is invalid
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // JWT secret validation - always required
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push(
      'JWT_SECRET must be set to a secure value with at least 32 characters'
    );
  }

  // Production-specific validation
  if (config.nodeEnv === 'production') {
    // Required blockchain configuration
    if (!config.monad.payToAddress || config.monad.payToAddress.length === 0) {
      errors.push('PAY_TO_ADDRESS must be set in production');
    }

    // Validate Ethereum address format
    if (
      config.monad.payToAddress &&
      !/^0x[a-fA-F0-9]{40}$/.test(config.monad.payToAddress)
    ) {
      errors.push('PAY_TO_ADDRESS must be a valid Ethereum address');
    }
  }

  // Game configuration validation
  if (config.game.minAgentsToStart < 1) {
    errors.push('MIN_AGENTS_TO_START must be at least 1');
  }

  if (config.game.maxAgentsPerGame < config.game.minAgentsToStart) {
    errors.push(
      'MAX_AGENTS_PER_GAME must be greater than or equal to MIN_AGENTS_TO_START'
    );
  }

  if (config.game.gameTickMs < 1000) {
    errors.push('GAME_TICK_MS must be at least 1000 (1 second)');
  }

  if (config.game.queueTimeoutMs < 60000) {
    errors.push('QUEUE_TIMEOUT_MS must be at least 60000 (1 minute)');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

export default config;
