import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function AuthInput({
  label,
  error,
  type = "text",
  required = false,
  icon: Icon,
  ...inputProps
}) {
  const [showPassword, setShowPassword] =
    useState(false);

  const isPassword = type === "password";

  const resolvedType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <label className="auth-field">
      <span className="auth-field__label">
        {label}

        {required && <em>*</em>}
      </span>

      <span
        className={`auth-field__control ${
          error ? "auth-field__control--error" : ""
        }`}
      >
        {Icon && (
          <Icon
            className="auth-field__icon"
            size={18}
          />
        )}

        <input
          {...inputProps}
          type={resolvedType}
          required={required}
        />

        {isPassword && (
          <button
            type="button"
            className="auth-field__password-button"
            onClick={() =>
              setShowPassword(
                (currentValue) => !currentValue
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </span>

      {error && (
        <span className="auth-field__error">
          {error}
        </span>
      )}
    </label>
  );
}

export default AuthInput;