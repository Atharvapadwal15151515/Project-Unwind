import {
  LoaderCircle,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  ShieldOff
} from "lucide-react";

function JournalSecurityBar({
  isSecurityEnabled,
  locking,
  onOpenSettings,
  onLock
}) {
  return (
    <section className="journal-security-bar">
      <span
        className={
          isSecurityEnabled
            ? "journal-security-bar__icon journal-security-bar__icon--active"
            : "journal-security-bar__icon"
        }
      >
        {isSecurityEnabled ? (
          <ShieldCheck size={19} />
        ) : (
          <ShieldOff size={19} />
        )}
      </span>

      <div className="journal-security-bar__copy">
        <strong>
          {isSecurityEnabled
            ? "Journal PIN protection is active"
            : "Add another layer of privacy"}
        </strong>
        <span>
          {isSecurityEnabled
            ? "This Journal is unlocked only for the current browser session."
            : "Create a separate PIN without changing your Unwind password."}
        </span>
      </div>

      <div className="journal-security-bar__actions">
        <button
          type="button"
          onClick={onOpenSettings}
        >
          <Settings2 size={16} />
          {isSecurityEnabled ? "Security settings" : "Set up PIN"}
        </button>

        {isSecurityEnabled ? (
          <button
            type="button"
            className="journal-security-bar__lock"
            onClick={onLock}
            disabled={locking}
          >
            {locking ? (
              <LoaderCircle
                className="journal-spin"
                size={16}
              />
            ) : (
              <LockKeyhole size={16} />
            )}
            {locking ? "Locking..." : "Lock Journal"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default JournalSecurityBar;