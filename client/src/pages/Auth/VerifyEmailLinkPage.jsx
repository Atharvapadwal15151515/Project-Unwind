import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";

import {
  CheckCircle2,
  LoaderCircle,
  XCircle
} from "lucide-react";

import AuthLayout
  from "../../components/auth/AuthLayout";

import {
  useAuth
} from "../../context/AuthContext";

import {
  verifyEmailLink
} from "../../services/authService";

import {
  getApiErrorMessage
} from "../../services/api";

import "./Auth.css";

function VerifyEmailLinkPage() {
  const [
    searchParams
  ] = useSearchParams();

  const navigate =
    useNavigate();

  const {
    refreshUser,
    isAuthenticated
  } = useAuth();

  const [
    status,
    setStatus
  ] = useState(
    "loading"
  );

  const [
    message,
    setMessage
  ] = useState(
    "Verifying your email…"
  );

  const userId =
    searchParams.get(
      "userId"
    );

  const token =
    searchParams.get(
      "token"
    );

  useEffect(() => {
    let active = true;

    const verify =
      async () => {
        if (
          !userId ||
          !token
        ) {
          if (!active) {
            return;
          }

          setStatus(
            "error"
          );

          setMessage(
            "This verification link is incomplete or invalid."
          );

          return;
        }

        try {
          const response =
            await verifyEmailLink({
              userId,
              token
            });

          /*
           * If the user registered in this
           * same browser, they should already
           * have a valid authenticated
           * session.
           *
           * Refresh /auth/me so AuthContext
           * receives email_verified: true.
           */
          try {
            await refreshUser();
          } catch (
            refreshError
          ) {
            console.warn(
              "Unable to refresh user after email verification:",
              refreshError
            );
          }

          if (!active) {
            return;
          }

          setStatus(
            "success"
          );

          setMessage(
            response?.message ||
              "Your email has been verified successfully."
          );

          /*
           * Give the success state a moment
           * to appear, then enter UNWIND.
           */
          window.setTimeout(
            () => {
              navigate(
                "/dashboard",
                {
                  replace: true
                }
              );
            },
            900
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setStatus(
            "error"
          );

          setMessage(
            getApiErrorMessage(
              error,
              "Unable to verify this email link."
            )
          );
        }
      };

    verify();

    return () => {
      active = false;
    };
  }, [
    token,
    userId,
    refreshUser,
    navigate
  ]);

  return (
    <AuthLayout
      title="Email verification"
      description="We are securely verifying your UNWIND account."
    >
      <div className="auth-result">
        {status ===
          "loading" && (
          <LoaderCircle
            className="auth-result__loader"
            size={45}
          />
        )}

        {status ===
          "success" && (
          <CheckCircle2
            className="auth-result__success"
            size={48}
          />
        )}

        {status ===
          "error" && (
          <XCircle
            className="auth-result__error"
            size={48}
          />
        )}

        <p>
          {message}
        </p>

        {status ===
          "success" && (
          <Link
            to="/dashboard"
            className="auth-submit-button"
          >
            Continue to UNWIND
          </Link>
        )}

        {status ===
          "error" && (
          <Link
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            className="auth-submit-button"
          >
            {isAuthenticated
              ? "Return to dashboard"
              : "Return to login"}
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailLinkPage;