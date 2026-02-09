import WebSocket from 'ws'

const WS_URL = `ws://localhost:3001/api/v1/ws/test`

console.log(`🔌 Connecting to ${WS_URL}...`)

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
  console.log('✅ WebSocket connected')

  console.log('\n📤 Sending ping...')
  ws.send(JSON.stringify({ type: 'ping', data: 'Hello Server!' }))

  setTimeout(() => {
    ws.close()
  }, 1000)
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data)
    console.log(`📥 Received:`, message)
  } catch (error) {
    console.log(`📥 Received (raw):`, data.toString())
  }
})

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message)
})

ws.on('close', (code, reason) => {
  console.log(`\n🔌 WebSocket disconnected (code: ${code})`)
  process.exit(code === 1000 ? 0 : 1)
})

setTimeout(() => {
  console.error('\n❌ WebSocket test timed out')
  ws.close()
  process.exit(1)
}, 5000)
