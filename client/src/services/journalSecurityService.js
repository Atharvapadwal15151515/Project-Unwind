import api, {
  getApiErrorMessage
} from "./api";

import {
  clearJournalUnlockSession,
  getJournalUnlockSession,
  setJournalUnlockSession
} from "../utils/journalSecuritySession";

function getSecurity(response) {
  return (
    response.data?.data?.security ||
    null
  );
}

export async function getJournalSecurityStatus() {
  const response = await api.get(
    "/journal/security/status"
  );

  return getSecurity(response);
}

export async function createJournalPin({
  pin,
  confirmPin
}) {
  const response = await api.post(
    "/journal/security/pin",
    {
      pin,
      confirmPin
    }
  );

  clearJournalUnlockSession();

  return getSecurity(response);
}

export async function unlockJournal(pin) {
  const response = await api.post(
    "/journal/security/unlock",
    {
      pin
    }
  );

  const unlockData =
    response.data?.data;

  setJournalUnlockSession({
    journalUnlockToken:
      unlockData?.journalUnlockToken,

    expiresAt:
      unlockData?.expiresAt
  });

  return getJournalUnlockSession();
}

export async function lockJournal() {
  try {
    const response = await api.post(
      "/journal/security/lock",
      {}
    );

    return response.data?.data;
  } finally {
    clearJournalUnlockSession();
  }
}

export async function changeJournalPin({
  currentPin,
  newPin,
  confirmNewPin
}) {
  const response = await api.patch(
    "/journal/security/pin",
    {
      currentPin,
      newPin,
      confirmNewPin
    }
  );

  clearJournalUnlockSession();

  return getSecurity(response);
}

export async function disableJournalPin(
  currentPin
) {
  const response = await api.delete(
    "/journal/security/pin",
    {
      data: {
        currentPin
      }
    }
  );

  clearJournalUnlockSession();

  return getSecurity(response);
}

export async function requestJournalPinResetOtp() {
  const response = await api.post(
    "/journal/security/pin/forgot",
    {}
  );

  return response.data;
}

export async function verifyJournalPinResetOtp(
  otp
) {
  const response = await api.post(
    "/journal/security/pin/reset/verify",
    {
      otp
    }
  );

  return response.data?.data;
}

export async function resetJournalPin({
  resetToken,
  newPin,
  confirmNewPin
}) {
  const response = await api.post(
    "/journal/security/pin/reset",
    {
      resetToken,
      newPin,
      confirmNewPin
    }
  );

  clearJournalUnlockSession();

  return getSecurity(response);
}

export function getJournalSecurityError(
  error,
  fallbackMessage =
    "We could not update your Journal security."
) {
  return getApiErrorMessage(
    error,
    fallbackMessage
  );
}