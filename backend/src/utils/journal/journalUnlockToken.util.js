import crypto from "crypto";

import { hashToken } from "../hashToken.js";

const DEFAULT_UNLOCK_HOURS = 12;

/*
|--------------------------------------------------------------------------
| Generate Journal unlock token
|--------------------------------------------------------------------------
| The raw token is returned to the frontend only once.
| Only its hash is stored in PostgreSQL.
*/

export function generateJournalUnlockToken() {
  const rawToken =
    crypto.randomBytes(48).toString("hex");

  const tokenHash =
    hashToken(rawToken);

  return {
    rawToken,
    tokenHash
  };
}

/*
|--------------------------------------------------------------------------
| Hash received Journal unlock token
|--------------------------------------------------------------------------
| Used by the unlock middleware when validating
| X-Journal-Unlock-Token.
*/

export function hashJournalUnlockToken(
  rawToken
) {
  return hashToken(rawToken);
}

/*
|--------------------------------------------------------------------------
| Create Journal unlock expiry
|--------------------------------------------------------------------------
*/

export function createJournalUnlockExpiry() {
  const configuredHours = Number(
    process.env
      .JOURNAL_UNLOCK_TOKEN_EXPIRES_HOURS
  );

  const expiresInHours =
    Number.isFinite(configuredHours) &&
    configuredHours > 0
      ? configuredHours
      : DEFAULT_UNLOCK_HOURS;

  return new Date(
    Date.now() +
      expiresInHours *
        60 *
        60 *
        1000
  );
}

/*
|--------------------------------------------------------------------------
| Check Journal unlock expiry
|--------------------------------------------------------------------------
*/

export function isJournalUnlockExpired(
  expiresAt
) {
  if (!expiresAt) {
    return true;
  }

  const expiryTime =
    new Date(
      expiresAt
    ).getTime();

  if (
    Number.isNaN(expiryTime)
  ) {
    return true;
  }

  return Date.now() >= expiryTime;
}