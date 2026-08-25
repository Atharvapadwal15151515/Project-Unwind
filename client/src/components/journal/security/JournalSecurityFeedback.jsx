import {
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";

function JournalSecurityFeedback({
  type = "error",
  message,
  onDismiss
}) {
  if (!message) {
    return null;
  }

  const Icon =
    type === "success"
      ? CheckCircle2
      : AlertCircle;

  return (
    <div
      className={`journal-security-feedback journal-security-feedback--${type}`}
      role={
        type === "error"
          ? "alert"
          : "status"
      }
    >
      <Icon size={18} />

      <p>{message}</p>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}

export default JournalSecurityFeedback;