import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { LockKeyhole } from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";
import PasswordStrength from "../../components/auth/PasswordStrength";
import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import { resetPasswordWithLink } from "../../services/authService";
import { getApiErrorMessage } from "../../services/api";

import "./Auth.css";

function ResetPasswordLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const invalidResetLink =
  !userId || !token;

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

    if (!userId || !token) {
      setError(
        "This reset link is incomplete or invalid."
      );

      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPasswordWithLink({
        userId,
        token,
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
          "Unable to reset your password."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      description="Secure your UNWIND account with a new password."
    >
      <AuthAlert
  message={
    invalidResetLink
      ? "This password reset link is incomplete, invalid or expired."
      : error
  }
/>

      {!invalidResetLink && (
  <form
    className="auth-form"
    onSubmit={handleSubmit}
    aria-busy={loading}
  >
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
            ? "Updating password…"
            : "Update password"}
        </button>
        </form>
)}

      <p className="auth-switch-page">
        Link not working?
        <Link to="/forgot-password">
          Request another one
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPasswordLinkPage;