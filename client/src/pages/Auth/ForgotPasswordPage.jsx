import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";
import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import { requestPasswordReset } from "../../services/authService";
import { getApiErrorMessage } from "../../services/api";

import "./Auth.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response =
        await requestPasswordReset(
          email.trim().toLowerCase()
        );

      setSuccess(response.message);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to request a password reset."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we will send an OTP and secure reset link."
    >
      <AuthAlert message={error} />

      <AuthAlert
        type="success"
        message={success}
      />

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <AuthInput
          label="Email address"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="you@example.com"
          icon={Mail}
          required
        />

        <button
          type="submit"
          className="auth-submit-button"
          disabled={loading}
        >
          {loading
            ? "Sending reset instructions…"
            : "Send reset instructions"}
        </button>
      </form>

      {success && (
        <Link
          to="/reset-password-otp"
          state={{
            email: email.trim().toLowerCase()
          }}
          className="auth-secondary-button"
        >
          I have the OTP
        </Link>
      )}

      <p className="auth-switch-page">
        Remember your password?
        <Link to="/login">Return to login</Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;