'use client'

import { WagmiProvider as WagmiCoreProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/blockchain/config'
import { useState } from 'react'

/**
 * Wagmi Provider Component
 * Wraps the app with Web3 providers for blockchain interactions
 */
export function WagmiProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to prevent memory leaks during hot reload
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 minute
        gcTime: 300_000, // 5 minutes
      },
    },
  }))

  return (
    <WagmiCoreProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiCoreProvider>
  )
}
