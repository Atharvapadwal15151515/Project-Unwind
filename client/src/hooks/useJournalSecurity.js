import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  changeJournalPin,
  createJournalPin,
  disableJournalPin,
  getJournalSecurityError,
  getJournalSecurityStatus,
  lockJournal,
  requestJournalPinResetOtp,
  resetJournalPin,
  unlockJournal,
  verifyJournalPinResetOtp
} from "../services/journalSecurityService";

import {
  clearJournalUnlockSession,
  getJournalUnlockSession,
  JOURNAL_LOCKED_EVENT
} from "../utils/journalSecuritySession";

export function useJournalSecurity() {
  const [security, setSecurity] =
    useState(null);

  const [initializing, setInitializing] =
    useState(true);

  const [isUnlocked, setIsUnlocked] =
    useState(false);

  const [pendingAction, setPendingAction] =
    useState("");

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [clock, setClock] =
    useState(0);

  const applySecurityStatus = useCallback(
    (nextSecurity) => {
      setSecurity(nextSecurity);
      setClock(Date.now());

      if (
        !nextSecurity?.isSecurityEnabled
      ) {
        clearJournalUnlockSession();
        setIsUnlocked(true);
        return;
      }

      setIsUnlocked(
        Boolean(
          getJournalUnlockSession()
        )
      );
    },
    []
  );

 const refreshSecurityStatus = useCallback(
  async () => {
    try {
      const nextSecurity =
        await getJournalSecurityStatus();

      applySecurityStatus(nextSecurity);

      return nextSecurity;
    } catch (requestError) {
      setError(
        getJournalSecurityError(
          requestError,
          "Your Journal security status could not be loaded."
        )
      );

      throw requestError;
    }
  },
  [applySecurityStatus]
);

  const runAction = useCallback(
    async ({
      name,
      request,
      fallbackMessage
    }) => {
      setPendingAction(name);
      setError("");
      setNotice("");

      try {
        return {
          ok: true,
          data: await request()
        };
      } catch (requestError) {
        setError(
          getJournalSecurityError(
            requestError,
            fallbackMessage
          )
        );

        return {
          ok: false,
          error: requestError
        };
      } finally {
        setPendingAction("");
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    getJournalSecurityStatus()
      .then((nextSecurity) => {
        if (active) {
          applySecurityStatus(
            nextSecurity
          );
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            getJournalSecurityError(
              requestError,
              "Your Journal security status could not be loaded."
            )
          );
        }
      })
      .finally(() => {
        if (active) {
          setInitializing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applySecurityStatus]);

  /*
   * Listen for expired, revoked or missing
   * Journal unlock-token responses.
   */
  useEffect(() => {
    const handleJournalLocked = (
      event
    ) => {
      setIsUnlocked(false);
      setNotice("");

      setError(
        event.detail?.message ||
          "Your Journal is locked. Enter your PIN to continue."
      );

      getJournalSecurityStatus()
        .then(applySecurityStatus)
        .catch(() => {});
    };

    window.addEventListener(
      JOURNAL_LOCKED_EVENT,
      handleJournalLocked
    );

    return () => {
      window.removeEventListener(
        JOURNAL_LOCKED_EVENT,
        handleJournalLocked
      );
    };
  }, [applySecurityStatus]);

  /*
   * Automatically return to the PIN screen
   * when the locally stored unlock session expires.
   */
  useEffect(() => {
    if (
      !security?.isSecurityEnabled ||
      !isUnlocked
    ) {
      return undefined;
    }

    const storedSession =
      getJournalUnlockSession();

    if (!storedSession) {
      return undefined;
    }

    const millisecondsUntilExpiry =
      new Date(
        storedSession.expiresAt
      ).getTime() - Date.now();

    const expiryTimer =
      window.setTimeout(
        () => {
          clearJournalUnlockSession();
          setIsUnlocked(false);
          setNotice("");

          setError(
            "Your Journal unlock session expired. Enter your PIN again."
          );
        },
        millisecondsUntilExpiry
      );

    return () =>
      window.clearTimeout(
        expiryTimer
      );
  }, [
    isUnlocked,
    security?.isSecurityEnabled
  ]);

  /*
   * Countdown for the backend's
   * 15-minute, five-attempt lockout.
   */
  useEffect(() => {
    if (
      !security?.isLocked ||
      !security?.lockedUntil
    ) {
      return undefined;
    }

    const updateClock = () => {
      const currentTime =
        Date.now();

      setClock(currentTime);

      if (
        new Date(
          security.lockedUntil
        ).getTime() <= currentTime
      ) {
        setSecurity(
          (currentSecurity) => ({
            ...currentSecurity,
            isLocked: false,
            lockedUntil: null,
            failedAttempts: 0
          })
        );
      }
    };

    updateClock();

    const countdownTimer =
      window.setInterval(
        updateClock,
        1000
      );

    return () =>
      window.clearInterval(
        countdownTimer
      );
  }, [
    security?.isLocked,
    security?.lockedUntil
  ]);

  const setupPin = useCallback(
    async (payload) => {
      const result = await runAction({
        name: "setup",

        request: () =>
          createJournalPin(
            payload
          ),

        fallbackMessage:
          "Your Journal PIN could not be created."
      });

      if (!result.ok) {
        return false;
      }

      setSecurity(result.data);
      setIsUnlocked(false);

      setNotice(
        "Journal PIN created. Enter it once to unlock your Journal."
      );

      return true;
    },
    [runAction]
  );

  const unlock = useCallback(
    async (pin) => {
      const result = await runAction({
        name: "unlock",

        request: () =>
          unlockJournal(pin),

        fallbackMessage:
          "Your Journal could not be unlocked."
      });

      if (!result.ok) {
  const responseStatus =
    result.error?.response?.status;

  if (
    responseStatus === 401 ||
    responseStatus === 423
  ) {
    try {
      await refreshSecurityStatus();
    } catch {
      // Keep the original unlock error visible.
    }
  }

  setIsUnlocked(false);

  return false;
}

      setSecurity(
        (currentSecurity) => ({
          ...currentSecurity,
          isLocked: false,
          lockedUntil: null,
          failedAttempts: 0,
          lastUnlockedAt:
            new Date().toISOString()
        })
      );

      setIsUnlocked(true);

      return true;
    },
    [
      refreshSecurityStatus,
      runAction
    ]
  );

  const lock = useCallback(
    async () => {
      const result = await runAction({
        name: "lock",

        request:
          lockJournal,

        fallbackMessage:
          "The server session could not be revoked, but this browser has been locked."
      });

      setIsUnlocked(false);

      if (result.ok) {
        setNotice(
          "Your Journal has been locked."
        );
      }

      return result.ok;
    },
    [runAction]
  );

  const changePin = useCallback(
    async (payload) => {
      const result = await runAction({
        name: "change",

        request: () =>
          changeJournalPin(
            payload
          ),

        fallbackMessage:
          "Your Journal PIN could not be changed."
      });

      if (!result.ok) {
        return false;
      }

      setSecurity(result.data);
      setIsUnlocked(false);

      setNotice(
        "Journal PIN changed. Unlock your Journal with the new PIN."
      );

      return true;
    },
    [runAction]
  );

  const disablePin = useCallback(
    async (currentPin) => {
      const result = await runAction({
        name: "disable",

        request: () =>
          disableJournalPin(
            currentPin
          ),

        fallbackMessage:
          "Journal PIN protection could not be disabled."
      });

      if (!result.ok) {
        return false;
      }

      setSecurity(result.data);
      setIsUnlocked(true);

      setNotice(
        "Journal PIN protection has been disabled."
      );

      return true;
    },
    [runAction]
  );

  const requestResetOtp =
    useCallback(async () => {
      const result = await runAction({
        name: "request-reset",

        request:
          requestJournalPinResetOtp,

        fallbackMessage:
          "A Journal PIN reset code could not be sent."
      });

      if (result.ok) {
        setNotice(
          "A 6-digit reset code was sent to your registered email."
        );
      }

      return result.ok;
    }, [runAction]);

  const verifyResetOtp =
    useCallback(
      async (otp) => {
        const result =
          await runAction({
            name: "verify-reset",

            request: () =>
              verifyJournalPinResetOtp(
                otp
              ),

            fallbackMessage:
              "The reset code could not be verified."
          });

        if (!result.ok) {
          return null;
        }

        setNotice(
          "Code verified. Choose your new Journal PIN."
        );

        return result.data;
      },
      [runAction]
    );

  const resetPin = useCallback(
    async (payload) => {
      const result = await runAction({
        name: "reset-pin",

        request: () =>
          resetJournalPin(
            payload
          ),

        fallbackMessage:
          "Your Journal PIN could not be reset."
      });

      if (!result.ok) {
        return false;
      }

      setSecurity(result.data);
      setIsUnlocked(false);

      setNotice(
        "Journal PIN reset successfully. Unlock your Journal with the new PIN."
      );

      return true;
    },
    [runAction]
  );

  let lockoutSeconds = 0;

  if (
    security?.isLocked &&
    security?.lockedUntil
  ) {
    lockoutSeconds = Math.max(
      0,
      Math.ceil(
        (
          new Date(
            security.lockedUntil
          ).getTime() - clock
        ) / 1000
      )
    );
  }

  const isSecurityEnabled =
    Boolean(
      security?.isSecurityEnabled
    );

  return {
    security,
    initializing,
    isSecurityEnabled,
    isUnlocked,

    canAccessJournal:
      Boolean(security) &&
      (
        !isSecurityEnabled ||
        isUnlocked
      ),

    requiresUnlock:
      isSecurityEnabled &&
      !isUnlocked,

    isLockedOut:
      lockoutSeconds > 0,

    lockoutSeconds,
    pendingAction,
    error,
    notice,

    clearError: () =>
      setError(""),

    clearNotice: () =>
      setNotice(""),

    refreshSecurityStatus,
    setupPin,
    unlock,
    lock,
    changePin,
    disablePin,
    requestResetOtp,
    verifyResetOtp,
    resetPin
  };
}