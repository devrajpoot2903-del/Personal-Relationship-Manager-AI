import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

/**
 * Destructive-action confirmation. Nothing is ever deleted without passing
 * through here first.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isBusy = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isBusy ? () => {} : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? 'Deleting…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="pt-1.5 text-sm leading-relaxed text-ink-600">{message}</p>
      </div>
    </Modal>
  );
}
