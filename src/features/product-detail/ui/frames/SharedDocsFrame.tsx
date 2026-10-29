import { BookOpenCheck, FolderKanban, Upload } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import type { ProductVersion, VersionDocument } from '../../logic/types'
import { DocumentList } from './DocumentList'
import { Frame } from './Frame'

interface Props {
  version: ProductVersion
  docs: VersionDocument[]
  editable: boolean
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
  onUploadProfessional: () => void
  onUploadSharedUsage: () => void
}

/** Hồ sơ chuyên môn và HDSD dùng chung – chỉ có ở trang cập nhật phiên bản. */
export function SharedDocsFrame({
  version, docs, editable, onView, onDownload, onUploadProfessional, onUploadSharedUsage,
}: Props) {
  const professional = docs.filter((d) => d.group === 'professional')
  const sharedUsage = docs.filter((d) => d.group === 'usage' && d.shared)

  return (
    <Frame
      icon={FolderKanban}
      title="Hồ sơ chuyên môn & HDSD dùng chung"
      subtitle={`Tài liệu dùng chung cho phiên bản ${version.version}, không gắn với từng quy cách đóng gói.`}
      count={professional.length + sharedUsage.length}
    >
      <div className="space-y-4">
        {editable && (
          <div className="flex flex-wrap gap-2 px-2">
            <Button size="sm" variant="secondary" icon={<Upload className="size-4" />} onClick={onUploadProfessional}>
              Tải lên hồ sơ chuyên môn
            </Button>
            <Button size="sm" variant="secondary" icon={<Upload className="size-4" />} onClick={onUploadSharedUsage}>
              Tải lên HDSD dùng chung
            </Button>
          </div>
        )}

        <section>
          <div className="mb-1 flex items-center justify-between gap-2 px-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <FolderKanban className="size-3.5 text-brand-500" /> Hồ sơ chuyên môn
            </h3>
            <Badge tone="gray">{professional.length} tài liệu</Badge>
          </div>
          <DocumentList docs={professional} onView={onView} onDownload={onDownload} emptyText="Chưa tải lên hồ sơ chuyên môn." />
        </section>

        <section>
          <div className="mb-1 flex items-center justify-between gap-2 px-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <BookOpenCheck className="size-3.5 text-brand-500" /> HDSD dùng chung
            </h3>
            <Badge tone="gray">{sharedUsage.length} tài liệu</Badge>
          </div>
          <DocumentList docs={sharedUsage} onView={onView} onDownload={onDownload} emptyText="Chưa tải lên HDSD dùng chung." />
        </section>
      </div>
    </Frame>
  )
}
