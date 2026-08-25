import {
  BookHeart,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";

import {
  useState
} from "react";

import JournalPinInput
  from "./JournalPinInput";

import JournalSecurityFeedback
  from "./JournalSecurityFeedback";

import {
  isValidJournalPin
} from "../../../utils/journalSecurityValidation";

function formatLockoutTime(
  totalSeconds
) {
  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function JournalUnlock({
  security,
  isLockedOut,
  lockoutSeconds,
  pending,
  error,
  notice,
  onUnlock,
  onForgotPin,
  onClearError,
  onClearNotice
}) {
  const [pin, setPin] =
    useState("");

  const [localError, setLocalError] =
    useState("");

  function handlePinChange(value) {
    setPin(value);
    setLocalError("");
    onClearError();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isValidJournalPin(pin)) {
      setLocalError(
        "Enter your 4–6 digit Journal PIN."
      );

      return;
    }

    const unlocked =
      await onUnlock(pin);

    if (!unlocked) {
      setPin("");
    }
  }

  return (
    <main className="journal-security-screen">
      <section className="journal-security-card journal-security-card--unlock">
        <div
          className="journal-security-card__mark"
          aria-hidden="true"
        >
          <BookHeart size={31} />

          <span>
            <LockKeyhole size={15} />
          </span>
        </div>

        <span className="journal-security-eyebrow">
          <ShieldCheck size={14} />
          Private Journal
        </span>

        <h1>
          Your thoughts are protected.
        </h1>

        <p className="journal-security-card__description">
          Enter your separate Journal PIN
          to continue. Your normal Unwind
          login remains active.
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

        {isLockedOut ? (
          <div
            className="journal-lockout"
            role="status"
          >
            <Clock3 size={18} />

            <div>
              <strong>
                Journal temporarily locked
              </strong>

              <span>
                Try again in{" "}
                {formatLockoutTime(
                  lockoutSeconds
                )}
              </span>
            </div>
          </div>
        ) : (
          <form
            className="journal-security-form"
            onSubmit={handleSubmit}
          >
            <JournalPinInput
              id="journal-unlock-pin"
              label="Journal PIN"
              value={pin}
              onChange={handlePinChange}
              autoComplete="current-password"
              autoFocus
              disabled={pending}
              error={localError}
            />

            {security?.failedAttempts >
            0 ? (
              <p className="journal-attempt-warning">
                {security.failedAttempts}{" "}
                unsuccessful
                {security.failedAttempts === 1
                  ? " attempt"
                  : " attempts"}{" "}
                recorded.
              </p>
            ) : null}

            <button
              type="submit"
              className="journal-security-button journal-security-button--primary journal-security-button--full"
              disabled={
                pending ||
                pin.length < 4
              }
            >
              {pending ? (
                <LoaderCircle
                  className="journal-spin"
                  size={18}
                />
              ) : (
                <LockKeyhole size={18} />
              )}

              {pending
                ? "Unlocking..."
                : "Unlock Journal"}
            </button>
          </form>
        )}

        <button
          type="button"
          className="journal-security-link"
          onClick={onForgotPin}
          disabled={pending}
        >
          Forgot your Journal PIN?
        </button>

        <small className="journal-security-card__footnote">
          Five incorrect attempts
          temporarily lock Journal access
          for 15 minutes.
        </small>
      </section>
    </main>
  );
}

export default JournalUnlock;