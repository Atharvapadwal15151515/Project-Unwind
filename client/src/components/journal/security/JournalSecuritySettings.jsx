import {
  CalendarClock,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  ShieldOff,
  TriangleAlert,
  X
} from "lucide-react";
import {
  useEffect,
  useState
} from "react";

import JournalPinInput
  from "./JournalPinInput";
import JournalPinSetup
  from "./JournalPinSetup";
import JournalSecurityFeedback
  from "./JournalSecurityFeedback";
import {
  isValidJournalPin
} from "../../../utils/journalSecurityValidation";

function formatSecurityDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function JournalSecuritySettings({
  open,
  security,
  isSecurityEnabled,
  pendingAction,
  error,
  notice,
  onClose,
  onSetupPin,
  onChangePin,
  onDisablePin,
  onClearError,
  onClearNotice
}) {
  const [view, setView] = useState(
    isSecurityEnabled ? "overview" : "setup"
  );
  const [currentPin, setCurrentPin] =
    useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] =
    useState("");
  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape" && !pendingAction) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    onClose,
    open,
    pendingAction
  ]);

  if (!open) {
    return null;
  }

  const changing = pendingAction === "change";
  const disabling = pendingAction === "disable";
  const settingUp = pendingAction === "setup";

  function clearFormFeedback() {
    setFormError("");
    onClearError();
  }

  function showView(nextView) {
    setView(nextView);
    setCurrentPin("");
    setNewPin("");
    setConfirmNewPin("");
    setFormError("");
    onClearError();
    onClearNotice();
  }

  async function handleChangePin(event) {
    event.preventDefault();

    if (
      !isValidJournalPin(currentPin) ||
      !isValidJournalPin(newPin)
    ) {
      setFormError(
        "Both PINs must contain 4 to 6 digits."
      );
      return;
    }

    if (currentPin === newPin) {
      setFormError(
        "Your new PIN must be different from the current PIN."
      );
      return;
    }

    if (newPin !== confirmNewPin) {
      setFormError("The new PINs do not match.");
      return;
    }

    const changed = await onChangePin({
      currentPin,
      newPin,
      confirmNewPin
    });

    if (changed) {
      onClose();
    }
  }

  async function handleDisablePin(event) {
    event.preventDefault();

    if (!isValidJournalPin(currentPin)) {
      setFormError(
        "Enter your current 4–6 digit Journal PIN."
      );
      return;
    }

    const disabled = await onDisablePin(currentPin);

    if (disabled) {
      onClose();
    }
  }

  return (
    <div
      className="journal-security-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !pendingAction
        ) {
          onClose();
        }
      }}
    >
      <section
        className="journal-security-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-security-settings-title"
      >
        <header>
          <div>
            <span className="journal-security-eyebrow">
              <ShieldCheck size={14} />
              Privacy controls
            </span>
            <h2 id="journal-security-settings-title">
              Journal security
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(pendingAction)}
            aria-label="Close Journal security settings"
          >
            <X size={19} />
          </button>
        </header>

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

        {view === "setup" ? (
          <JournalPinSetup
            pending={settingUp}
            onSetupPin={async (payload) => {
              const created = await onSetupPin(payload);

              if (created) {
                onClose();
              }

              return created;
            }}
            onCancel={onClose}
          />
        ) : null}

        {view === "overview" ? (
          <div className="journal-security-overview">
            <div className="journal-security-status-card">
              <span>
                <ShieldCheck size={24} />
              </span>
              <div>
                <strong>PIN protection is active</strong>
                <p>
                  Journal entries need both your normal
                  account session and a separate Journal
                  unlock session.
                </p>
              </div>
            </div>

            <dl className="journal-security-details">
              <div>
                <dt>
                  <CalendarClock size={15} />
                  PIN last updated
                </dt>
                <dd>
                  {formatSecurityDate(
                    security?.pinUpdatedAt ||
                      security?.pinCreatedAt
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  <KeyRound size={15} />
                  Last unlocked
                </dt>
                <dd>
                  {formatSecurityDate(
                    security?.lastUnlockedAt
                  )}
                </dd>
              </div>
            </dl>

            <div className="journal-security-choice-list">
              <button
                type="button"
                onClick={() => showView("change")}
              >
                <KeyRound size={18} />
                <span>
                  <strong>Change Journal PIN</strong>
                  <small>
                    Existing unlock sessions will be revoked.
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="journal-security-choice--danger"
                onClick={() => showView("disable")}
              >
                <ShieldOff size={18} />
                <span>
                  <strong>Disable PIN protection</strong>
                  <small>
                    Your Journal will open after normal login.
                  </small>
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {view === "change" ? (
          <form
            className="journal-security-form"
            onSubmit={handleChangePin}
          >
            <div className="journal-security-form__intro">
              <span>
                <KeyRound size={22} />
              </span>
              <div>
                <h3>Change Journal PIN</h3>
                <p>
                  You will need to unlock the Journal again
                  using the new PIN.
                </p>
              </div>
            </div>

            <JournalPinInput
              id="journal-current-pin"
              label="Current Journal PIN"
              value={currentPin}
              onChange={(value) => {
                setCurrentPin(value);
                clearFormFeedback();
              }}
              autoComplete="current-password"
              disabled={changing}
            />

            <JournalPinInput
              id="journal-change-new-pin"
              label="New Journal PIN"
              value={newPin}
              onChange={(value) => {
                setNewPin(value);
                clearFormFeedback();
              }}
              autoComplete="new-password"
              disabled={changing}
            />

            <JournalPinInput
              id="journal-change-confirm-pin"
              label="Confirm new Journal PIN"
              value={confirmNewPin}
              onChange={(value) => {
                setConfirmNewPin(value);
                clearFormFeedback();
              }}
              autoComplete="new-password"
              disabled={changing}
              error={formError}
            />

            <div className="journal-security-form__actions">
              <button
                type="button"
                className="journal-security-button journal-security-button--secondary"
                onClick={() => showView("overview")}
                disabled={changing}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="journal-security-button journal-security-button--primary"
                disabled={changing}
              >
                {changing ? (
                  <LoaderCircle
                    className="journal-spin"
                    size={17}
                  />
                ) : (
                  <KeyRound size={17} />
                )}
                {changing ? "Changing PIN..." : "Change PIN"}
              </button>
            </div>
          </form>
        ) : null}

        {view === "disable" ? (
          <form
            className="journal-security-form"
            onSubmit={handleDisablePin}
          >
            <div className="journal-security-warning">
              <TriangleAlert size={21} />
              <div>
                <strong>Remove the second privacy layer?</strong>
                <p>
                  This does not delete your entries. It means
                  anyone with access to your signed-in Unwind
                  account can open the Journal without a PIN.
                </p>
              </div>
            </div>

            <JournalPinInput
              id="journal-disable-current-pin"
              label="Current Journal PIN"
              value={currentPin}
              onChange={(value) => {
                setCurrentPin(value);
                clearFormFeedback();
              }}
              autoComplete="current-password"
              disabled={disabling}
              error={formError}
            />

            <div className="journal-security-form__actions">
              <button
                type="button"
                className="journal-security-button journal-security-button--secondary"
                onClick={() => showView("overview")}
                disabled={disabling}
              >
                Keep protection
              </button>

              <button
                type="submit"
                className="journal-security-button journal-security-button--danger"
                disabled={disabling}
              >
                {disabling ? (
                  <LoaderCircle
                    className="journal-spin"
                    size={17}
                  />
                ) : (
                  <ShieldOff size={17} />
                )}
                {disabling ? "Disabling..." : "Disable PIN"}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}

export default JournalSecuritySettings;
