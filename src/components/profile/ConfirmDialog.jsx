import Button from './Button.jsx'

/* ---- TEAMMATE BOUNDARY: ConfirmDialog ----
 * Generic two-button confirmation overlay modal.
 * If you already have a Dialog/Modal component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * ConfirmDialog — lightweight confirmation modal.
 *
 * @param {string}   title         Dialog heading
 * @param {string}   message       Body text explaining the action
 * @param {string}   confirmLabel  Text for the destructive button (default: 'Delete')
 * @param {string}   confirmClass  Optional override class for the confirm button
 * @param {function} onConfirm     Called on confirm click
 * @param {function} onCancel      Called on cancel or overlay click
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  confirmClass,
  onConfirm,
  onCancel,
}) {
  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-card shadow-2xl max-w-sm w-full p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[16px] font-display font-bold text-ink-900">{title}</h3>
        <p className="text-[13.5px] text-graphite-dim leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end pt-1">
          <Button id="confirm-dialog-cancel" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            id="confirm-dialog-confirm"
            variant="danger"
            onClick={onConfirm}
            className={confirmClass || ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
