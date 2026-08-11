import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const NAV_ITEMS = [
  { to: '/', label: '首页' },
  { to: '/library', label: '声音库' },
  { to: '/map', label: '声音地图' },
  { to: '/create', label: '声音实验室' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 transition-colors group-hover:bg-amber-400/20">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-amber-400">声纹</span>
              <span className="text-white/80">遗产库</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* User button */}
            {user ? (
              <Link
                to="/user/me"
                className={`ml-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  location.pathname.startsWith('/user')
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                👤 {user.name || user.email}
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="ml-2 rounded-lg px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                登录
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/5"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md animate-fade-in">
            <div className="flex flex-col px-4 py-3 gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-400/10 text-amber-400'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              {user ? (
                <Link
                  to="/user/me"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5"
                >
                  👤 个人空间
                </Link>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-amber-400 text-left"
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
