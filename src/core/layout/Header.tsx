import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import logoIcon from '@/assets/logo-icon.png'
import { ROLE_ORDER, roleMeta } from '@/core/auth/roles'
import { setCurrentRole, useCurrentRole } from '@/core/auth/roleStore'
import { useSettings } from '@/features/settings/logic/settingsStore'
import { navItems } from './navItems'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { displayName } = useSettings()
  const role = useCurrentRole()
  const currentRole = roleMeta(role)
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
        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-xs font-semibold text-brand-900">{currentRole.name}</p>
          <p className="truncate text-[10px] text-muted">{currentRole.team}</p>
        </div>
        <label className="relative">
          <span className="sr-only">Vai trò hiện tại</span>
          <select
            value={role}
            onChange={(e) => setCurrentRole(e.target.value as typeof role)}
            className="max-w-[9.5rem] cursor-pointer rounded-xl border border-line bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold text-brand-800 shadow-sm transition hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {ROLE_ORDER.map((key) => (
              <option key={key} value={key}>{roleMeta(key).name}</option>
            ))}
          </select>
        </label>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 text-sm font-bold text-white" title={displayName}>
          {currentRole.short.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  )
}
