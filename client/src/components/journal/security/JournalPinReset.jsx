import {
  ArrowLeft,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

import {
  useState
} from "react";

import OtpInput
  from "../../auth/OtpInput";

import JournalPinInput
  from "./JournalPinInput";

import JournalSecurityFeedback
  from "./JournalSecurityFeedback";

import {
  isValidJournalPin
} from "../../../utils/journalSecurityValidation";

function JournalPinReset({
  pendingAction,
  error,
  notice,
  onRequestOtp,
  onVerifyOtp,
  onResetPin,
  onBack,
  onComplete,
  onClearError,
  onClearNotice
}) {
  const [step, setStep] =
    useState("request");

  const [otp, setOtp] =
    useState("");

  const [resetToken, setResetToken] =
    useState("");

  const [newPin, setNewPin] =
    useState("");

  const [confirmNewPin, setConfirmNewPin] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const requesting =
    pendingAction === "request-reset";

  const verifying =
    pendingAction === "verify-reset";

  const resetting =
    pendingAction === "reset-pin";

  function clearFeedback() {
    setFormError("");
    onClearError();
  }

  async function handleRequestCode() {
    setFormError("");

    const sent =
      await onRequestOtp();

    if (sent) {
      setOtp("");
      setStep("verify");
    }
  }

  async function handleVerify(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setFormError(
        "Enter the complete 6-digit code."
      );

      return;
    }

    const verification =
      await onVerifyOtp(otp);

    if (!verification?.resetToken) {
      if (verification) {
        setFormError(
          "The reset response did not include a reset token."
        );
      }

      return;
    }

    setResetToken(
      verification.resetToken
    );

    setFormError("");
    setStep("new-pin");
  }

  async function handleReset(event) {
    event.preventDefault();

    if (!isValidJournalPin(newPin)) {
      setFormError(
        "Choose a PIN containing 4 to 6 digits."
      );

      return;
    }

    if (newPin !== confirmNewPin) {
      setFormError(
        "The new PINs do not match."
      );

      return;
    }

    const reset =
      await onResetPin({
        resetToken,
        newPin,
        confirmNewPin
      });

    if (reset) {
      setOtp("");
      setResetToken("");
      setNewPin("");
      setConfirmNewPin("");

      onComplete();
    }
  }

  return (
    <main className="journal-security-screen">
      <section className="journal-security-card">
        <button
          type="button"
          className="journal-security-back"
          onClick={onBack}
          disabled={
            requesting ||
            verifying ||
            resetting
          }
        >
          <ArrowLeft size={16} />
          Back to unlock
        </button>

        <div className="journal-security-card__mark">
          {step === "request" ? (
            <Mail size={31} />
          ) : (
            <KeyRound size={31} />
          )}
        </div>

        <span className="journal-security-eyebrow">
          PIN recovery
        </span>

        <h1>
          {step === "request" &&
            "Reset your Journal PIN"}

          {step === "verify" &&
            "Check your email"}

          {step === "new-pin" &&
            "Choose a new PIN"}
        </h1>

        <p className="journal-security-card__description">
          {step === "request" &&
            "We will send a one-time code to the email connected to your signed-in Unwind account."}

          {step === "verify" &&
            "Enter the 6-digit code we sent. It remains valid for 10 minutes."}

          {step === "new-pin" &&
            "Your email has been verified. Create a new 4–6 digit Journal PIN."}
        </p>

        <JournalSecurityFeedback
          type="error"
          message={error}
          onDismiss={onClearError}
        />

        <JournalSecurityFeedback
          type="success"
          message={notice}
          onDismiss={onClearNotice}
        />

        {step === "request" ? (
          <div className="journal-reset-request">
            <div>
              <ShieldCheck size={18} />

              <span>
                The code is sent only to your
                registered email. You do not
                need to enter your email again.
              </span>
            </div>

            <button
              type="button"
              className="journal-security-button journal-security-button--primary journal-security-button--full"
              onClick={handleRequestCode}
              disabled={requesting}
            >
              {requesting ? (
                <LoaderCircle
                  className="journal-spin"
                  size={18}
                />
              ) : (
                <Mail size={18} />
              )}

              {requesting
                ? "Sending code..."
                : "Send reset code"}
            </button>
          </div>
        ) : null}

        {step === "verify" ? (
          <form
            className="journal-security-form"
            onSubmit={handleVerify}
          >
            <div className="journal-otp-field">
              <span>
                6-digit verification code
              </span>

              <OtpInput
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  clearFeedback();
                }}
              />

              {formError ? (
                <small>{formError}</small>
              ) : null}
            </div>

            <button
              type="submit"
              className="journal-security-button journal-security-button--primary journal-security-button--full"
              disabled={
                verifying ||
                otp.length !== 6
              }
            >
              {verifying ? (
                <LoaderCircle
                  className="journal-spin"
                  size={18}
                />
              ) : (
                <ShieldCheck size={18} />
              )}

              {verifying
                ? "Verifying..."
                : "Verify code"}
            </button>

            <button
              type="button"
              className="journal-security-link"
              onClick={handleRequestCode}
              disabled={
                requesting ||
                verifying
              }
            >
              <RefreshCw size={14} />

              {requesting
                ? "Sending..."
                : "Send a new code"}
            </button>
          </form>
        ) : null}

        {step === "new-pin" ? (
          <form
            className="journal-security-form"
            onSubmit={handleReset}
          >
            <JournalPinInput
              id="journal-reset-new-pin"
              label="New Journal PIN"
              value={newPin}
              onChange={(value) => {
                setNewPin(value);
                clearFeedback();
              }}
              autoComplete="new-password"
              disabled={resetting}
            />

            <JournalPinInput
              id="journal-reset-confirm-pin"
              label="Confirm new Journal PIN"
              value={confirmNewPin}
              onChange={(value) => {
                setConfirmNewPin(value);
                clearFeedback();
              }}
              autoComplete="new-password"
              disabled={resetting}
              error={formError}
            />

            <button
              type="submit"
              className="journal-security-button journal-security-button--primary journal-security-button--full"
              disabled={resetting}
            >
              {resetting ? (
                <LoaderCircle
                  className="journal-spin"
                  size={18}
                />
              ) : (
                <KeyRound size={18} />
              )}

              {resetting
                ? "Resetting PIN..."
                : "Save new PIN"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

export default JournalPinReset;