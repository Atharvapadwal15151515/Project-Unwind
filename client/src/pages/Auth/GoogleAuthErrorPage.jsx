import {
  useState
} from "react";
import {
  useNavigate
} from "react-router-dom";

import {
  startGoogleAuth
} from "../../services/googleAuthService.js";
import AppErrorState
  from "../../components/common/AppStates/AppErrorState";

import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import "./GoogleAuthSuccessPage.css";


/*
|--------------------------------------------------------------------------
| Google Auth Error Page
|--------------------------------------------------------------------------
|
| Displayed when Google OAuth fails or is cancelled.
|
| Backend redirects here:
|
| /auth/google/error?error=google_authentication_failed
|
|--------------------------------------------------------------------------
*/

export default function GoogleAuthErrorPage() {
  const navigate =
    useNavigate();

    const [
  retrying,
  setRetrying
] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Read Error
  |--------------------------------------------------------------------------
  */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const errorCode =
    params.get("error");


  /*
  |--------------------------------------------------------------------------
  | Error Message
  |--------------------------------------------------------------------------
  */

  let errorMessage =
    "We couldn't complete your Google sign in.";


  if (
    errorCode ===
    "google_authentication_failed"
  ) {
    errorMessage =
      "Google authentication was cancelled or could not be completed.";
  }


  /*
  |--------------------------------------------------------------------------
  | Try Google Again
  |--------------------------------------------------------------------------
  */

 function handleRetry() {
  if (retrying) {
    return;
  }

  try {
    setRetrying(true);
    startGoogleAuth();
  } catch (retryError) {
    console.error(
      "Unable to restart Google authentication:",
      retryError
    );

    setRetrying(false);
  }
}


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="google-auth-error-page">

      <section className="google-auth-error-card">

<AppErrorState
  type="server"
  title="Google sign in failed"
  message={errorMessage}
/>


        <div className="google-auth-error-actions">

        <button
  type="button"
  className="google-auth-retry-button"
  onClick={handleRetry}
  disabled={retrying}
>
  {retrying ? (
    <ButtonLoader
      label="Opening Google…"
      size="small"
    />
  ) : (
    "Try Google again"
  )}
</button>


          <button
            type="button"
            className="google-auth-back-button"
            onClick={() =>
              navigate(
                "/login",
                {
                  replace: true
                }
              )
            }
          >
            Back to login
          </button>

        </div>

      </section>

    </main>
  );
}