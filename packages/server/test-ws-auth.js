/**
 * Authenticated WebSocket Test Client
 * Tests WebSocket connection with JWT authentication
 */

import WebSocket from 'ws'

const TEST_GAME_ID = '00000000-0000-0000-0000-000000000001'

// First, get a JWT token by joining
console.log('Step 1: Getting JWT token...')

async function getAuthToken() {
  const response = await fetch('http://localhost:3001/api/v1/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'test-agent-ws',
      agentName: 'WebSocket Test Agent',
      erc8004TokenId: '12345'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get auth token')
  }

  const data = await response.json()
  return data.token
}

async function testWebSocketAuth() {
  const token = await getAuthToken()
  console.log('   Token:', token.substring(0, 20) + '...')

  // WebSocket URL with token as query parameter
  const WS_URL = `ws://localhost:3001/api/v1/ws/game/${TEST_GAME_ID}?token=${token}`

  console.log(`\n🔌 Step 2: Connecting to WebSocket...`)

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)

    ws.on('open', () => {
      console.log('✅ WebSocket connected with authentication!')

      // Test 1: Send ping
      console.log('\n📤 Sending ping...')
      ws.send(JSON.stringify({ type: 'ping' }))

      // Wait a bit then send subscribe
      setTimeout(() => {
        console.log('\n📤 Sending subscribe...')
        ws.send(JSON.stringify({ type: 'subscribe' }))

        // Wait a bit then close
        setTimeout(() => {
          console.log('\n📤 Sending unsubscribe...')
          ws.send(JSON.stringify({ type: 'unsubscribe' }))
          // Wait for close
        }, 1000)
      }, 500)
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)
        console.log(`📥 Received:`, message)

        if (message.type === 'connected') {
          console.log(`   ✅ Successfully authenticated and connected to game ${message.gameId}`)
          console.log(`   Socket ID: ${message.socketId}`)
          console.log(`   Agent ID: ${message.agentId}`)
        } else if (message.type === 'pong') {
          console.log(`   ✅ Ping/pong successful`)
        } else if (message.type === 'subscribed') {
          console.log(`   ✅ Subscribed to game updates`)
        } else if (message.type === 'unsubscribed') {
          console.log(`   ✅ Unsubscribed from game`)
        }
      } catch (error) {
        console.log(`📥 Received (raw):`, data.toString())
      }
    })

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message)
      reject(error)
    })

    ws.on('close', (code, reason) => {
      console.log(`\n🔌 WebSocket disconnected`)
      console.log(`   Code: ${code}`)
      console.log(`   Reason: ${reason || 'None'}`)

      if (code === 1000) {
        console.log('\n✅ All WebSocket tests passed with authentication!')
        resolve(true)
      } else {
        console.log('\n⚠️  WebSocket disconnected with unexpected code:', code)
        reject(new Error(`Unexpected close code: ${code}`))
      }
    })

    // Timeout
    setTimeout(() => {
      console.error('\n❌ WebSocket test timed out')
      ws.close()
      reject(new Error('Test timed out'))
    }, 10000)
  })
}

testWebSocketAuth()
  .then(() => {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message)
    process.exit(1)
  })
