import {
  hashPassword,
  comparePasswords
} from "../utils/hashPassword.js";

import {
  findUserByEmail,
  findUserById,
  updatePassword
} from "../models/user.model.js";

import {
  createTemporaryToken,
  verifyTemporaryToken
} from "./token.service.js";

import {
  deleteUserTokens
} from "../models/authToken.model.js";

import {
  endAllUserSessions
} from "./session.service.js";

import {
  sendPasswordResetEmail
} from "./email.service.js";

import AppError from "../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Basic password functions
|--------------------------------------------------------------------------
| These are already used by registration and login.
*/

export async function createPasswordHash(password) {
  return hashPassword(password);
}

export async function verifyPassword(
  password,
  passwordHash
) {
  return comparePasswords(password, passwordHash);
}

/*
|--------------------------------------------------------------------------
| Request password reset
|--------------------------------------------------------------------------
| Creates both:
| - 6-digit OTP
| - clickable reset link
*/

export async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await findUserByEmail(normalizedEmail);

  /*
   * Do not reveal whether the account exists.
   * The controller should always return a generic success message.
   */
  if (!user) {
    return;
  }

  const otpResult = await createTemporaryToken({
    userId: user.user_id,
    tokenType: "password_reset",
    deliveryMethod: "otp",
    expiresInMinutes: 10
  });

  const linkResult = await createTemporaryToken({
    userId: user.user_id,
    tokenType: "password_reset",
    deliveryMethod: "link",
    expiresInMinutes: 30
  });

  await sendPasswordResetEmail({
    userId: user.user_id,
    recipientEmail: user.email,
    recipientName: user.username,
    otp: otpResult.rawToken,
    resetToken: linkResult.rawToken
  });
}

/*
|--------------------------------------------------------------------------
| Reset password using OTP
|--------------------------------------------------------------------------
*/

export async function resetPasswordUsingOTP({
  email,
  otp,
  newPassword
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError(
      "Invalid or expired password reset request",
      400
    );
  }

  const verification = await verifyTemporaryToken({
    userId: user.user_id,
    rawToken: otp.trim(),
    tokenType: "password_reset",
    deliveryMethod: "otp",
    maximumAttempts: 5
  });

  if (!verification.success) {
    if (verification.reason === "maximum_attempts") {
      throw new AppError(
        "Too many incorrect OTP attempts. Request a new OTP.",
        429
      );
    }

    throw new AppError(
      "Invalid or expired password reset OTP",
      400
    );
  }

  await replaceUserPassword({
    user,
    newPassword
  });

  return true;
}

/*
|--------------------------------------------------------------------------
| Reset password using link
|--------------------------------------------------------------------------
*/

export async function resetPasswordUsingLink({
  userId,
  token,
  newPassword
}) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError(
      "Invalid or expired password reset link",
      400
    );
  }

  const verification = await verifyTemporaryToken({
    userId: user.user_id,
    rawToken: token,
    tokenType: "password_reset",
    deliveryMethod: "link",
    maximumAttempts: 5
  });

  if (!verification.success) {
    throw new AppError(
      "Invalid or expired password reset link",
      400
    );
  }

  await replaceUserPassword({
    user,
    newPassword
  });

  return true;
}

/*
|--------------------------------------------------------------------------
| Change password while logged in
|--------------------------------------------------------------------------
*/

export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword
}) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const currentPasswordIsValid =
    await comparePasswords(
      currentPassword,
      user.password_hash
    );

  if (!currentPasswordIsValid) {
    throw new AppError(
      "Current password is incorrect",
      401
    );
  }

  const sameAsCurrentPassword =
    await comparePasswords(
      newPassword,
      user.password_hash
    );

  if (sameAsCurrentPassword) {
    throw new AppError(
      "New password must be different from the current password",
      400
    );
  }

  await replaceUserPassword({
    user,
    newPassword
  });

  return true;
}

/*
|--------------------------------------------------------------------------
| Shared password replacement logic
|--------------------------------------------------------------------------
*/

async function replaceUserPassword({
  user,
  newPassword
}) {
  const newPasswordHash =
    await createPasswordHash(newPassword);

  await updatePassword(
    user.user_id,
    newPasswordHash
  );

  /*
   * Remove any remaining password-reset OTPs and links.
   */
  await deleteUserTokens(
    user.user_id,
    "password_reset"
  );

  /*
   * Force logout from every device after password change/reset.
   */
  await endAllUserSessions(user.user_id);
}