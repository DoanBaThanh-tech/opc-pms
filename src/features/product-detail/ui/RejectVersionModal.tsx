import { useState } from 'react'
import { FileWarning } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Modal } from '@/core/components/Modal'
import { Textarea } from '@/core/components/Textarea'
import type { Product } from '@/features/products/logic/types'
import type { ProductVersion } from '../logic/types'

interface Props {
  open: boolean
  product: Product
  version: ProductVersion
  saving: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}

export function RejectVersionModal({ open, product, version, saving, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Từ chối phiên bản ${version.version}`}
      widthClass="md:max-w-xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button variant="danger" disabled={!reason.trim()} loading={saving} onClick={() => onSubmit(reason.trim())}>Xác nhận từ chối</Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/70 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-red-600 shadow-sm"><FileWarning className="size-4" /></span>
        <p className="text-xs leading-relaxed text-red-800">
          Phiên bản {version.version} của <b>{product.name}</b> sẽ bị từ chối. Người tạo cần chỉnh sửa hồ sơ và gửi lại quy trình duyệt.
        </p>
      </div>
      <Textarea label="Lý do từ chối *" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do cụ thể để người tạo chỉnh sửa" />
    </Modal>
  )
}
