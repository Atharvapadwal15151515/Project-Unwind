import {
  findUserById,
  deleteUser
} from "../models/user.model.js";

import {
  findProfileByUserId
} from "../models/profile.model.js";

import {
  createTemporaryToken,
  verifyTemporaryToken
} from "./token.service.js";

import {
  sendAccountDeletionOtpEmail
} from "./email.service.js";

import {
  endAllUserSessions
} from "./session.service.js";

import {
  deleteCloudinaryImage
} from "./cloudinary.service.js";

import AppError
  from "../utils/AppError.js";


const ACCOUNT_DELETION_TOKEN_TYPE =
  "account_deletion";

const ACCOUNT_DELETION_OTP_EXPIRY_MINUTES =
  10;

const ACCOUNT_DELETION_TOKEN_EXPIRY_MINUTES =
  10;

const ACCOUNT_DELETION_MAX_ATTEMPTS =
  5;


/*
|--------------------------------------------------------------------------
| Request Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function requestAccountDeletionOtp(
  userId
) {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  if (!user.email) {
    throw new AppError(
      "No email address is associated with this account",
      400
    );
  }

  const {
    rawToken: otp
  } =
    await createTemporaryToken({
      userId,
      tokenType:
        ACCOUNT_DELETION_TOKEN_TYPE,
      deliveryMethod: "otp",
      expiresInMinutes:
        ACCOUNT_DELETION_OTP_EXPIRY_MINUTES
    });

  try {
    await sendAccountDeletionOtpEmail({
      userId,
      recipientEmail: user.email,
      recipientName:
        user.username || null,
      otp
    });
  } catch (error) {
    throw new AppError(
      "Unable to send account deletion verification code",
      500
    );
  }

  return {
    expiresInMinutes:
      ACCOUNT_DELETION_OTP_EXPIRY_MINUTES
  };
}


/*
|--------------------------------------------------------------------------
| Verify Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function verifyAccountDeletionOtp({
  userId,
  otp
}) {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  const verification =
    await verifyTemporaryToken({
      userId,
      rawToken: otp,
      tokenType:
        ACCOUNT_DELETION_TOKEN_TYPE,
      deliveryMethod: "otp",
      maximumAttempts:
        ACCOUNT_DELETION_MAX_ATTEMPTS
    });

  if (!verification.success) {
    if (
      verification.reason ===
      "maximum_attempts"
    ) {
      throw new AppError(
        "Too many incorrect verification attempts. Request a new code.",
        429
      );
    }

    if (
      verification.reason ===
      "expired_or_missing"
    ) {
      throw new AppError(
        "Verification code is invalid or has expired",
        400
      );
    }

    throw new AppError(
      "Incorrect verification code",
      400
    );
  }

  /*
   * OTP has now been marked as used.
   *
   * Create a separate short-lived token
   * that authorizes the final account
   * deletion request.
   */

  const {
    rawToken: deletionToken
  } =
    await createTemporaryToken({
      userId,
      tokenType:
        ACCOUNT_DELETION_TOKEN_TYPE,
      deliveryMethod: "link",
      expiresInMinutes:
        ACCOUNT_DELETION_TOKEN_EXPIRY_MINUTES
    });

  return {
    deletionToken,

    expiresInMinutes:
      ACCOUNT_DELETION_TOKEN_EXPIRY_MINUTES
  };
}


/*
|--------------------------------------------------------------------------
| Permanently Delete Account
|--------------------------------------------------------------------------
*/

export async function deleteAccount({
  userId,
  deletionToken,
  confirmation
}) {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  if (confirmation !== "DELETE") {
    throw new AppError(
      "Type DELETE to confirm account deletion",
      400
    );
  }

  const verification =
    await verifyTemporaryToken({
      userId,
      rawToken: deletionToken,
      tokenType:
        ACCOUNT_DELETION_TOKEN_TYPE,
      deliveryMethod: "link",
      maximumAttempts:
        ACCOUNT_DELETION_MAX_ATTEMPTS
    });

  if (!verification.success) {
    if (
      verification.reason ===
      "expired_or_missing"
    ) {
      throw new AppError(
        "Account deletion verification has expired. Request a new verification code.",
        403
      );
    }

    if (
      verification.reason ===
      "maximum_attempts"
    ) {
      throw new AppError(
        "Account deletion verification is no longer valid. Request a new verification code.",
        403
      );
    }

    throw new AppError(
      "Invalid account deletion verification",
      403
    );
  }

  /*
   * Revoke every active login session before
   * permanently removing the user.
   */

  await endAllUserSessions(
    userId
  );

  /*
   * Remove profile image from Cloudinary.
   */

  const profile =
    await findProfileByUserId(
      userId
    );

  if (
    profile &&
    profile.profile_image_public_id
  ) {
    await deleteCloudinaryImage(
      profile.profile_image_public_id
    );
  }

  /*
   * Delete the user.
   *
   * Related records should either cascade,
   * be anonymized, or be explicitly handled
   * by the database schema.
   */

  await deleteUser(
    userId
  );

  return true;
}