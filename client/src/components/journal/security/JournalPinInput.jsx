import {
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";

import {
  useState
} from "react";

function JournalPinInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter 4–6 digits",
  autoComplete = "off",
  autoFocus = false,
  disabled = false,
  error = ""
}) {
  const [showPin, setShowPin] =
    useState(false);

  function handleChange(event) {
    const digits = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    onChange(digits);
  }

  return (
    <label
      className="journal-pin-field"
      htmlFor={id}
    >
      <span>{label}</span>

      <div
        className={
          error
            ? "journal-pin-field__control journal-pin-field__control--error"
            : "journal-pin-field__control"
        }
      >
        <KeyRound size={17} />

        <input
          id={id}
          name={id}
          type={showPin ? "text" : "password"}
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${id}-error`
              : undefined
          }
          onChange={handleChange}
        />

        <button
          type="button"
          onClick={() =>
            setShowPin(
              (current) => !current
            )
          }
          disabled={disabled}
          aria-label={
            showPin
              ? "Hide PIN"
              : "Show PIN"
          }
        >
          {showPin ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>

      {error ? (
        <small id={`${id}-error`}>
          {error}
        </small>
      ) : null}
    </label>
  );
}

export default JournalPinInput;