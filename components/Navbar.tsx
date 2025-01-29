import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

const Navbar = () => {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, dbUser, signIn, signOut } = useAuth()

  // Handle navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav 
      className={`fixed w-full top-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-sm' 
          : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-xl hover:opacity-80 transition-opacity"
            >
              Bollyshaggers
            </Link>

            <div className="hidden md:flex space-x-1">
              {[
                { href: '/', label: 'Home' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/reviews', label: 'Reviews' },
                { href: '/polls', label: 'Polls' },
                { href: '/ranking', label: 'Ranking' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    router.pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - New Post and User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <Link
                href="/post/create"
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:opacity-90 transition-opacity shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Post</span>
              </Link>
            )}

            <div className="relative">
              {user && dbUser ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <img
                    src={dbUser.photo_url || DEFAULT_AVATAR}
                    alt="Profile"
                    className="w-full h-full object-cover bg-gray-100"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.src = DEFAULT_AVATAR
                    }}
                  />
                </button>
              ) : (
                <Link 
                  href={`/login?returnUrl=${encodeURIComponent(router.asPath)}`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Sign In
                </Link>
              )}

              {/* Dropdown Menu */}
              {showUserMenu && user && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-500 truncate">{dbUser?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 