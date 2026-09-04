import "./AppStates.css";

function ButtonLoader({
  label = "Please wait"
}) {
  return (
    <span
      className="button-loader"
      role="status"
      aria-label={label}
    >
      <span
        className="button-loader__spinner"
        aria-hidden="true"
      />

      <span>{label}</span>
    </span>
  );
}

export default ButtonLoader;