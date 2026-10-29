import { Button } from './Button'
import { Modal } from './Modal'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, message, confirmText = 'Xác nhận', loading, onConfirm, onClose }: Props) {
  return (
    <Modal
      open={open} title={title} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmText}</Button>
      </>}
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  )
}
