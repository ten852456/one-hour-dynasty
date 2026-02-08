'use client'

import Link from 'next/link'
import Image from 'next/image'
import { WalletConnection } from './WalletConnection'

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-red-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="One Hour Dynasty"
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] transition-all">
                One Hour Dynasty
              </span>
              <span className="text-xs text-gray-500">The Samsara Chronicles</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-yellow-500 hover:bg-red-950/30 transition-all"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-yellow-500 hover:bg-red-950/30 transition-all"
            >
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-yellow-500 hover:bg-red-950/30 transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/blockchain"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-yellow-500 hover:bg-red-950/30 transition-all"
            >
              Treasury
            </Link>
            <WalletConnection />
          </div>
        </div>
      </div>
    </nav>
  )
}
