/**
 * ABI JSON module declarations
 * Allows importing JSON files with proper type safety
 */

declare module '*.json' {
  const value: {
    abi: readonly unknown[]
    [key: string]: unknown
  }
  export default value
}

export {}
