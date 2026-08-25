import React from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  startGoogleAuth
} from "../../services/googleAuthService.js";


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
    startGoogleAuth();
  }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="google-auth-error-page">

      <section className="google-auth-error-card">

        <div
          className="google-auth-error-icon"
          aria-hidden="true"
        >
          !
        </div>


        <div className="google-auth-error-content">

          <h1>
            Google sign in failed
          </h1>

          <p>
            {errorMessage}
          </p>

        </div>


        <div className="google-auth-error-actions">

          <button
            type="button"
            className="google-auth-retry-button"
            onClick={handleRetry}
          >
            Try Google again
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