import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  CircleAlert,
  Trash2,
  X
} from "lucide-react";

import "./ConfirmDialog.css";

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-dialog"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
        >
          <button
            type="button"
            className="confirm-dialog__backdrop"
            onClick={onCancel}
            aria-label="Close confirmation"
          />

          <motion.div
            className={`confirm-dialog__panel confirm-dialog__panel--${tone}`}
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.96
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: 14,
              scale: 0.96
            }}
            transition={{
              duration: 0.22,
              ease: [
                0.22,
                1,
                0.36,
                1
              ]
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <button
              type="button"
              className="confirm-dialog__close"
              onClick={onCancel}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <span className="confirm-dialog__icon">
              {tone === "danger" ? (
                <Trash2 size={22} />
              ) : (
                <CircleAlert
                  size={22}
                />
              )}
            </span>

            <h3
              id="confirm-dialog-title"
            >
              {title}
            </h3>

            {message && (
              <p>
                {message}
              </p>
            )}

            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="confirm-dialog__cancel"
                onClick={onCancel}
              >
                {cancelText}
              </button>

              <button
                type="button"
                className="confirm-dialog__confirm"
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;