/**
 * Global type declarations
 */

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isTrust?: boolean
      isCoinbaseWallet?: boolean
      request: (args: { method: string; params?: Array<any> }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
      selectedAddress?: string
      networkVersion?: string
      chainId?: string
    }
  }

  // Allow importing JSON files with type safety
  interface ImportMetaEnv {
    readonly NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string
    readonly NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS: string
    readonly NEXT_PUBLIC_ITEM_STORE_ADDRESS: string
    readonly NEXT_PUBLIC_STAKING_ADDRESS: string
    readonly NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS: string
    readonly NEXT_PUBLIC_CHAIN_ID: string
    readonly NEXT_PUBLIC_RPC_URL?: string
    readonly NEXT_PUBLIC_EXPLORER_URL?: string
    readonly NEXT_PUBLIC_TOKEN_DECIMALS?: string
    readonly NEXT_PUBLIC_MIN_STAKE_AMOUNT?: string
    readonly NEXT_PUBLIC_MAX_STAKE_AMOUNT?: string
    readonly NEXT_PUBLIC_LOCK_DURATIONS?: string
    readonly NEXT_PUBLIC_FAUCET_URL?: string
    readonly NEXT_PUBLIC_AGENT_FAUCET_URL?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
