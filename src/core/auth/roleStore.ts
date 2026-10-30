import { useSyncExternalStore } from 'react'
import { DEFAULT_ROLE, isRoleKey, type RoleKey } from './roles'

const KEY = 'opc_current_role'
const listeners = new Set<() => void>()

let currentRole: RoleKey = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (isRoleKey(raw)) return raw
  } catch { /* dùng mặc định */ }
  return DEFAULT_ROLE
})()

export const getCurrentRole = () => currentRole

export function setCurrentRole(role: RoleKey) {
  if (role === currentRole) return
  currentRole = role
  try { localStorage.setItem(KEY, role) } catch { /* bỏ qua */ }
  listeners.forEach((listener) => listener())
}

const subscribe = (callback: () => void) => {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

export function useCurrentRole() {
  return useSyncExternalStore(subscribe, getCurrentRole)
}
