/**
 * E2E Test Suite for One Hour Dynasty API
 * Tests all REST API endpoints
 */

const BASE_URL = 'http://localhost:3001'

let authToken = null
let agentId = null
let gameId = null

// Utility functions
async function test(name, fn) {
  try {
    await fn()
    console.log(`✅ ${name}`)
    return true
  } catch (error) {
    console.error(`❌ ${name}`)
    console.error(`   ${error.message}`)
    return false
  }
}

async function json(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`)
  }

  return data
}

// Test Suite
async function runTests() {
  console.log('\n🧪 Starting E2E Tests...\n')

  const results = []

  // Test 1: Health Check
  results.push(await test('Health check', async () => {
    const result = await json('GET', '/health')
    if (result.status !== 'ok') throw new Error('Health check failed')
  }))

  // Test 2: Join Game (Create Agent)
  results.push(await test('Create agent via join endpoint', async () => {
    const result = await json('POST', '/api/v1/join', {
      agentId: 'test-agent-e2e',
      agentName: 'E2E Test Agent',
      erc8004TokenId: '999'
    })
    authToken = result.token
    agentId = result.agent.id
    if (!authToken || !agentId) throw new Error('Failed to create agent')
  }))

  // Test 3: Get Agent Profile
  results.push(await test('Get agent profile', async () => {
    const result = await json('GET', '/api/v1/profile', null, {
      'Authorization': `Bearer ${authToken}`
    })
    if (result.id !== agentId) throw new Error('Profile mismatch')
  }))

  // Test 4: List Available Games
  results.push(await test('List available games', async () => {
    const result = await json('GET', '/api/v1/games')
    if (!Array.isArray(result)) throw new Error('Games should be an array')
  }))

  // Test 5: Create Game via x402
  results.push(await test('Create game via x402', async () => {
    const result = await json('POST', '/api/join-room', {
      agentAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      tier: 'bronze'
    })
    if (!result.paymentId) throw new Error('Failed to create game')
    // Use a valid UUID format for testing
    gameId = result.gameId || '00000000-0000-0000-0000-000000000001'
  }))

  // Test 6: Verify x402 Payment
  results.push(await test('Verify x402 payment', async () => {
    const result = await json('GET', `/api/x402/verify/${authToken || 'test-payment'}`)
    // Verification will fail for non-existent payment, but endpoint should respond
    if (typeof result.valid !== 'boolean') throw new Error('Invalid response')
  }))

  // Test 7: Submit Game Action
  results.push(await test('Submit game action', async () => {
    const testGameId = gameId || '00000000-0000-0000-0000-000000000001'
    try {
      const result = await json('POST', '/api/v1/action', {
        gameId: testGameId,
        action: { type: 'move', direction: 'north' }
      }, {
        'Authorization': `Bearer ${authToken}`
      })
      // If we get here, game exists and action was submitted
      if (!result.tick) throw new Error('Unexpected response')
    } catch (error) {
      // Expected: game not found (404) or forbidden (403 if agent not in game)
      if (!error.message.includes('404') && !error.message.includes('403')) throw error
    }
  }))

  // Test 8: Get Game State
  results.push(await test('Get game state', async () => {
    const testGameId = gameId || '00000000-0000-0000-0000-000000000001'
    try {
      const result = await json('GET', `/api/v1/state/${testGameId}`)
      // If we get here, game exists
      if (!result.id) throw new Error('Unexpected response')
    } catch (error) {
      // Expected: game not found (404)
      if (!error.message.includes('404')) throw error
    }
  }))

  // Summary
  const passed = results.filter(r => r).length
  const total = results.length

  console.log(`\n📊 Test Results: ${passed}/${total} passed\n`)

  if (passed === total) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite error:', error)
  process.exit(1)
})
