import {
  BriefcaseBusiness, CheckCircle2, Download, Eye, FileDiff, FlaskConical, Hash, Landmark, Lock,
  Palette, PenLine, QrCode, Scale, ShieldCheck, UsersRound, XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { PageHeader } from '@/core/components/PageHeader'
import {
  FUNCTION_MATRIX, PERMISSIONS, ROLE_ORDER, roleMeta, type PermissionLevel, type RoleKey,
} from '@/core/auth/roles'
import { useCurrentRole } from '@/core/auth/roleStore'
import { cn } from '@/core/utils/format'

const ROLE_ICON: Record<RoleKey, LucideIcon> = {
  ra: Landmark,
  design: Palette,
  rnd: FlaskConical,
  commercial: BriefcaseBusiness,
}

const FUNCTION_ICON: Record<string, LucideIcon> = {
  legal: Scale,
  registration: Hash,
  maquette: Palette,
  qr: QrCode,
  labelDiff: FileDiff,
  formula: FlaskConical,
  esign: PenLine,
  download: Download,
}

const LEVEL_ICON: Partial<Record<PermissionLevel, LucideIcon>> = {
  full: CheckCircle2,
  review: ShieldCheck,
  upload: CheckCircle2,
  create: CheckCircle2,
  view: Eye,
  viewDossier: Eye,
  viewApproved: Eye,
  viewCompare: Eye,
  viewText: Eye,
  viewSummary: Eye,
  viewWatermark: Eye,
  lookup: Eye,
  signRa: PenLine,
  signMaquette: PenLine,
  signRnd: PenLine,
  downloadOriginal: Download,
  downloadPrint: Download,
  downloadTechnical: Download,
  downloadWatermark: Download,
  locked: Lock,
  none: XCircle,
  notNeeded: XCircle,
  hidden: Lock,
  noSign: XCircle,
}

const TONE_CELL: Record<string, string> = {
  green: 'border-emerald-200 bg-emerald-50/70',
  blue: 'border-brand-100 bg-brand-50/60',
  amber: 'border-amber-200 bg-amber-50/70',
  gray: 'border-slate-200 bg-slate-50/70',
}

export default function RolesPage() {
  const currentRole = useCurrentRole()

  return (
    <>
      <PageHeader
        title="Vai trò & phân quyền"
        description="Ma trận thao tác chi tiết của 4 tổ theo quy định GAMP-5"
      />

      <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-linear-to-br from-brand-900 via-brand-700 to-brand-500 px-5 py-5 text-white shadow-pop sm:px-6">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">
              <UsersRound className="size-3.5" /> 4 vai trò vận hành
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">Mỗi hồ sơ phiên bản đi đúng người, đúng tổ</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-brand-100">
              Hồ sơ mới được gửi tự động tới tổ phụ trách nội dung thay đổi. Tổ phụ trách duyệt hoặc từ chối;
              sau khi duyệt, hồ sơ chuyển sang <b className="text-white">Chờ duyệt</b> để Tổ ĐK Thuốc phê duyệt cuối.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-bold ring-1 ring-white/20">
            <ShieldCheck className="size-4" /> Đang xem với vai trò: {roleMeta(currentRole).name}
          </span>
        </div>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROLE_ORDER.map((key) => {
          const role = roleMeta(key)
          const Icon = ROLE_ICON[key]
          const active = key === currentRole
          return (
            <div
              key={key}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-white p-4 shadow-soft transition',
                active ? 'border-brand-300 ring-2 ring-brand-100' : 'border-line',
              )}
            >
              {active && <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">Vai trò hiện tại</span>}
              <span className={cn('grid size-10 place-items-center rounded-xl text-white', key === 'ra' ? 'bg-linear-to-br from-brand-500 to-brand-700' : key === 'design' ? 'bg-linear-to-br from-emerald-400 to-emerald-600' : key === 'rnd' ? 'bg-linear-to-br from-amber-400 to-amber-600' : 'bg-linear-to-br from-slate-400 to-slate-600')}>
                <Icon className="size-5" />
              </span>
              <p className="mt-3 text-sm font-extrabold text-brand-900">{role.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{role.team}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">{role.description}</p>
              <Badge tone={role.canSign ? 'green' : 'gray'}>{role.canSign ? 'Có quyền ký số' : 'Không ký duyệt'}</Badge>
            </div>
          )
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-soft">
        <span className="text-xs font-bold text-brand-900">Chú giải:</span>
        {(['full', 'review', 'view', 'lookup', 'none'] as PermissionLevel[]).map((level) => {
          const meta = PERMISSIONS[level]
          return <Badge key={level} tone={meta.tone}>{meta.label}</Badge>
        })}
        <span className="text-[11px] text-muted">Cột vai trò đang chọn được tô sáng để đối chiếu nhanh.</span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="bg-linear-to-r from-brand-900 via-brand-700 to-brand-600 text-white">
                <th className="w-[30%] px-4 py-3 text-[10px] font-bold uppercase tracking-wide">Nhóm nghiệp vụ & module dữ liệu</th>
                {ROLE_ORDER.map((key) => {
                  const role = roleMeta(key)
                  const Icon = ROLE_ICON[key]
                  return (
                    <th key={key} className={cn('px-3 py-3 text-[10px] font-bold uppercase tracking-wide', key === currentRole && 'bg-white/10')}>
                      <span className="flex items-center gap-1.5"><Icon className="size-3.5" /> {role.name}</span>
                      <span className="mt-0.5 block text-[9px] font-medium normal-case tracking-normal text-brand-100">{role.team}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FUNCTION_MATRIX.map((fn, index) => {
                const Icon = FUNCTION_ICON[fn.key] ?? ShieldCheck
                return (
                  <tr key={fn.key} className="align-top transition hover:bg-brand-50/30">
                    <td className="px-4 py-3">
                      <p className="flex items-start gap-2 text-xs font-bold leading-snug text-brand-900">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100"><Icon className="size-3.5" /></span>
                        <span><span className="text-[10px] text-muted">{index + 1}. </span>{fn.title}</span>
                      </p>
                      <p className="mt-1 pl-8 text-[11px] leading-relaxed text-muted">{fn.description}</p>
                    </td>
                    {ROLE_ORDER.map((key) => {
                      const level = fn.permissions[key]
                      const meta = PERMISSIONS[level]
                      const LevelIcon = LEVEL_ICON[level] ?? XCircle
                      return (
                        <td key={key} className={cn('px-3 py-3', key === currentRole && 'bg-brand-50/40')}>
                          <span className={cn('inline-flex items-start gap-1.5 rounded-xl border px-2 py-1.5 text-[10px] font-bold leading-tight', TONE_CELL[meta.tone])}>
                            <LevelIcon className="mt-0.5 size-3 shrink-0" />
                            {meta.label}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-line bg-brand-50/40 px-4 py-3 text-[11px] leading-relaxed text-muted">
          Quy trình phê duyệt hồ sơ: <b className="text-brand-800">Đang chờ xử lý</b> → tổ phụ trách duyệt → <b className="text-brand-800">Chờ duyệt</b> → Tổ ĐK Thuốc phê duyệt → <b className="text-brand-800">Đã duyệt</b>.
          Tổ Kinh doanh chỉ tra cứu và tải bản tham khảo, không tham gia ký duyệt.
        </footer>
      </section>
    </>
  )
}
