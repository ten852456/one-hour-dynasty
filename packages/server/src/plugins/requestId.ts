import { Elysia } from 'elysia'

/**
 * Request ID Plugin
 *
 * Adds a unique request ID to each incoming request for tracing and debugging.
 * The request ID is generated if not present in the headers, and is attached
 * to the request context for use in logs and error messages.
 */
export const requestId = () =>
  new Elysia({ name: 'plugin:request-id' }).derive(({ request }) => {
    // Check if request ID is already present in headers (from upstream/load balancer)
    const existingRequestId = request.headers.get('x-request-id')

    // Generate or use existing request ID
    const requestId = existingRequestId || crypto.randomUUID().slice(0, 8)

    return {
      requestId,
      // Add request ID to response headers for client-side tracking
      setResponseHeaders: (headers: Headers) => {
        headers.set('x-request-id', requestId)
      }
    }
  })

export default requestId
