'use client'

import React from 'react'
import { Component, ErrorInfo, ReactNode } from 'react'

/**
 * Props for ErrorBoundary
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * State for ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays fallback UI
 * Essential for blockchain components where wallet/transaction errors can occur
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-b from-black via-red-950/10 to-black flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-gradient-to-br from-red-950/50 to-black border-2 border-red-900/50 rounded-xl p-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                Something Went Wrong
              </h2>
              <p className="text-gray-400 mb-6">
                {this.state.error?.message || 'An unexpected error occurred while processing your request.'}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all hover:scale-105 border border-red-500/30"
                  aria-label="Try again"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-transparent border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 rounded-lg font-medium transition-all"
                  aria-label="Reload page"
                >
                  Reload Page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400 mb-2">
                    Technical Details (Dev Mode)
                  </summary>
                  <pre className="text-xs text-red-300 bg-black/50 p-3 rounded overflow-auto max-h-40 border border-red-900/30">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
