import {
  ArrowRight,
  Check,
  CheckCircle2
} from "lucide-react";

import "./AppStates.css";

function AppSuccessState({
  title = "All done",
  description =
    "Your changes have been saved successfully.",
  actionLabel,
  onAction,
  actionIcon: ActionIcon = ArrowRight,
  compact = false,
  showCelebration = false
}) {
  return (
    <div
      className={`app-success-state ${
        compact
          ? "app-success-state--compact"
          : ""
      }`}
      role="status"
      aria-live="polite"
    >
      {showCelebration && (
        <div
          className="app-success-state__celebration"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      <div className="app-success-state__icon">
        <span>
          <CheckCircle2 size={27} />
        </span>

        <i>
          <Check size={14} />
        </i>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="app-success-state__action"
          onClick={onAction}
        >
          {actionLabel}

          <ActionIcon size={16} />
        </button>
      )}
    </div>
  );
}

export default AppSuccessState;