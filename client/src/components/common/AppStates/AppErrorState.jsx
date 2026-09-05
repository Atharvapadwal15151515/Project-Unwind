import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  CloudOff,
  FileQuestion,
  LockKeyhole,
  LogIn,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  TimerReset,
  TriangleAlert,
  Wrench
} from "lucide-react";

import "./AppStates.css";


const ERROR_CONFIG = {
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description:
      "We could not complete your request.",
    actionLabel: "Try again"
  },

  network: {
    icon: CloudOff,
    title: "You appear to be offline",
    description:
      "Check your internet connection and try again.",
    actionLabel: "Retry"
  },

  unauthorized: {
    icon: LogIn,
    title: "Your session has expired",
    description:
      "Please sign in again to continue.",
    actionLabel: "Sign in"
  },

  forbidden: {
    icon: LockKeyhole,
    title: "Access unavailable",
    description:
      "You do not have permission to view this content.",
    actionLabel: "Go back"
  },

  notFound: {
    icon: FileQuestion,
    title: "Content not found",
    description:
      "This content may have been moved or deleted.",
    actionLabel: "Go back"
  },

  server: {
    icon: ServerCrash,
    title: "Unwind is having trouble",
    description:
      "The service is temporarily unavailable. Please try again shortly.",
    actionLabel: "Try again"
  },

  timeout: {
    icon: Clock3,
    title: "This is taking longer than expected",
    description:
      "The request timed out before it could finish.",
    actionLabel: "Try again"
  },

  rateLimit: {
    icon: TimerReset,
    title: "Please slow down",
    description:
      "Too many attempts were made. Wait a moment before trying again.",
    actionLabel: "Try later"
  },

  validation: {
    icon: TriangleAlert,
    title: "Check the information",
    description:
      "Some details are missing or need correction.",
    actionLabel: null
  },

  maintenance: {
    icon: Wrench,
    title: "Temporarily unavailable",
    description:
      "This part of Unwind is currently undergoing maintenance.",
    actionLabel: "Refresh"
  },

  safety: {
    icon: ShieldAlert,
    title: "Action unavailable",
    description:
      "This action was stopped to help keep Unwind safe.",
    actionLabel: "Go back"
  }
};


function AppErrorState({
  type = "error",
  title,
  description,
  actionLabel,
  onRetry,
  onBack,
  compact = false
}) {
  const config =
    ERROR_CONFIG[type] ||
    ERROR_CONFIG.error;

  const Icon =
    config.icon;

  const resolvedTitle =
    title ||
    config.title;

  const resolvedDescription =
    description ||
    config.description;

  const resolvedActionLabel =
    actionLabel !== undefined
      ? actionLabel
      : config.actionLabel;

  const handleAction =
    onRetry ||
    onBack;


  return (
    <div
      className={`app-error-state app-error-state--${type} ${
        compact
          ? "app-error-state--compact"
          : ""
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="app-error-state__icon">
        <Icon size={25} />
      </div>

      <h3>
        {resolvedTitle}
      </h3>

      <p>
        {resolvedDescription}
      </p>

      {resolvedActionLabel &&
        handleAction && (
          <button
            type="button"
            onClick={handleAction}
          >
            {onBack &&
            !onRetry ? (
              <ArrowLeft size={16} />
            ) : (
              <RefreshCw size={16} />
            )}

            {resolvedActionLabel}
          </button>
        )}
    </div>
  );
}


export default AppErrorState;