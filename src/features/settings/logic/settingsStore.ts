import { useSyncExternalStore } from 'react'

export interface AppSettings { pageSize: number; displayName: string }

const KEY = 'opc_settings'
const defaults: AppSettings = { pageSize: 10, displayName: 'Người dùng' }
const listeners = new Set<() => void>()

let state: AppSettings = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch { /* dùng mặc định */ }
  return defaults
})()

export const getSettings = () => state

export function updateSettings(patch: Partial<AppSettings>) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* bỏ qua */ }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }
export const useSettings = () => useSyncExternalStore(subscribe, getSettings)
