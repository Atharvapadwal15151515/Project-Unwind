import {
  ArrowRight,
  Inbox
} from "lucide-react";

import "./AppStates.css";

function AppEmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description =
    "Your content will appear here when it becomes available.",
  actionLabel,
  onAction,
  actionIcon: ActionIcon = ArrowRight,
  compact = false
}) {
  return (
    <div
      className={`app-empty-state ${
        compact
          ? "app-empty-state--compact"
          : ""
      }`}
    >
      <div className="app-empty-state__icon">
        <Icon size={24} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="app-empty-state__action"
          onClick={onAction}
        >
          {actionLabel}

          <ActionIcon size={16} />
        </button>
      )}
    </div>
  );
}

export default AppEmptyState;