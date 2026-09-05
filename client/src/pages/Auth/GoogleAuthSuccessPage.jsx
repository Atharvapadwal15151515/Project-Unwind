import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../../context/AuthContext";

import {
  setAccessToken
} from "../../services/api";
import AppLoader
  from "../../components/common/AppStates/AppLoader";

import AppErrorState
  from "../../components/common/AppStates/AppErrorState";
import "./GoogleAuthSuccessPage.css";


function GoogleAuthSuccessPage() {
  const navigate =
    useNavigate();

  const {
    refreshUser
  } = useAuth();

  const hasProcessed =
    useRef(false);

  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {
    const completeGoogleLogin =
      async () => {
        /*
        |--------------------------------------------------------------------------
        | Prevent duplicate processing in React StrictMode
        |--------------------------------------------------------------------------
        */

        if (
          hasProcessed.current
        ) {
          return;
        }

        hasProcessed.current =
          true;


        try {
          /*
          |--------------------------------------------------------------------------
          | Read Access Token From Google Callback Redirect
          |--------------------------------------------------------------------------
          |
          | Backend redirects:
          |
          | /auth/google/success?accessToken=...&action=login
          |
          |--------------------------------------------------------------------------
          */

          const params =
            new URLSearchParams(
              window.location.search
            );

          const accessToken =
            params.get(
              "accessToken"
            );


          if (!accessToken) {
            throw new Error(
              "Google login succeeded, but no access token was returned."
            );
          }


          /*
          |--------------------------------------------------------------------------
          | Store Access Token
          |--------------------------------------------------------------------------
          |
          | This uses the SAME token storage as normal UNWIND login.
          |
          |--------------------------------------------------------------------------
          */

          setAccessToken(
            accessToken
          );


          /*
          |--------------------------------------------------------------------------
          | Remove Token From Browser URL
          |--------------------------------------------------------------------------
          |
          | Do this immediately after reading it.
          |
          |--------------------------------------------------------------------------
          */

          window.history.replaceState(
            {},
            document.title,
            "/auth/google/success"
          );


          /*
          |--------------------------------------------------------------------------
          | Load Authenticated User
          |--------------------------------------------------------------------------
          |
          | Because the access token now exists and is valid:
          |
          | refreshUser()
          |
          | will NOT call /auth/refresh.
          |
          | It will directly call getCurrentUser().
          |
          |--------------------------------------------------------------------------
          */

          await refreshUser();


          /*
          |--------------------------------------------------------------------------
          | Login Complete
          |--------------------------------------------------------------------------
          */

          navigate(
            "/dashboard",
            {
              replace: true
            }
          );

        } catch (requestError) {
          console.error(
            "Google login completion failed:",
            requestError
          );


          setError(
            requestError?.message ||
            "Unable to complete Google sign in."
          );
        }
      };


    completeGoogleLogin();

  }, [
    navigate,
    refreshUser
  ]);


  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <main className="google-auth-result-page">

        <section className="google-auth-result-card">

          <div className="google-auth-result-icon google-auth-result-icon--error">
            !
          </div>

          <h1>
            Google sign in failed
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"

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

        </section>

      </main>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  return (
    <main className="google-auth-result-page">

      <section className="google-auth-result-card">

        <div
          className="google-auth-loader"
          aria-hidden="true"
        />

        <h1>
          Signing you in
        </h1>

        <p>
          Connecting your Google account
          to UNWIND…
        </p>

      </section>

    </main>
  );
}


export default GoogleAuthSuccessPage;