import "./AppStates.css";

function AppProgressBar({
  value,
  label = "Processing",
  showPercentage = true,
  indeterminate = false
}) {
  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        Number(value) || 0
      )
    );

  return (
    <div
      className="app-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={
        indeterminate
          ? undefined
          : 0
      }
      aria-valuemax={
        indeterminate
          ? undefined
          : 100
      }
      aria-valuenow={
        indeterminate
          ? undefined
          : safeValue
      }
    >
      <div className="app-progress__header">
        <span>{label}</span>

        {!indeterminate &&
          showPercentage && (
            <strong>
              {Math.round(
                safeValue
              )}%
            </strong>
          )}
      </div>

      <div className="app-progress__track">
        <span
          className={
            indeterminate
              ? "app-progress__bar app-progress__bar--indeterminate"
              : "app-progress__bar"
          }
          style={
            indeterminate
              ? undefined
              : {
                  width:
                    `${safeValue}%`
                }
          }
        />
      </div>
    </div>
  );
}

export default AppProgressBar;