import {
  LoaderCircle,
  RefreshCw,
  ShieldAlert
} from "lucide-react";

import {
  useState
} from "react";

import JournalPinReset
  from "./JournalPinReset";

import JournalSecurityFeedback
  from "./JournalSecurityFeedback";

import JournalUnlock
  from "./JournalUnlock";

import "./JournalSecurity.css";

function JournalSecurityGate({
  journalSecurity,
  children
}) {
  const [screen, setScreen] =
    useState("unlock");

  const [retrying, setRetrying] =
    useState(false);

  const {
    security,
    initializing,
    canAccessJournal,
    requiresUnlock,
    isLockedOut,
    lockoutSeconds,
    pendingAction,
    error,
    notice,
    clearError,
    clearNotice,
    refreshSecurityStatus,
    unlock,
    requestResetOtp,
    verifyResetOtp,
    resetPin
  } = journalSecurity;

  async function retrySecurityStatus() {
    setRetrying(true);
    clearError();

    try {
      await refreshSecurityStatus();
    } catch {
      // The hook displays the request error.
    } finally {
      setRetrying(false);
    }
  }

  if (initializing) {
    return (
      <main className="journal-security-screen">
        <section className="journal-security-state">
          <LoaderCircle
            className="journal-spin"
            size={28}
          />

          <h2>
            Checking Journal privacy...
          </h2>

          <p>
            We are confirming whether this
            Journal needs a separate PIN.
          </p>
        </section>
      </main>
    );
  }

  if (!security) {
    return (
      <main className="journal-security-screen">
        <section className="journal-security-state">
          <ShieldAlert size={31} />

          <h2>
            Journal security could not
            be checked
          </h2>

          <p>
            Journal entries will stay hidden
            until the security status is
            available.
          </p>

          <JournalSecurityFeedback
            message={error}
          />

          <button
            type="button"
            className="journal-security-button journal-security-button--primary"
            onClick={retrySecurityStatus}
            disabled={retrying}
          >
            {retrying ? (
              <LoaderCircle
                className="journal-spin"
                size={17}
              />
            ) : (
              <RefreshCw size={17} />
            )}

            {retrying
              ? "Checking..."
              : "Try again"}
          </button>
        </section>
      </main>
    );
  }

  if (requiresUnlock) {
    if (screen === "reset") {
      return (
        <JournalPinReset
          pendingAction={pendingAction}
          error={error}
          notice={notice}
          onRequestOtp={requestResetOtp}
          onVerifyOtp={verifyResetOtp}
          onResetPin={resetPin}
          onBack={() => {
            clearError();
            clearNotice();
            setScreen("unlock");
          }}
          onComplete={() => {
            setScreen("unlock");
          }}
          onClearError={clearError}
          onClearNotice={clearNotice}
        />
      );
    }

    return (
      <JournalUnlock
        security={security}
        isLockedOut={isLockedOut}
        lockoutSeconds={lockoutSeconds}
        pending={
          pendingAction === "unlock"
        }
        error={error}
        notice={notice}
        onUnlock={unlock}
        onForgotPin={() => {
          clearError();
          clearNotice();
          setScreen("reset");
        }}
        onClearError={clearError}
        onClearNotice={clearNotice}
      />
    );
  }

  if (!canAccessJournal) {
    return null;
  }

  return children;
}

export default JournalSecurityGate;