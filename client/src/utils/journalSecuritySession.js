const JOURNAL_UNLOCK_SESSION_KEY =
  "unwind_journal_unlock_session";

export const JOURNAL_LOCKED_EVENT =
  "unwind:journal-locked";

function canUseSessionStorage() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.sessionStorage)
  );
}

export function clearJournalUnlockSession() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(
    JOURNAL_UNLOCK_SESSION_KEY
  );
}

export function getJournalUnlockSession() {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const storedSession =
      window.sessionStorage.getItem(
        JOURNAL_UNLOCK_SESSION_KEY
      );

    if (!storedSession) {
      return null;
    }

    const parsedSession =
      JSON.parse(storedSession);

    const journalUnlockToken =
      parsedSession?.journalUnlockToken;

    const expiresAt =
      parsedSession?.expiresAt;

    const expiryTime =
      new Date(expiresAt).getTime();

    if (
      !journalUnlockToken ||
      !expiresAt ||
      Number.isNaN(expiryTime) ||
      expiryTime <= Date.now()
    ) {
      clearJournalUnlockSession();
      return null;
    }

    return {
      journalUnlockToken,
      expiresAt
    };
  } catch {
    clearJournalUnlockSession();
    return null;
  }
}

export function setJournalUnlockSession({
  journalUnlockToken,
  expiresAt
}) {
  if (!canUseSessionStorage()) {
    return;
  }

  const expiryTime =
    new Date(expiresAt).getTime();

  if (
    !journalUnlockToken ||
    !expiresAt ||
    Number.isNaN(expiryTime)
  ) {
    throw new Error(
      "The Journal unlock response is incomplete."
    );
  }

  window.sessionStorage.setItem(
    JOURNAL_UNLOCK_SESSION_KEY,
    JSON.stringify({
      journalUnlockToken,
      expiresAt
    })
  );
}

export function getJournalUnlockToken() {
  return (
    getJournalUnlockSession()
      ?.journalUnlockToken || null
  );
}

export function notifyJournalLocked(
  message =
    "Your Journal is locked. Enter your PIN to continue."
) {
  clearJournalUnlockSession();

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      JOURNAL_LOCKED_EVENT,
      {
        detail: {
          message
        }
      }
    )
  );
}