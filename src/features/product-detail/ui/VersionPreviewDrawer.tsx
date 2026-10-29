import { motion } from 'framer-motion'
import { ArrowRight, Boxes, BookOpenCheck, CheckCircle2, Download, FileText, Lock, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { Drawer } from '@/core/components/Drawer'
import { cn, formatDate } from '@/core/utils/format'
import { docsByGroup } from '../logic/documents'
import { DOC_GROUP_META, STAGE_META, type ProductVersion, type VersionDocument } from '../logic/types'

interface Props {
  open: boolean
  version: ProductVersion | null
  previous?: ProductVersion
  docs: VersionDocument[]
  onClose: () => void
  onDownload: () => void
  downloading: boolean
  onActivate: () => void
}

const STAGE_ICON = { current: CheckCircle2, coming_soon: Sparkles, archived: Lock }
const STAGE_BANNER = {
  current: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  coming_soon: 'border-brand-200 bg-brand-50 text-brand-900',
  archived: 'border-amber-200 bg-amber-50 text-amber-900',
}
const CHANGE_CLS = {
  added: 'bg-emerald-100 text-emerald-800',
  updated: 'bg-brand-100 text-brand-800',
  removed: 'bg-red-100 text-red-700',
}
const CHANGE_LABEL = { added: 'Bổ sung', updated: 'Cập nhật', removed: 'Loại bỏ' }

const GROUPS = [
  { key: 'legal' as const, icon: ShieldCheck },
  { key: 'usage' as const, icon: BookOpenCheck },
  { key: 'packaging' as const, icon: Boxes },
]

export function VersionPreviewDrawer({ open, version, previous, docs, onClose, onDownload, downloading, onActivate }: Props) {
  const stage = version ? STAGE_META[version.stage] : STAGE_META.current
  const Icon = version ? STAGE_ICON[version.stage] : CheckCircle2

  return (
    <Drawer
      open={open && !!version}
      onClose={onClose}
      eyebrow="Chi tiết phiên bản"
      title={version ? `Phiên bản ${version.version}` : 'Phiên bản'}
      description={version ? `${stage.label} · Cập nhật ${formatDate(version.updatedAt)}` : undefined}
      footer={version && (
        <>
          <Button variant="secondary" icon={<Download className="size-4" />} loading={downloading} onClick={onDownload}>
            Tải hồ sơ phiên bản
          </Button>
          {version.stage === 'coming_soon' && (
            <Button icon={<Rocket className="size-4" />} onClick={onActivate}>Đưa vào sử dụng</Button>
          )}
        </>
      )}
    >
      {version && (
        <div className="space-y-5">
          <div className={cn('flex items-start gap-3 rounded-2xl border p-4', STAGE_BANNER[version.stage])}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70 shadow-sm">
              <Icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold">{stage.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed opacity-80">{version.summary || stage.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['Ngày hiệu lực', formatDate(version.effectiveDate)],
              ['Cập nhật gần nhất', formatDate(version.updatedAt)],
              ['Quyết định', version.approvalNo],
              ['Số đăng ký', version.registrationNo || '—'],
              ['Quy cách', version.packaging || '—'],
              ['Hạn dùng', version.shelfLife || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-brand-50/40 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-brand-900" title={value}>{value}</p>
              </div>
            ))}
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-brand-900">
                Thay đổi trong phiên bản
                {previous && <span className="ml-1 text-xs font-medium text-muted">so với v{previous.version}</span>}
              </h3>
              <Badge tone="blue">{version.changes.length}</Badge>
            </div>
            {version.changes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">Chưa ghi nhận thay đổi cho phiên bản này.</p>
            ) : (
              <div className="space-y-2">
                {version.changes.map((c, i) => (
                  <motion.div
                    key={`${c.field}-${i}`}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-line bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-brand-900">{c.field}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', CHANGE_CLS[c.kind])}>{CHANGE_LABEL[c.kind]}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                      {c.before && <span className="rounded bg-slate-50 px-1.5 py-0.5 text-muted line-through">{c.before}</span>}
                      {c.before && c.after && <ArrowRight className="size-3 shrink-0 text-brand-400" />}
                      {c.after && <span className="rounded bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-800">{c.after}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-extrabold text-brand-900">Hồ sơ kèm theo</h3>
            <div className="grid grid-cols-3 gap-2">
              {GROUPS.map(({ key, icon: GroupIcon }) => {
                const count = docsByGroup(docs, key).length
                return (
                  <div key={key} className="rounded-xl border border-line bg-white px-2 py-3 text-center">
                    <GroupIcon className="mx-auto size-4 text-brand-500" />
                    <p className="mt-1 text-lg font-extrabold leading-none text-brand-900">{count}</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-muted">{DOC_GROUP_META[key].short}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted"><FileText className="size-3" /> Tải hồ sơ phiên bản để nhận đầy đủ tài liệu và dữ liệu gốc.</p>
          </section>

          <div className="rounded-2xl bg-brand-50/70 px-4 py-3 text-[11px] leading-relaxed text-brand-800">
            <b>Người phê duyệt:</b> {version.approvedBy}
            {version.stage === 'archived' && <p className="mt-1 text-amber-800">Phiên bản lưu trữ chỉ được xem, không thể đưa vào áp dụng lại.</p>}
            {version.stage === 'coming_soon' && <p className="mt-1 text-brand-700">Sau khi đưa vào sử dụng, phiên bản hiện hành sẽ tự động chuyển sang trạng thái lưu trữ.</p>}
          </div>
        </div>
      )}
    </Drawer>
  )
}
