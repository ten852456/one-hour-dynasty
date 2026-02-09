import { t } from 'elysia'

// Request DTOs
export const X402PaymentRequestSchema = t.Object({
  gameId: t.Optional(t.String()),
  tier: t.Optional(t.Union([t.Literal('bronze'), t.Literal('silver'), t.Literal('gold')])),
  agentAddress: t.String()
})

export const X402WebhookSchema = t.Object({
  paymentId: t.String(),
  status: t.Union([t.Literal('completed'), t.Literal('failed')]),
  transactionHash: t.String(),
  amount: t.String(),
  agentAddress: t.String()
})

// Response DTOs
export const X402PaymentResponseSchema = t.Object({
  paymentId: t.String(),
  facilitatorUrl: t.String(),
  amount: t.String(),
  recipientAddress: t.String(),
  network: t.String(),
  status: t.Literal('pending')
})

// Types
export type X402PaymentRequest = typeof X402PaymentRequestSchema.static
export type X402Webhook = typeof X402WebhookSchema.static
export type X402PaymentResponse = typeof X402PaymentResponseSchema.static
