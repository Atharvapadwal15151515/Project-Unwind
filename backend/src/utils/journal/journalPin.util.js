import {
  hashPassword,
  comparePasswords
} from "../hashPassword.js";

const JOURNAL_PIN_PATTERN =
  /^\d{4,6}$/;

export const MAX_JOURNAL_PIN_ATTEMPTS = 5;

export const JOURNAL_PIN_LOCKOUT_MINUTES = 15;

/*
|--------------------------------------------------------------------------
| Validate Journal PIN format
|--------------------------------------------------------------------------
| PIN must:
| - remain a string
| - contain only digits
| - contain between 4 and 6 digits
|
| Values such as "0048" remain valid.
*/

export function isValidJournalPin(pin) {
  return (
    typeof pin === "string" &&
    JOURNAL_PIN_PATTERN.test(pin)
  );
}

/*
|--------------------------------------------------------------------------
| Hash Journal PIN
|--------------------------------------------------------------------------
| Reuses the existing bcrypt password hashing utility.
*/

export async function hashJournalPin(pin) {
  return hashPassword(pin);
}

/*
|--------------------------------------------------------------------------
| Compare Journal PIN
|--------------------------------------------------------------------------
| Compares a plain PIN against the stored bcrypt hash.
*/

export async function compareJournalPin(
  pin,
  pinHash
) {
  if (!pinHash) {
    return false;
  }

  return comparePasswords(
    pin,
    pinHash
  );
}

/*
|--------------------------------------------------------------------------
| Calculate PIN lockout expiry
|--------------------------------------------------------------------------
*/

export function createJournalLockoutTime() {
  return new Date(
    Date.now() +
      JOURNAL_PIN_LOCKOUT_MINUTES *
        60 *
        1000
  );
}

/*
|--------------------------------------------------------------------------
| Check whether PIN verification is locked
|--------------------------------------------------------------------------
*/

export function isJournalPinLocked(
  lockedUntil
) {
  if (!lockedUntil) {
    return false;
  }

  return (
    new Date(lockedUntil).getTime() >
    Date.now()
  );
}

/*
|--------------------------------------------------------------------------
| Calculate remaining lockout seconds
|--------------------------------------------------------------------------
*/

export function getJournalLockoutRemainingSeconds(
  lockedUntil
) {
  if (!lockedUntil) {
    return 0;
  }

  const remainingMilliseconds =
    new Date(lockedUntil).getTime() -
    Date.now();

  if (remainingMilliseconds <= 0) {
    return 0;
  }

  return Math.ceil(
    remainingMilliseconds / 1000
  );
}