import { motion } from 'framer-motion'
import { ArrowLeft, Eye, Lock, Rocket, Sparkles, UsersRound } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { canApplyVersion, roleMeta } from '@/core/auth/roles'
import { useCurrentRole } from '@/core/auth/roleStore'
import { formatDate } from '@/core/utils/format'
import { approvalMetaOf, approvalStatusOf, approverRoleOf, assignedRoleOf } from '../logic/approvalUtils'
import type { ProductVersion } from '../logic/types'
import { versionEndDate } from '../logic/versionUtils'

interface Props {
  version: ProductVersion
  current?: ProductVersion
  onPreview: () => void
  onActivate: () => void
  onBackToCurrent: () => void
}

/** Banner nhắc rõ phiên bản đang xem không phải bản hiện hành. */
export function VersionNotice({ version, current, onPreview, onActivate, onBackToCurrent }: Props) {
  const role = useCurrentRole()
  if (version.stage === 'current') return null
  const coming = version.stage === 'coming_soon'
  const approval = approvalMetaOf(version)
  const status = approvalStatusOf(version)
  const assigned = roleMeta(assignedRoleOf(version)).name
  const approver = roleMeta(approverRoleOf(version)).name
  const rejectedBy = roleMeta(version.rejectedByRole ?? assignedRoleOf(version)).name
  const canActivate = coming && status === 'approved' && canApplyVersion(role)

  const banner = !coming
    ? 'border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50'
    : status === 'rejected'
      ? 'border-red-200 bg-linear-to-r from-red-50 via-white to-red-50/50'
      : status === 'pending'
        ? 'border-brand-200 bg-linear-to-r from-brand-50 via-white to-brand-50/60'
        : 'border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50'

  const title = coming
    ? `Phiên bản ${version.version} · ${approval.label}`
    : `Chế độ chỉ xem · Phiên bản lưu trữ ${version.version}`

  const description = !coming
    ? 'Phiên bản cũ không thể áp dụng lại. Mọi tài liệu tải xuống sẽ thuộc đúng phiên bản đang xem.'
    : status === 'rejected'
      ? `Hồ sơ bị ${rejectedBy} từ chối${version.rejectedReason ? `: ${version.rejectedReason}` : '.'} Cập nhật nội dung và gửi lại để tổ phụ trách duyệt lại.`
      : status === 'approved'
        ? `Đã hoàn tất phê duyệt và ký xác thực. Dự kiến hiệu lực ${formatDate(version.effectiveDate)} – ${version.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(version))}.`
        : status === 'pending'
          ? `${assigned} đã xử lý hồ sơ, đang chờ ${approver} phê duyệt cuối trước khi có thể đưa vào lưu hành.`
          : `Hồ sơ đã được gửi tự động tới ${assigned} để xử lý. Sau khi tổ này duyệt, hồ sơ chuyển sang Chờ duyệt.`

  return (
    <motion.div
      key={version.id}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-soft ${banner}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${!coming ? 'bg-linear-to-br from-amber-400 to-amber-600' : status === 'rejected' ? 'bg-linear-to-br from-red-400 to-red-600' : status === 'pending' ? 'bg-linear-to-br from-brand-400 to-brand-600' : 'bg-linear-to-br from-amber-400 to-amber-600'}`}>
          {!coming ? <Lock className="size-5" /> : status === 'rejected' ? <Lock className="size-5" /> : status === 'pending' ? <UsersRound className="size-5" /> : <Sparkles className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${!coming || status === 'processing' ? 'text-amber-900' : status === 'rejected' ? 'text-red-900' : 'text-brand-900'}`}>
            {title}
          </p>
          <p className={`mt-0.5 text-xs leading-relaxed ${!coming || status === 'processing' ? 'text-amber-800/80' : status === 'rejected' ? 'text-red-800/80' : 'text-brand-800/80'}`}>
            {description}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<Eye className="size-4" />} onClick={onPreview}>
            {coming ? 'Xem trước thay đổi' : 'Xem thay đổi'}
          </Button>
          {canActivate && <Button size="sm" icon={<Rocket className="size-4" />} onClick={onActivate}>Đưa vào sử dụng</Button>}
          {!coming && current && (
            <Button size="sm" variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={onBackToCurrent}>Về bản hiện hành</Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
