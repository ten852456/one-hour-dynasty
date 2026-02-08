'use client'

import { useWalletConnection } from '@/lib/blockchain/hooks/useWalletConnection'
import { useState } from 'react'

/**
 * Wallet Connection Component - Wuxia Themed
 * Displays connect button, address, balance, and chain info
 */
export function WalletConnection() {
  const {
    address,
    shortAddress,
    isConnected,
    isPending,
    balanceFormatted,
    isCorrectChain,
    connectWallet,
    disconnectWallet,
  } = useWalletConnection()

  const [showWalletMenu, setShowWalletMenu] = useState(false)

  if (isConnected) {
    return (
      <div className="relative">
        {/* Account Button */}
        <button
          onClick={() => setShowWalletMenu(!showWalletMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-900/50 border border-red-500/30"
        >
          <div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]'}`} />
          <span className="font-medium">{shortAddress}</span>
          <span className="text-yellow-200 text-sm">{balanceFormatted}</span>
        </button>

        {/* Wallet Menu Dropdown */}
        {showWalletMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowWalletMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-red-950/50 to-black border-2 border-red-900/50 rounded-lg shadow-2xl shadow-red-900/50 z-20 p-4 backdrop-blur-sm">
              {/* Network Warning */}
              {!isCorrectChain && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]">
                    ⚠️ Wrong Realm
                  </p>
                  <p className="text-yellow-400/80 text-xs mt-1">
                    Please switch to Monad Testnet
                  </p>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-900/30">
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-semibold text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">Sect Treasury</h3>
              </div>

              {/* Address */}
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <span className="text-yellow-400">✦</span>
                  Identity
                </p>
                <p className="text-white font-mono text-sm break-all bg-black/50 p-2 rounded border border-red-900/30">{address}</p>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <span className="text-yellow-400">✦</span>
                  Balance
                </p>
                <p className="text-white font-medium text-lg">{balanceFormatted} MON</p>
              </div>

              {/* Chain Status */}
              <div className="mb-4 p-2 bg-black/50 border border-red-900/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Realm</span>
                  <span className={`text-sm font-medium ${isCorrectChain ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isCorrectChain ? '✓ Monad Testnet' : '⚠️ Wrong Network'}
                  </span>
                </div>
              </div>

              {/* Disconnect */}
              <button
                onClick={() => {
                  disconnectWallet()
                  setShowWalletMenu(false)
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-900/50 font-medium border border-red-500/30"
              >
                Sever Connection
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Not connected - show connect button
  return (
    <button
      onClick={() => connectWallet()}
      disabled={isPending}
      className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none border border-yellow-500/30"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Connecting...
        </span>
      ) : (
        <span>Join Sect</span>
      )}
    </button>
  )
}
