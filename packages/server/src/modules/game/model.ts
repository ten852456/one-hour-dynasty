import { t } from 'elysia'

// Request DTOs
export const SubmitActionSchema = t.Object({
  gameId: t.String(),
  action: t.Object({
    type: t.Union([
      t.Literal('move'),
      t.Literal('attack'),
      t.Literal('defend'),
      t.Literal('rest'),
      t.Literal('special')
    ]),
    targetId: t.Optional(t.String()),
    metadata: t.Optional(t.Record(t.String(), t.Any()))
  })
})

// Response DTOs
export const GameStateSchema = t.Object({
  id: t.String(),
  tier: t.Union([t.Literal('bronze'), t.Literal('silver'), t.Literal('gold')]),
  phase: t.Union([
    t.Literal('waiting'),
    t.Literal('recruiting'),
    t.Literal('playing'),
    t.Literal('completed')
  ]),
  currentTick: t.Number(),
  maxAgents: t.Number(),
  currentAgents: t.Number(),
  arenaId: t.Number(),
  entryFeeMon: t.Number(),
  createdAt: t.Date(),
  startedAt: t.Optional(t.Date()),
  completedAt: t.Optional(t.Date())
})

export const GameActionResponseSchema = t.Object({
  id: t.String(),
  gameId: t.String(),
  agentId: t.String(),
  action: t.Object({
    type: t.String(),
    targetId: t.Optional(t.String()),
    metadata: t.Optional(t.Record(t.String(), t.Any()))
  }),
  tickNumber: t.Number(),
  submittedAt: t.Date()
})

// Types
export type SubmitActionDto = typeof SubmitActionSchema.static
export type GameState = typeof GameStateSchema.static
export type GameActionResponse = typeof GameActionResponseSchema.static

// WebSocket Message Schemas
export const WebSocketPingSchema = t.Object({
  type: t.Literal('ping')
})

export const WebSocketPongSchema = t.Object({
  type: t.Literal('pong'),
  gameId: t.String(),
  socketId: t.String(),
  timestamp: t.Number()
})

export const WebSocketSubscribeSchema = t.Object({
  type: t.Literal('subscribe')
})

export const WebSocketUnsubscribeSchema = t.Object({
  type: t.Literal('unsubscribe')
})

export const WebSocketConnectedSchema = t.Object({
  type: t.Literal('connected'),
  gameId: t.String(),
  socketId: t.String(),
  agentId: t.String(),
  timestamp: t.Number()
})

export const WebSocketSubscribedSchema = t.Object({
  type: t.Literal('subscribed'),
  gameId: t.String(),
  socketId: t.String(),
  timestamp: t.Number()
})

export const WebSocketUnsubscribedSchema = t.Object({
  type: t.Literal('unsubscribed'),
  gameId: t.String(),
  socketId: t.String(),
  timestamp: t.Number()
})

export const WebSocketEchoSchema = t.Object({
  type: t.Literal('echo'),
  gameId: t.String(),
  socketId: t.String(),
  timestamp: t.Number(),
  data: t.Optional(t.Any())
})

// Union of all incoming WebSocket message types
export const WebSocketIncomingMessageSchema = t.Union([
  WebSocketPingSchema,
  WebSocketSubscribeSchema,
  WebSocketUnsubscribeSchema
])

// Union of all outgoing WebSocket message types
export const WebSocketOutgoingMessageSchema = t.Union([
  WebSocketPongSchema,
  WebSocketConnectedSchema,
  WebSocketSubscribedSchema,
  WebSocketUnsubscribedSchema,
  WebSocketEchoSchema
])

export type WebSocketIncomingMessage = typeof WebSocketIncomingMessageSchema.static
export type WebSocketOutgoingMessage = typeof WebSocketOutgoingMessageSchema.static
