/*
|--------------------------------------------------------------------------
| Google Auth Service
|--------------------------------------------------------------------------
|
| Handles only Google-specific frontend authentication.
|
| Normal email/password login and registration remain untouched.
|
|--------------------------------------------------------------------------
*/

const API_URL =
  import.meta.env.PROD
    ? "/api"
    : (
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
      );

/*
|--------------------------------------------------------------------------
| Start Google Authentication
|--------------------------------------------------------------------------
|
| OAuth requires a full browser redirect.
|
| Do NOT use fetch() or axios here.
|
|--------------------------------------------------------------------------
*/

export function startGoogleAuth() {
  window.location.assign(
    `${API_URL}/auth/google`
  );
}


/*
|--------------------------------------------------------------------------
| Complete Google Profile
|--------------------------------------------------------------------------
|
| Used only for brand-new Google users.
|
| The backend has already verified the Google account.
| The user now provides Unwind-specific profile information.
|
|--------------------------------------------------------------------------
*/

export async function completeGoogleProfile({
  googleSignupToken,
  username,
  dateOfBirth,
  gender,
  occupationType
}) {
  const response = await fetch(
    `${API_URL}/auth/google/complete-profile`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      credentials: "include",

      body: JSON.stringify({
        googleSignupToken,
        username,
        dateOfBirth,
        gender,
        occupationType
      })
    }
  );


  let result;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }


  if (!response.ok) {
    throw new Error(
      result?.message ||
        "Unable to complete Google signup"
    );
  }


  return result;
}


/*
|--------------------------------------------------------------------------
| Refresh Google Login Session
|--------------------------------------------------------------------------
|
| After an existing Google user returns from the backend callback, the
| backend has already placed the refresh token inside the HttpOnly cookie.
|
| This function asks the backend for a normal Unwind access token.
|
| IMPORTANT:
| Change this endpoint only if your existing refresh route uses another path.
|
|--------------------------------------------------------------------------
*/

export async function refreshGoogleSession() {
  const response = await fetch(
    `${API_URL}/auth/refresh`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      credentials: "include"
    }
  );


  let result;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }


  if (!response.ok) {
    throw new Error(
      result?.message ||
        "Unable to restore Google login session"
    );
  }


  return result;
}


/*
|--------------------------------------------------------------------------
| Extract Temporary Google Signup Token
|--------------------------------------------------------------------------
|
| Current backend flow redirects new Google users to:
|
| /auth/google/complete-profile?token=...
|
| This helper keeps URL parsing outside the page component.
|
|--------------------------------------------------------------------------
*/

export function getGoogleSignupToken() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("token");
}


/*
|--------------------------------------------------------------------------
| Remove Google Auth Parameters From URL
|--------------------------------------------------------------------------
|
| Removes temporary OAuth information after the page has read it.
|
|--------------------------------------------------------------------------
*/

export function cleanGoogleAuthUrl() {
  const cleanUrl =
    `${window.location.pathname}`;

  window.history.replaceState(
    {},
    document.title,
    cleanUrl
  );
}