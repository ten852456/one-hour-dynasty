/**
 * TransactionStatus Component
 * Displays transaction status with loading, success, and error states
 */

'use client'

import { useEffect } from 'react'

export interface TransactionStatusProps {
  isPending?: boolean
  success?: string | null
  error?: string | null
  txHash?: string | null
  explorerUrl?: string
  onClear?: () => void
}

export function TransactionStatus({
  isPending = false,
  success,
  error,
  txHash,
  explorerUrl = '',
  onClear,
}: TransactionStatusProps) {
  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (success && onClear) {
      const timer = setTimeout(() => {
        onClear()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, onClear])

  if (!isPending && !success && !error) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {isPending && (
        <div className="bg-black border border-yellow-600 text-yellow-500 px-4 py-3 rounded shadow-lg" role="status">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full" />
            <div>
              <p className="font-semibold">Transaction Pending</p>
              <p className="text-sm text-yellow-600">Please confirm in your wallet...</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-black border border-green-600 text-green-500 px-4 py-3 rounded shadow-lg" role="status">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Success!</p>
                <p className="text-sm text-green-600">{success}</p>
                {txHash && explorerUrl && (
                  <a
                    href={`${explorerUrl}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline hover:text-green-400"
                  >
                    View transaction
                  </a>
                )}
              </div>
            </div>
            {onClear && (
              <button
                onClick={onClear}
                className="text-green-500 hover:text-green-400"
                aria-label="Close notification"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-black border border-red-600 text-red-500 px-4 py-3 rounded shadow-lg" role="alert">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Transaction Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            {onClear && (
              <button
                onClick={onClear}
                className="text-red-500 hover:text-red-400"
                aria-label="Close notification"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
