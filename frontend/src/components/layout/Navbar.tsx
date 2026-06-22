import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router'
import { ChevronDown, Menu, X } from 'lucide-react'
import { navigation, type NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'

// ─── Root Navbar ──────────────────────────────────────────────────────────────

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-deep-green border-b border-white/10">
      <nav
        className="max-w-screen-xl mx-auto px-6 h-16 flex items-center gap-2"
        aria-label="Main navigation"
      >
        {/* ── Logo ── */}
        <NavLink
          to="/"
          className="flex items-center gap-2.5 shrink-0 mr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green rounded-md"
          aria-label="Scalystic AI home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white overflow-hidden ring-1 ring-white/10">
            <img src="/scalystic_logo_only.png" alt="Scalystic logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-off-white font-bold text-sm leading-tight">
              Scalystic AIOS
            </span>
            <span className="text-mint-green text-[10px] font-semibold tracking-wider">
              Ved Sanjeevani
            </span>
          </div>
        </NavLink>

        {/* ── Desktop nav items ── */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {navigation.map((item) =>
            item.children ? (
              <DropdownNavItem key={item.id} item={item} />
            ) : (
              <TopLevelLink key={item.id} item={item} />
            )
          )}
        </div>

        {/* ── Right side (desktop) ── */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <UserAvatar />
        </div>

        {/* ── Mobile toggle ── */}
        <button
          type="button"
          className="md:hidden ml-auto p-2 rounded-md text-off-white/70 hover:text-off-white hover:bg-white/5 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div
          className="md:hidden bg-forest-green border-t border-white/10 px-3 py-2 space-y-0.5"
          role="menu"
        >
          {navigation.map((item) =>
            item.children ? (
              <MobileParentItem key={item.id} item={item} />
            ) : (
              <MobileLinkItem key={item.id} item={item} />
            )
          )}
        </div>
      )}
    </header>
  )
}

// ─── Desktop: top-level link (no children) ────────────────────────────────────

function TopLevelLink({ item }: { item: NavItem }) {
  if (!item.path) return null
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green',
          isActive
            ? 'text-mint-green'
            : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

// ─── Desktop: parent item with dropdown ───────────────────────────────────────

function DropdownNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const isParentActive = item.children?.some((c) =>
    location.pathname.startsWith(c.path)
  )

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Close on navigation
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green',
          isParentActive
            ? 'text-mint-green'
            : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {item.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-2 w-52 rounded-xl bg-forest-green border border-white/10 shadow-xl shadow-black/40 py-1.5 overflow-hidden"
        >
          {item.children?.map((child) => (
            <NavLink
              key={child.id}
              to={child.path}
              role="menuitem"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:bg-white/10',
                  isActive
                    ? 'text-mint-green bg-white/5'
                    : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
                )
              }
            >
              {child.icon ? (
                <child.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <span className="h-4 w-4 shrink-0 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                </span>
              )}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile: top-level link ───────────────────────────────────────────────────

function MobileLinkItem({ item }: { item: NavItem }) {
  if (!item.path) return null
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      role="menuitem"
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer',
          isActive
            ? 'text-mint-green bg-white/5'
            : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

// ─── Mobile: parent item (always expanded) ────────────────────────────────────

function MobileParentItem({ item }: { item: NavItem }) {
  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <item.icon className="h-4 w-4 text-off-white/40" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-widest text-off-white/40">
          {item.label}
        </span>
      </div>

      {/* Children */}
      <div className="space-y-0.5">
        {item.children?.map((child) => (
          <NavLink
            key={child.id}
            to={child.path}
            role="menuitem"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 pl-9 pr-3 py-2.5 rounded-lg text-sm transition-colors duration-150 cursor-pointer',
                isActive
                  ? 'text-mint-green bg-white/5 font-medium'
                  : 'text-off-white/60 hover:text-off-white hover:bg-white/5'
              )
            }
          >
            {child.icon ? (
              <child.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 shrink-0 ml-1" />
            )}
            {child.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

// ─── User avatar (right side placeholder) ─────────────────────────────────────

function UserAvatar() {
  return (
    <button
      type="button"
      className="h-8 w-8 rounded-full bg-forest-green ring-1 ring-white/20 flex items-center justify-center text-off-white text-xs font-semibold cursor-pointer hover:ring-mint-green/60 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green"
      aria-label="User account"
    >
      A
    </button>
  )
}
