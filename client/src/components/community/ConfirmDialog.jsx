import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  AlertTriangle,
  X
} from "lucide-react";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loading,
  onConfirm,
  onCancel
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="community-modal-backdrop community-modal-backdrop--confirm"
            onClick={onCancel}
            aria-label="Close confirmation"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
          />

          <motion.section
            className="community-confirm-dialog"
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.94
            }}
          >
            <button
              type="button"
              className="community-confirm-dialog__close"
              onClick={onCancel}
            >
              <X size={18} />
            </button>

            <span className="community-confirm-dialog__icon">
              <AlertTriangle size={24} />
            </span>

            <h3>{title}</h3>
            <p>{description}</p>

            <div className="community-confirm-dialog__actions">
              <button
                type="button"
                className="community-secondary-button"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="community-danger-button"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading
                  ? "Deleting…"
                  : confirmLabel}
              </button>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;