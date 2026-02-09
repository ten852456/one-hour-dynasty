/**
 * WebSocket Test Client
 * Tests WebSocket connection to the game server
 */

import WebSocket from 'ws'

const TEST_GAME_ID = '00000000-0000-0000-0000-000000000001'
const WS_URL = `ws://localhost:3001/api/v1/ws/game/${TEST_GAME_ID}`

console.log(`🔌 Connecting to ${WS_URL}...`)

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
  console.log('✅ WebSocket connected')

  // Test 1: Send ping
  console.log('\n📤 Sending ping...')
  ws.send(JSON.stringify({ type: 'ping' }))

  // Wait a bit then send subscribe
  setTimeout(() => {
    console.log('\n📤 Sending subscribe...')
    ws.send(JSON.stringify({ type: 'subscribe' }))
  }, 500)

  // Wait a bit then close
  setTimeout(() => {
    console.log('\n📤 Sending unsubscribe...')
    ws.send(JSON.stringify({ type: 'unsubscribe' }))
  }, 1500)
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data)
    console.log(`📥 Received:`, message)

    if (message.type === 'connected') {
      console.log(`   ✅ Successfully connected to game ${message.gameId}`)
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
})

ws.on('close', (code, reason) => {
  console.log(`\n🔌 WebSocket disconnected`)
  console.log(`   Code: ${code}`)
  console.log(`   Reason: ${reason.toString() || 'None'}`)

  if (code === 1000) {
    console.log('\n✅ All WebSocket tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  WebSocket closed with unexpected code')
    process.exit(1)
  }
})

// Timeout after 5 seconds
setTimeout(() => {
  console.error('\n❌ WebSocket test timed out')
  ws.close()
  process.exit(1)
}, 5000)
