import React, {
  useState
} from "react";

import "./GoogleAuthButton.css";
/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
*/

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


/*
|--------------------------------------------------------------------------
| Google Icon
|--------------------------------------------------------------------------
|
| Inline SVG keeps this component independent from icon libraries.
|
*/

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.18c0-.64-.06-1.26-.16-1.85H12v3.5h5.26a4.5 4.5 0 0 1-1.95 2.95v2.27h3.16c1.85-1.7 2.88-4.21 2.88-6.87Z"
      />

      <path
        fill="#34A853"
        d="M12 21.72c2.64 0 4.86-.88 6.47-2.38l-3.16-2.56c-.88.59-2 .94-3.31.94-2.55 0-4.71-1.72-5.48-4.04H3.26v2.63A9.77 9.77 0 0 0 12 21.72Z"
      />

      <path
        fill="#FBBC05"
        d="M6.52 13.68A5.88 5.88 0 0 1 6.21 12c0-.58.1-1.15.31-1.68V7.69H3.26A9.77 9.77 0 0 0 2.23 12c0 1.56.37 3.04 1.03 4.31l3.26-2.63Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.28c1.44 0 2.73.5 3.74 1.46l2.8-2.8A9.39 9.39 0 0 0 12 2.28a9.77 9.77 0 0 0-8.74 5.41l3.26 2.63C7.29 8 9.45 6.28 12 6.28Z"
      />
    </svg>
  );
}


/*
|--------------------------------------------------------------------------
| Google Auth Button
|--------------------------------------------------------------------------
|
| Usage:
|
| <GoogleAuthButton mode="login" />
|
| <GoogleAuthButton mode="signup" />
|
|--------------------------------------------------------------------------
*/

export default function GoogleAuthButton({
  mode = "login",
  disabled = false,
  className = ""
}) {
  const [
    isRedirecting,
    setIsRedirecting
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Start Google OAuth
  |--------------------------------------------------------------------------
  |
  | OAuth requires a full browser navigation.
  |
  | Do NOT use fetch() or axios here.
  |
  | Browser:
  |
  | React
  |   ↓
  | Unwind Backend
  |   ↓
  | Google
  |   ↓
  | Unwind Backend Callback
  |   ↓
  | React
  |
  |--------------------------------------------------------------------------
  */

  const handleGoogleAuth = () => {
    if (
      disabled ||
      isRedirecting
    ) {
      return;
    }

    setIsRedirecting(true);

    window.location.assign(
      `${API_URL}/auth/google`
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Button Text
  |--------------------------------------------------------------------------
  */

  const defaultText =
    mode === "signup"
      ? "Continue with Google"
      : "Sign in with Google";


  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={
        disabled ||
        isRedirecting
      }
      className={`google-auth-button ${className}`}
      aria-label={defaultText}
    >
      <span className="google-auth-button__icon">
        <GoogleIcon />
      </span>

      <span className="google-auth-button__text">
        {isRedirecting
          ? "Connecting to Google..."
          : defaultText}
      </span>
    </button>
  );
}