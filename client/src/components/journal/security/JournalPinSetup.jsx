import {
  LoaderCircle,
  ShieldCheck
} from "lucide-react";

import {
  useState
} from "react";

import JournalPinInput
  from "./JournalPinInput";

import {
  isValidJournalPin
} from "../../../utils/journalSecurityValidation";

function JournalPinSetup({
  onSetupPin,
  pending = false,
  onCancel
}) {
  const [pin, setPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  const [formError, setFormError] =
    useState("");

  function updatePin(value) {
    setPin(value);
    setFormError("");
  }

  function updateConfirmPin(value) {
    setConfirmPin(value);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isValidJournalPin(pin)) {
      setFormError(
        "Choose a PIN containing 4 to 6 digits."
      );

      return;
    }

    if (pin !== confirmPin) {
      setFormError(
        "The PINs do not match."
      );

      return;
    }

    const created =
      await onSetupPin({
        pin,
        confirmPin
      });

    if (created) {
      setPin("");
      setConfirmPin("");
    }
  }

  return (
    <form
      className="journal-security-form"
      onSubmit={handleSubmit}
    >
      <div className="journal-security-form__intro">
        <span>
          <ShieldCheck size={22} />
        </span>

        <div>
          <h3>Create a Journal PIN</h3>

          <p>
            Add a private 4–6 digit PIN
            that is separate from your
            Unwind password.
          </p>
        </div>
      </div>

      <JournalPinInput
        id="journal-new-pin"
        label="New Journal PIN"
        value={pin}
        onChange={updatePin}
        autoComplete="new-password"
        disabled={pending}
      />

      <JournalPinInput
        id="journal-confirm-pin"
        label="Confirm Journal PIN"
        value={confirmPin}
        onChange={updateConfirmPin}
        autoComplete="new-password"
        disabled={pending}
        error={formError}
      />

      <p className="journal-security-form__hint">
        Avoid obvious PINs such as 1234
        or your birth year. Leading zeroes
        are supported.
      </p>

      <div className="journal-security-form__actions">
        {onCancel ? (
          <button
            type="button"
            className="journal-security-button journal-security-button--secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          className="journal-security-button journal-security-button--primary"
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle
              className="journal-spin"
              size={17}
            />
          ) : (
            <ShieldCheck size={17} />
          )}

          {pending
            ? "Creating PIN..."
            : "Enable PIN protection"}
        </button>
      </div>
    </form>
  );
}

export default JournalPinSetup;