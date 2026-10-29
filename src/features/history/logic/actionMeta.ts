import type { HistoryAction } from './historyApi'

export const ACTION_META: Record<HistoryAction, { label: string; dot: string }> = {
  created: { label: 'Tạo mới', dot: 'bg-brand-500' },
  updated: { label: 'Cập nhật', dot: 'bg-slate-400' },
  submitted: { label: 'Gửi duyệt', dot: 'bg-amber-500' },
  approved: { label: 'Phê duyệt', dot: 'bg-emerald-500' },
  rejected: { label: 'Từ chối', dot: 'bg-opc-red' },
  discontinued: { label: 'Ngừng', dot: 'bg-slate-600' },
}
export const ACTION_OPTIONS = (Object.keys(ACTION_META) as HistoryAction[]).map((a) => ({ value: a, label: ACTION_META[a].label }))
