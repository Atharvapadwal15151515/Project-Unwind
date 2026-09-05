import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  MailCheck
} from "lucide-react";

import AuthLayout
  from "../../components/auth/AuthLayout";

import AuthAlert
  from "../../components/auth/AuthAlert";

import OtpInput
  from "../../components/auth/OtpInput";

  import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import {
  resendVerification,
  verifyEmailOtp
} from "../../services/authService";

import {
  getApiErrorMessage
} from "../../services/api";

import {
  useAuth
} from "../../context/AuthContext";

import "./Auth.css";

function VerifyEmailPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  /*
   * login() already handles device info
   * inside AuthContext.
   */
  const {
    login
  } = useAuth();

  const [
    email,
    setEmail
  ] = useState(
    location.state?.email ||
      ""
  );

  const [
    otp,
    setOtp
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    resending,
    setResending
  ] = useState(false);

  const [
    countdown,
    setCountdown
  ] = useState(0);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState(
    location.state?.message ||
      ""
  );

  /*
   * These exist only when the user
   * arrived here directly after
   * registration.
   */
  const registrationPassword =
    location.state?.password ||
    null;

  const newRegistration =
    location.state
      ?.newRegistration ===
    true;

  useEffect(() => {
    if (
      countdown <= 0
    ) {
      return undefined;
    }

    const timer =
      setInterval(() => {
        setCountdown(
          (currentValue) =>
            Math.max(
              currentValue - 1,
              0
            )
        );
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [countdown]);

  const handleVerify =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (!email.trim()) {
        setError(
          "Enter your email address."
        );

        return;
      }

      if (
        otp.length !== 6
      ) {
        setError(
          "Enter the complete 6-digit OTP."
        );

        return;
      }

      try {
        setLoading(true);

        /*
         * STEP 1:
         * Verify email first.
         */
        const response =
          await verifyEmailOtp({
            email:
              email
                .trim()
                .toLowerCase(),

            otp
          });

        setSuccess(
          response?.message ||
            "Email verified successfully."
        );

        /*
         * STEP 2:
         * If this is a brand-new
         * registration, log them in
         * only AFTER verification.
         */
        if (
          newRegistration &&
          registrationPassword
        ) {
          await login({
            identifier:
              email
                .trim()
                .toLowerCase(),

            password:
              registrationPassword,

            rememberMe: true
          });

          /*
           * STEP 3:
           * Enter dashboard.
           */
          setTimeout(() => {
            navigate(
              "/dashboard",
              {
                replace: true
              }
            );
          }, 700);

          return;
        }

        /*
         * Someone may reach this page
         * manually without coming from
         * registration.
         */
        setTimeout(() => {
          navigate(
            "/login",
            {
              replace: true,

              state: {
                message:
                  "Email verified successfully. Please sign in."
              }
            }
          );
        }, 900);
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to verify the OTP."
          )
        );
      } finally {
        setLoading(false);
      }
    };

  const handleResend =
    async () => {
      if (
        !email.trim() ||
        countdown > 0
      ) {
        return;
      }

      try {
        setResending(true);

        setError("");
        setSuccess("");

        const response =
          await resendVerification(
            email
              .trim()
              .toLowerCase()
          );

        setSuccess(
          response?.message ||
            "A new verification code has been sent."
        );

        setCountdown(60);
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to resend verification."
          )
        );
      } finally {
        setResending(false);
      }
    };

  return (
    <AuthLayout
      title="Verify your email"
      description="Enter the verification code sent to your email address."
    >
      <div className="auth-centred-icon">
        <MailCheck
          size={28}
        />
      </div>

      <AuthAlert
        message={error}
      />

      <AuthAlert
        type="success"
        message={success}
      />

      <form
  className="auth-form"
  onSubmit={handleVerify}
  aria-busy={
    loading || resending
  }

      >
        <label className="auth-field">
          <span className="auth-field__label">
            Email address
          </span>

          <span className="auth-field__control">
            <input
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              placeholder="you@example.com"
              required
            />
          </span>
        </label>

        <div className="auth-otp-section">
          <span>
            Verification code
          </span>

          <OtpInput
            value={otp}
            onChange={
              setOtp
            }
          />
        </div>

        <button
  type="submit"
  className="auth-submit-button"
  disabled={
    loading || resending
  }
>
  {loading ? (
    <ButtonLoader
      label={
        newRegistration
          ? "Verifying and signing you in…"
          : "Verifying email…"
      }
      size="small"
    />
  ) : (
    "Verify email"
  )}
</button>

       <button
  type="button"
  className="auth-secondary-button"
  disabled={
    loading ||
    resending ||
    countdown > 0
  }
  onClick={handleResend}
>
  {resending ? (
    <ButtonLoader
      label="Sending new code…"
      size="small"
    />
  ) : countdown > 0 ? (
    `Resend in ${countdown}s`
  ) : (
    "Resend verification code"
  )}
</button>
      </form>

      <p className="auth-switch-page">
        Already verified?{" "}
        <Link to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyEmailPage;