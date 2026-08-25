import {
  findUserById
} from "../../models/user.model.js";

import {
  createTemporaryToken,
  verifyTemporaryToken
} from "../token.service.js";

import {
  deleteUserTokens
} from "../../models/authToken.model.js";

import {
  sendJournalPinResetEmail
} from "../email.service.js";

import {
  resetJournalPinAfterVerification
} from "./journalSecurity.service.js";

import {
  findJournalSecurityByUserId
} from "../../models/journal/journalSecurity.model.js";

import AppError from "../../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Journal PIN reset configuration
|--------------------------------------------------------------------------
*/

const JOURNAL_PIN_RESET_TOKEN_TYPE =
  "journal_pin_reset";

const JOURNAL_PIN_RESET_OTP_EXPIRY_MINUTES =
  10;

const JOURNAL_PIN_RESET_TOKEN_EXPIRY_MINUTES =
  15;

const JOURNAL_PIN_RESET_MAXIMUM_ATTEMPTS =
  5;

/*
|--------------------------------------------------------------------------
| Request Journal PIN reset
|--------------------------------------------------------------------------
*/

export async function requestJournalPinReset(
  userId
) {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError(
      "User account not found",
      404
    );
  }

  const securitySettings =
    await findJournalSecurityByUserId(
      userId
    );

  if (
    !securitySettings ||
    !securitySettings
      .is_security_enabled ||
    !securitySettings.pin_hash
  ) {
    throw new AppError(
      "Journal PIN security is not enabled",
      400
    );
  }

  const recipientEmail =
    user.email
      ?.trim()
      .toLowerCase();

  if (!recipientEmail) {
    throw new AppError(
      "No email address is associated with this account",
      400
    );
  }

  /*
   * Remove previous reset OTPs and reset tokens
   * before creating a new OTP.
   */
  await deleteUserTokens(
    userId,
    JOURNAL_PIN_RESET_TOKEN_TYPE
  );

  const otpResult =
    await createTemporaryToken({
      userId,

      tokenType:
        JOURNAL_PIN_RESET_TOKEN_TYPE,

      deliveryMethod:
        "otp",

      expiresInMinutes:
        JOURNAL_PIN_RESET_OTP_EXPIRY_MINUTES
    });

  await sendJournalPinResetEmail({
    userId,

    recipientEmail,

    recipientName:
      user.username ||
      user.full_name ||
      "User",

    otp:
      otpResult.rawToken
  });

  return {
    expiresInMinutes:
      JOURNAL_PIN_RESET_OTP_EXPIRY_MINUTES
  };
}

/*
|--------------------------------------------------------------------------
| Verify Journal PIN reset OTP
|--------------------------------------------------------------------------
*/

export async function verifyJournalPinResetOtp({
  userId,
  otp
}) {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError(
      "User account not found",
      404
    );
  }

  const securitySettings =
    await findJournalSecurityByUserId(
      userId
    );

  if (
    !securitySettings ||
    !securitySettings
      .is_security_enabled ||
    !securitySettings.pin_hash
  ) {
    throw new AppError(
      "Journal PIN security is not enabled",
      400
    );
  }

  const verification =
    await verifyTemporaryToken({
      userId,

      rawToken:
        otp.trim(),

      tokenType:
        JOURNAL_PIN_RESET_TOKEN_TYPE,

      deliveryMethod:
        "otp",

      maximumAttempts:
        JOURNAL_PIN_RESET_MAXIMUM_ATTEMPTS
    });

  if (!verification.success) {
    if (
      verification.reason ===
      "maximum_attempts"
    ) {
      throw new AppError(
        "Too many incorrect OTP attempts. Request a new Journal PIN reset OTP.",
        429
      );
    }

    throw new AppError(
      "Invalid or expired Journal PIN reset OTP",
      400
    );
  }

  const resetTokenResult =
    await createTemporaryToken({
      userId,

      tokenType:
        JOURNAL_PIN_RESET_TOKEN_TYPE,

      deliveryMethod:
        "link",

      expiresInMinutes:
        JOURNAL_PIN_RESET_TOKEN_EXPIRY_MINUTES
    });

  return {
    resetToken:
      resetTokenResult.rawToken,

    expiresInMinutes:
      JOURNAL_PIN_RESET_TOKEN_EXPIRY_MINUTES
  };
}

/*
|--------------------------------------------------------------------------
| Complete Journal PIN reset
|--------------------------------------------------------------------------
*/

export async function completeJournalPinReset({
  userId,
  resetToken,
  newPin
}) {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError(
      "User account not found",
      404
    );
  }

  const verification =
    await verifyTemporaryToken({
      userId,

      rawToken:
        resetToken.trim(),

      tokenType:
        JOURNAL_PIN_RESET_TOKEN_TYPE,

      deliveryMethod:
        "link",

      maximumAttempts:
        JOURNAL_PIN_RESET_MAXIMUM_ATTEMPTS
    });

  if (!verification.success) {
    if (
      verification.reason ===
      "maximum_attempts"
    ) {
      throw new AppError(
        "Too many invalid Journal PIN reset attempts. Request a new OTP.",
        429
      );
    }

    throw new AppError(
      "Invalid or expired Journal PIN reset token",
      400
    );
  }

  const securityStatus =
    await resetJournalPinAfterVerification(
      userId,
      newPin
    );

  await deleteUserTokens(
    userId,
    JOURNAL_PIN_RESET_TOKEN_TYPE
  );

  return securityStatus;
}