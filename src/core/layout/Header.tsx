import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import logoIcon from '@/assets/logo-icon.png'
import { useSettings } from '@/features/settings/logic/settingsStore'
import { navItems } from './navItems'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { displayName } = useSettings()
  const current = navItems.find((n) => pathname.startsWith(n.path))

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/70 bg-white/80 px-4 backdrop-blur-xl md:px-8">
      <button onClick={onMenu} aria-label="Mở menu" className="rounded-xl p-2 text-brand-700 transition hover:bg-brand-50 lg:hidden">
        <Menu className="size-6" />
      </button>
      <img src={logoIcon} alt="" className="size-8 lg:hidden" />
      <div className="min-w-0">
        <p className="hidden text-xs text-muted sm:block">Hệ thống quản lý sản phẩm</p>
        <p className="truncate text-sm font-bold text-brand-900 sm:text-base">{current?.label ?? 'OPC'}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-sm font-medium sm:block">{displayName}</span>
        <span className="grid size-9 place-items-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 text-sm font-bold text-white">{displayName.trim().charAt(0).toUpperCase() || 'U'}</span>
      </div>
    </header>
  )
}
