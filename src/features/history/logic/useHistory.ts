import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDate, norm } from '@/core/utils/format'
import { historyApi, type HistoryEntry } from './historyApi'

export function useHistory() {
  const { data = [], isLoading } = useQuery({ queryKey: ['history'], queryFn: historyApi.list })
  const [keyword, setKeyword] = useState('')
  const [action, setAction] = useState('')

  const groups = useMemo(() => {
    const k = norm(keyword.trim())
    const rows = data.filter((h) => (!action || h.action === action) && (!k || norm(`${h.productCode} ${h.productName} ${h.note}`).includes(k)))
    const map = new Map<string, HistoryEntry[]>()
    rows.forEach((h) => { const d = formatDate(h.at); map.set(d, [...(map.get(d) ?? []), h]) })
    return { list: [...map.entries()], total: rows.length }
  }, [data, keyword, action])

  return { isLoading, keyword, setKeyword, action, setAction, groups: groups.list, total: groups.total }
}
