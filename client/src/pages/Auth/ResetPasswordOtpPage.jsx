import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import {
  LockKeyhole,
  Mail
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";
import OtpInput from "../../components/auth/OtpInput";
import PasswordStrength from "../../components/auth/PasswordStrength";

import { resetPasswordWithOtp } from "../../services/authService";
import { getApiErrorMessage } from "../../services/api";

import "./Auth.css";

function ResetPasswordOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    location.state?.email || ""
  );

  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (otp.length !== 6) {
      setError("Enter the complete 6-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "The new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPasswordWithOtp({
        email: email.trim().toLowerCase(),
        otp,
        newPassword
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Password reset successfully. Please log in again."
        }
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to reset the password."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create a new password"
      description="Enter the OTP from your email and choose a secure new password."
    >
      <AuthAlert message={error} />

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
          icon={Mail}
          required
        />

        <div className="auth-otp-section">
          <span>Reset OTP</span>

          <OtpInput
            value={otp}
            onChange={setOtp}
          />
        </div>

        <AuthInput
          label="New password"
          type="password"
          value={newPassword}
          onChange={(event) =>
            setNewPassword(event.target.value)
          }
          icon={LockKeyhole}
          autoComplete="new-password"
          required
        />

        <PasswordStrength
          password={newPassword}
        />

        <AuthInput
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              event.target.value
            )
          }
          icon={LockKeyhole}
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          className="auth-submit-button"
          disabled={loading}
        >
          {loading
            ? "Resetting password…"
            : "Reset password"}
        </button>
      </form>

      <p className="auth-switch-page">
        Need a new OTP?
        <Link to="/forgot-password">
          Request another reset
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPasswordOtpPage;