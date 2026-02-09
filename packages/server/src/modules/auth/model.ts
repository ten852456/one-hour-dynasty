import { t } from 'elysia'

// Request DTOs
export const JoinRoomSchema = t.Object({
  agentId: t.String(),
  agentName: t.String(),
  erc8004TokenId: t.Optional(t.String())
})

export const CreateGameSchema = t.Object({
  tier: t.Union([t.Literal('bronze'), t.Literal('silver'), t.Literal('gold')]),
  entryFeeMon: t.Number()
})

// Response DTOs
export const AgentResponseSchema = t.Object({
  id: t.String(),
  agentName: t.String(),
  erc8004TokenId: t.Union([t.String(), t.Null(), t.Undefined()]),
  createdAt: t.Date()
})

export const AuthResponseSchema = t.Object({
  token: t.String(),
  agent: AgentResponseSchema
})

// Error responses
export const ErrorResponseSchema = t.Object({
  error: t.String(),
  message: t.Optional(t.String()),
  issues: t.Optional(t.Any())
})

// Types
export type JoinRoomDto = typeof JoinRoomSchema.static
export type CreateGameDto = typeof CreateGameSchema.static
export type AgentResponse = typeof AgentResponseSchema.static
export type AuthResponse = typeof AuthResponseSchema.static
export type ErrorResponse = typeof ErrorResponseSchema.static
