import { forwardRef } from "react"

/**
 * Thin wrapper around daisyUI's native <dialog> modal — ESC-to-close and
 * backdrop-click-to-close come from the browser/daisyUI for free.
 * Open with `ref.current.showModal()`, close with `ref.current.close()`.
 */
const Modal = forwardRef(function Modal({ labelledBy, panelClassName = "", children }, ref) {
  return (
    <dialog ref={ref} className="modal" aria-labelledby={labelledBy}>
      <div className={`modal-box max-w-[660px] rounded-card bg-paper-raised p-0 overflow-hidden ${panelClassName}`}>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  )
})

export default Modal
