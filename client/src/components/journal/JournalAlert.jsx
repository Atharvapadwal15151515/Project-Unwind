import {
  X
} from "lucide-react";

function JournalAlert({
  message,
  onDismiss
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="journal-alert"
      role="alert"
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default JournalAlert;