import {
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";
import UnwindLogo from "../../components/common/UnwindLogo";
import {
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle
} from "lucide-react";

import {
  verifyAdminAccess
} from "../../services/admin/adminAccess.service";

import "./adminAccessPage.css";


function AdminAccessPage() {
  const navigate =
    useNavigate();

  const [
    password,
    setPassword
  ] = useState("");

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!password.trim()) {
        setError(
          "Enter the admin password."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        await verifyAdminAccess(
          password
        );

        navigate(
          "/admin",
          {
            replace: true
          }
        );

      } catch (err) {
        setError(
          err?.response?.data?.message ||
          "Unable to verify admin access."
        );

      } finally {
        setLoading(false);
      }
    };


  return (
    <main className="admin-access-page">
      <section className="admin-access-card">

       <UnwindLogo
  variant="symbol"
  theme="dark"
  className="admin-access-logo"
/>

        <div className="admin-access-heading">
          <span className="admin-access-eyebrow">
            UNWIND ADMIN
          </span>

          <h1>
            Admin verification
          </h1>

          <p>
            Enter the admin password to
            continue to the moderation
            panel.
          </p>
        </div>


        <form
          className="admin-access-form"
          onSubmit={handleSubmit}
        >
          <label
            htmlFor="admin-password"
            className="admin-access-label"
          >
            Admin password
          </label>

          <div className="admin-access-input-wrapper">
            <LockKeyhole
              size={18}
              className="admin-access-input-icon"
            />

            <input
              id="admin-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );

                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter admin password"
              autoComplete="current-password"
              disabled={loading}
            />

            <button
              type="button"
              className="admin-access-password-toggle"
              onClick={() =>
                setShowPassword(
                  (current) =>
                    !current
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>


          {error && (
            <div
              className="admin-access-error"
              role="alert"
            >
              {error}
            </div>
          )}


          <button
            type="submit"
            className="admin-access-submit"
            disabled={
              loading ||
              !password.trim()
            }
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={18}
                  className="admin-access-spinner"
                />

                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Continue to Admin
              </>
            )}
          </button>
        </form>


        <p className="admin-access-security">
          This area is restricted to
          authorized Unwind administrators.
        </p>

      </section>
    </main>
  );
}

export default AdminAccessPage;