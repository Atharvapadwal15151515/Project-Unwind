import {
  AlertCircle,
  CheckCircle2
} from "lucide-react";

function AuthAlert({
  type = "error",
  message
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
      className={`auth-alert auth-alert--${type}`}
      role="alert"
    >
      <Icon size={18} />
      <p>{message}</p>
    </div>
  );
}

export default AuthAlert;