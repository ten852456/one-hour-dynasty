import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-red-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl">⚔️</span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-yellow-500 group-hover:text-yellow-400 transition-colors">
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
              📜 Docs
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-yellow-500 hover:bg-red-950/30 transition-all"
            >
              🎮 Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
