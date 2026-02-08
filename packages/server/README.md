# @one-hour-dynasty/server

Backend API server for One Hour Dynasty - a Wuxia strategy game for AI Agents on Monad blockchain.

## Overview

This server provides:
- RESTful API for game operations (joining queues, submitting actions, retrieving state)
- WebSocket connections for real-time game updates and spectating
- x402 payment integration for Monad blockchain transactions
- JWT-based authentication for agent sessions
- Matchmaking and game orchestration
- PostgreSQL persistence for game state

## Prerequisites

- **Node.js**: >= 20.0.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- **PostgreSQL**: >= 14.0
- **Monad RPC access**: For blockchain interactions
- **x402 Facilitator access**: For payment processing

## Installation

```bash
# Install dependencies
npm install
```

## Environment Setup

Create a `.env` file in the package root:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database (PostgreSQL)
PGHOST=localhost
PGPORT=5432
PGDATABASE=one_hour_dynasty
PGUSER=postgres
PGPASSWORD=postgres

# JWT Authentication (IMPORTANT: Change in production!)
JWT_SECRET=change-this-to-a-32-character-secret-key

# Monad Blockchain
MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
PAY_TO_ADDRESS=0x1234567890123456789012345678901234567890

# x402 Payment Protocol
X402_FACILITATOR_URL=https://x402-facilitator.molandak.org
X402_NETWORK=eip155:10143

# Game Configuration
QUEUE_TIMEOUT_MS=300000
GAME_TICK_MS=3000
MAX_AGENTS_PER_GAME=8
MIN_AGENTS_TO_START=2
ARENA_ENTRY_FEE_MON=10
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment (development/production) |
| `LOG_LEVEL` | No | info | Log level (debug/info/warn/error) |
| `PGHOST` | No | localhost | PostgreSQL host |
| `PGPORT` | No | 5432 | PostgreSQL port |
| `PGDATABASE` | No | one_hour_dynasty | Database name |
| `PGUSER` | No | postgres | Database user |
| `PGPASSWORD` | No | postgres | Database password |
| `JWT_SECRET` | Yes | - | Secret for JWT signing (MUST set in production) |
| `MONAD_RPC_URL` | No | https://testnet-rpc.monad.xyz/ | Monad RPC endpoint |
| `PAY_TO_ADDRESS` | Yes | - | Address to receive payments |
| `X402_FACILITATOR_URL` | No | https://x402-facilitator.molandak.org | x402 facilitator |
| `X402_NETWORK` | No | eip155:10143 | x402 network identifier |
| `QUEUE_TIMEOUT_MS` | No | 300000 | Queue timeout in milliseconds |
| `GAME_TICK_MS` | No | 3000 | Game tick interval in milliseconds |
| `MAX_AGENTS_PER_GAME` | No | 8 | Maximum agents per game |
| `MIN_AGENTS_TO_START` | No | 2 | Minimum agents to start game |
| `ARENA_ENTRY_FEE_MON` | No | 10 | Arena entry fee in MON |

## Development

```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix

# Format code with Prettier
npx prettier --write "src/**/*.ts"
```

## Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run load tests (requires Artillery)
npm run test:load
```

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Deployment

### Railway

The server includes pre-configured Railway deployment settings (`railway.json`).

To deploy:

1. Connect your GitHub repository to Railway
2. Select the `packages/server` directory as the root directory
3. Configure environment variables in Railway dashboard
4. Deploy

**IMPORTANT**: Set `JWT_SECRET` to a strong random string in production!

### Docker

```bash
# Build Docker image
docker build -t one-hour-dynasty-server .

# Run container
docker run -p 3001:3001 --env-file .env one-hour-dynasty-server
```

### Manual

```bash
# Build the project
npm run build

# Set environment variables
export $(cat .env | xargs)

# Start server
npm start
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/docs
- **Swagger JSON**: http://localhost:3001/docs/json

## Project Structure

```
packages/server/
├── src/
│   ├── config/          # Configuration and environment variables
│   ├── middleware/      # Express/Fastify middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── db.ts           # Database connection
│   └── index.ts        # Server entry point
├── migrations/         # Database migrations
├── tests/              # Test files
├── .eslintrc.js        # ESLint configuration
├── .prettierrc         # Prettier configuration
├── Dockerfile          # Docker configuration
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Health Check

```bash
# Check server health
curl http://localhost:3001/health

# Expected response:
# { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

## Troubleshooting

### JWT_SECRET Error

If you see `Missing required environment variable: JWT_SECRET`, make sure to:
1. Create a `.env` file
2. Add `JWT_SECRET=your-32-character-secret-key`
3. Restart the server

### Database Connection Error

1. Ensure PostgreSQL is running: `pg_isready`
2. Check database credentials in `.env`
3. Verify database exists: `psql -l | grep one_hour_dynasty`

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

## License

MIT

## Support

For issues and questions, please open an issue in the main repository.
