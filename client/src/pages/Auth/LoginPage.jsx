import { useState } from "react";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  LockKeyhole,
  UserRound
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import AppLoader
  from "../../components/common/AppStates/AppLoader";

import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";

import "./Auth.css";

function LoginPage() {
  const [formData, setFormData] =
    useState({
      identifier: "",
      password: ""
    });

  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const {
    login,
    isAuthenticated,
    initializing
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();


  /*
  |--------------------------------------------------------------------------
  | Redirect Destination
  |--------------------------------------------------------------------------
  */

  const from =
    location.state?.from;

  const redirectPath =
    typeof from === "string"
      ? from
      : from?.pathname
        ? `${from.pathname}${from.search || ""}${from.hash || ""}`
        : "/dashboard";


  /*
  |--------------------------------------------------------------------------
  | Form Input
  |--------------------------------------------------------------------------
  */

  const updateField = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: value
      })
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Email / Password Login
  |--------------------------------------------------------------------------
  |
  | Existing login flow remains unchanged.
  |
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const identifier =
      formData.identifier.trim();

    if (
      !identifier ||
      !formData.password
    ) {
      setError(
        "Enter your email or username and password."
      );

      return;
    }

    try {
      setLoading(true);

      await login({
        identifier,

        password:
          formData.password,

        rememberMe
      });

      navigate(
        redirectPath,
        {
          replace: true
        }
      );

    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to log in. Check your details and try again."
        )
      );

    } finally {
      setLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Session Restoration
  |--------------------------------------------------------------------------
  */

 if (initializing) {
  return (
    <main className="auth-loading-screen">
      <AppLoader
        message="Restoring your UNWIND session…"
        size="large"
      />
    </main>
  );
}


  /*
  |--------------------------------------------------------------------------
  | Already Authenticated
  |--------------------------------------------------------------------------
  */

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <AuthLayout
      title="Welcome back"
      description="Return to your calm and supportive UNWIND space."
    >

      <AuthAlert
        message={error}
      />


      {/* Google Login */}

      <GoogleAuthButton
        mode="login"
        disabled={loading}
      />


      {/* Divider */}

      <div className="auth-divider">
        <span>
          or
        </span>
      </div>


      {/* Existing Email / Password Login */}

     <form
  className="auth-form"
  onSubmit={handleSubmit}
  aria-busy={loading}
>

        <AuthInput
          label="Email or username"
          name="identifier"

          value={
            formData.identifier
          }

          onChange={
            updateField
          }

          placeholder="Enter your email or username"

          autoComplete="username"

          icon={
            UserRound
          }

          required
        />


        <AuthInput
          label="Password"
          name="password"
          type="password"

          value={
            formData.password
          }

          onChange={
            updateField
          }

          placeholder="Enter your password"

          autoComplete="current-password"

          icon={
            LockKeyhole
          }

          required
        />


        <div className="auth-form__options">

          <label className="auth-checkbox">

            <input
              type="checkbox"

              checked={
                rememberMe
              }

              onChange={(
                event
              ) =>
                setRememberMe(
                  event.target.checked
                )
              }
            />

            <span>
              Remember me
            </span>

          </label>


          <Link to="/forgot-password">
            Forgot password?
          </Link>

        </div>


        <button
          type="submit"

          className="auth-submit-button"

          disabled={
            loading
          }
        >
          {loading ? (
            <>
              <span className="auth-button-spinner" />

              Signing in…
            </>
          ) : (
            "Sign in to UNWIND"
          )}
        </button>

      </form>


      <p className="auth-switch-page">
        New to UNWIND?

        <Link to="/register">
          Create your account
        </Link>
      </p>

    </AuthLayout>
  );
}

export default LoginPage;