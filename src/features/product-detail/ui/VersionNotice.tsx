import { motion } from 'framer-motion'
import { ArrowLeft, Eye, Lock, Rocket, Sparkles } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { formatDate } from '@/core/utils/format'
import type { ProductVersion } from '../logic/types'

interface Props {
  version: ProductVersion
  current?: ProductVersion
  onPreview: () => void
  onActivate: () => void
  onBackToCurrent: () => void
}

/** Banner nhắc rõ phiên bản đang xem không phải bản hiện hành. */
export function VersionNotice({ version, current, onPreview, onActivate, onBackToCurrent }: Props) {
  if (version.stage === 'current') return null
  const coming = version.stage === 'coming_soon'

  return (
    <motion.div
      key={version.id}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className={
        coming
          ? 'relative overflow-hidden rounded-2xl border border-brand-200 bg-linear-to-r from-brand-50 via-white to-brand-50/60 p-4 shadow-soft'
          : 'relative overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50 p-4 shadow-soft'
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${coming ? 'bg-linear-to-br from-brand-400 to-brand-600' : 'bg-linear-to-br from-amber-400 to-amber-600'}`}>
          {coming ? <Sparkles className="size-5" /> : <Lock className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${coming ? 'text-brand-900' : 'text-amber-900'}`}>
            {coming ? `Bản xem trước · Phiên bản ${version.version} chưa được áp dụng` : `Chế độ chỉ xem · Phiên bản lưu trữ ${version.version}`}
          </p>
          <p className={`mt-0.5 text-xs leading-relaxed ${coming ? 'text-brand-800/80' : 'text-amber-800/80'}`}>
            {coming
              ? `Dự kiến hiệu lực ${formatDate(version.effectiveDate)}. Toàn bộ khung bên dưới đang hiển thị dữ liệu của bản xem trước.`
              : 'Phiên bản cũ không thể áp dụng lại. Mọi tài liệu tải xuống sẽ thuộc đúng phiên bản đang xem.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<Eye className="size-4" />} onClick={onPreview}>
            {coming ? 'Xem trước thay đổi' : 'Xem thay đổi'}
          </Button>
          {coming && <Button size="sm" icon={<Rocket className="size-4" />} onClick={onActivate}>Đưa vào sử dụng</Button>}
          {!coming && current && (
            <Button size="sm" variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={onBackToCurrent}>Về bản hiện hành</Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
