const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add custom Jest configuration
const customJestConfig = {
  testEnvironment: 'jsdom',
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/types/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/__tests__/**',
    '!jest.config.js',
    '!next.config.js',
  ],
  // Test environment setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}',
  ],
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
  ],
  // Transform ESM modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(wagmi|viem|@wagmi|@tanstack/react-query)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)
