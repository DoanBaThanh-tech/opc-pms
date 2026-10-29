import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import logoFull from '@/assets/logo-full.png'
import { cn } from '@/core/utils/format'
import { navItems } from './navItems'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <div className="hex-pattern pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-brand-500 to-brand-300" />
      <div className="relative px-5 pb-6 pt-6">
        <div className="rounded-2xl bg-white p-3 shadow-soft">
          <img src={logoFull} alt="OPC – Thiên nhiên & Cuộc sống" className="h-auto w-full" />
        </div>
      </div>

      <nav className="scrollbar-thin relative flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Quản lý</p>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} onClick={onNavigate} className="relative block">
            {({ isActive }) => (
              <span className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-white' : 'text-ink/80 hover:bg-brand-50 hover:text-brand-700',
              )}>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-linear-to-r from-brand-600 to-brand-500 shadow-[0_8px_20px_-8px_rgb(2_132_199/0.8)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative size-5 shrink-0" />
                <span className="relative">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <p className="relative border-t border-line px-5 py-4 text-xs text-muted">© OPC Pharmaceutical</p>
    </div>
  )
}
