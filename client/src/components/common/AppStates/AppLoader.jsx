import "./AppStates.css";

function AppLoader({
  fullScreen = false,
  message = "Preparing your space…",
  size = "medium"
}) {
  return (
    <div
      className={`app-loader ${
        fullScreen
          ? "app-loader--fullscreen"
          : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`app-loader__spinner app-loader__spinner--${size}`}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      {message && (
        <p className="app-loader__message">
          {message}
        </p>
      )}
    </div>
  );
}

export default AppLoader;