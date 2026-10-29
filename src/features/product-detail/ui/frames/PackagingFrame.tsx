import { Boxes, CalendarClock, Package, ShieldCheck } from 'lucide-react'
import { formatDate } from '@/core/utils/format'
import type { ProductVersion, VersionDocument } from '../../logic/types'
import { Frame } from './Frame'
import { DocumentList } from './DocumentList'

interface Props {
  version: ProductVersion
  docs: VersionDocument[]
  onDownload: (doc: VersionDocument) => void
}

export function PackagingFrame({ version, docs, onDownload }: Props) {
  const specs = [
    { icon: Package, label: 'Quy cách đóng gói', value: version.packaging || '—' },
    { icon: CalendarClock, label: 'Hạn dùng', value: version.shelfLife || '—' },
    { icon: ShieldCheck, label: 'Quy định áp dụng', value: version.regulation },
  ]
  return (
    <Frame
      icon={Boxes}
      title="Quản lý quy cách đóng gói & hồ sơ kỹ thuật"
      subtitle={`Bản vẽ bao bì, công thức và tiêu chuẩn chất lượng · cập nhật ${formatDate(version.updatedAt)}`}
      count={docs.length}
    >
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {specs.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-line bg-brand-50/40 px-3 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
              <Icon className="size-3.5 text-brand-500" /> {label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-brand-900">{value}</p>
          </div>
        ))}
      </div>
      <DocumentList docs={docs} onDownload={onDownload} />
    </Frame>
  )
}
