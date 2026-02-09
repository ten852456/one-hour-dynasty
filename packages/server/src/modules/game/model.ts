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
