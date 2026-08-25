import pool from "../config/database.js";
import {
  createAccessToken,
  createTemporaryToken,
  verifyTemporaryToken
} from "./token.service.js";
import {
  restoreExpiredSuspensionForUser
} from "./admin/adminSuspension.service.js";
import {
  sendVerificationEmail
} from "./email.service.js";
import {
  findUserByEmail,
  findUserByUsername,
  findUserByEmailOrUsername,
  findUserById,
  markEmailAsVerified,
  updateLastLogin
} from "../models/user.model.js";
import {
  normalizeUserSuspension
} from "./admin/adminSuspensionExpiry.service.js";

import { createProfile } from "../models/profile.model.js";
import { createSettings } from "../models/settings.model.js";

import {
  createPasswordHash,
  verifyPassword
} from "./password.service.js";


import {
  startSession,
  validateRefreshSession,
  rotateRefreshSession,
  endSession,
  endAllUserSessions
} from "./session.service.js";

import AppError from "../utils/AppError.js";

/**
 * Register a new user.
 */
export async function registerUser({
  email,
  username,
  password,
  fullName,
  displayName = null,
  dateOfBirth = null,
  gender = null,
  occupationType = null
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  const existingEmail = await findUserByEmail(normalizedEmail);

  if (existingEmail) {
    throw new AppError(
      "An account with this email already exists",
      409
    );
  }

  const existingUsername = await findUserByUsername(
    normalizedUsername
  );

  if (existingUsername) {
    throw new AppError(
      "This username is already taken",
      409
    );
  }

  const passwordHash = await createPasswordHash(password);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        INSERT INTO users (
          email,
          username,
          password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING
          user_id,
          email,
          username,
          role,
          account_status,
          email_verified,
          two_factor_enabled,
          two_factor_method,
          created_at,
          updated_at
      `,
      [
        normalizedEmail,
        normalizedUsername,
        passwordHash
      ]
    );

    const user = userResult.rows[0];

    const profileResult = await client.query(
      `
        INSERT INTO user_profiles (
          user_id,
          full_name,
          display_name,
          date_of_birth,
          gender,
          occupation_type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        user.user_id,
        fullName.trim(),
        displayName?.trim() || null,
        dateOfBirth,
        gender,
        occupationType
      ]
    );

    const settingsResult = await client.query(
      `
        INSERT INTO user_settings (user_id)
        VALUES ($1)
        RETURNING *
      `,
      [user.user_id]
    );

    await client.query("COMMIT");

    await createAndSendEmailVerification(user);

    return {
      user,
      profile: profileResult.rows[0],
      settings: settingsResult.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Log in using an email address or username.
 */
export async function loginUser({
  identifier,
  password,
  deviceName = null,
  browser = null,
  operatingSystem = null,
  ipAddress = null,
  userAgent = null,
  rememberMe = false
}) {
  const normalizedIdentifier =
    typeof identifier === "string"
      ? identifier.trim()
      : "";

  if (!normalizedIdentifier) {
    throw new AppError(
      "Email or username is required",
      400
    );
  }

  if (
    typeof password !== "string" ||
    !password.trim()
  ) {
    throw new AppError(
      "Password is required",
      400
    );
  }

 let user =
  await findUserByEmailOrUsername(
    normalizedIdentifier
  );

  if (!user) {
    throw new AppError(
      "Invalid email, username, or password",
      401
    );
  }

  if (!user.password_hash) {
    throw new AppError(
      "Password hash is missing for this account",
      500
    );
  }

  const passwordIsValid =
    await verifyPassword(
      password,
      user.password_hash
    );

  if (!passwordIsValid) {
    throw new AppError(
      "Invalid email, username, or password",
      401
    );
  }

  /*
|--------------------------------------------------------------------------
| Temporary Suspension Expiry
|--------------------------------------------------------------------------
*/

user =
  await normalizeUserSuspension(
    user
  );



if (
  user.account_status !== "active"
) {
  if (
    user.account_status ===
    "suspended"
  ) {
    throw new AppError(
      "This account is temporarily suspended",
      403
    );
  }

  if (
    user.account_status ===
    "banned"
  ) {
    throw new AppError(
      "This account has been banned",
      403
    );
  }

  if (
    user.account_status ===
    "disabled"
  ) {
    throw new AppError(
      "This account has been disabled",
      403
    );
  }

  throw new AppError(
    "This account is not currently active",
    403
  );
}

  /*
   * Enable this check after the Brevo
   * email-verification workflow has
   * been fully implemented.
   */
  // if (!user.email_verified) {
  //   throw new AppError(
  //     "Verify your email address before logging in",
  //     403
  //   );
  // }

  const accessToken =
    createAccessToken(user);

  const {
  refreshToken,
  session
} = await startSession({
  user,
  deviceName,
  browser,
  operatingSystem,
  ipAddress,
  userAgent,
  rememberMe
});
  await updateLastLogin(
    user.user_id
  );

  return {
    user:
      sanitizeUser(user),

    accessToken,

    refreshToken,

    sessionId:
      session.session_id
  };
}

/**
 * Validate and rotate a refresh token.
 */
export async function refreshUserSession(
  refreshToken
) {
  if (!refreshToken) {
    throw new AppError(
      "Refresh token is missing",
      401
    );
  }

  const validatedSession =
    await validateRefreshSession(
      refreshToken
    );

  if (!validatedSession) {
    throw new AppError(
      "Invalid or expired refresh token",
      401
    );
  }

  let user =
    await findUserById(
      validatedSession.userId
    );

  if (!user) {
    throw new AppError(
      "User account is unavailable",
      401
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Temporary Suspension Expiry
  |--------------------------------------------------------------------------
  */

  user =
    await normalizeUserSuspension(
      user
    );

  /*
  |--------------------------------------------------------------------------
  | Current Account Status
  |--------------------------------------------------------------------------
  |
  | Never issue new tokens to banned, suspended, disabled,
  | deleted, or otherwise inactive accounts.
  |
  */

  if (
    !user ||
    user.account_status !== "active"
  ) {
    throw new AppError(
      "User account is unavailable",
      403
    );
  }

  const accessToken =
    createAccessToken(user);

  const rotatedSession =
    await rotateRefreshSession({
      currentSession:
        validatedSession.session,

      user
    });

  return {
    accessToken,

    refreshToken:
      rotatedSession.refreshToken,

    rememberMe:
      validatedSession.session
        .remember_me === true
  };
}

/**
 * Log out the current browser or device.
 */
export async function logoutUser(refreshToken) {
  await endSession(refreshToken);
}

/**
 * Log out every active device belonging to the user.
 */
export async function logoutUserFromAllDevices(userId) {
  await endAllUserSessions(userId);
}

/**
 * Retrieve the authenticated user's safe account data.
 */
export async function getAuthenticatedUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
}

function sanitizeUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    username: user.username,
    role: user.role,
    account_status: user.account_status,
    email_verified: user.email_verified,
    two_factor_enabled: user.two_factor_enabled,
    two_factor_method: user.two_factor_method,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

export async function createAndSendEmailVerification(user) {
  const otpResult = await createTemporaryToken({
    userId: user.user_id,
    tokenType: "email_verification",
    deliveryMethod: "otp",
    expiresInMinutes: 10
  });

  const linkResult = await createTemporaryToken({
    userId: user.user_id,
    tokenType: "email_verification",
    deliveryMethod: "link",
    expiresInMinutes: 30
  });

  await sendVerificationEmail({
    userId: user.user_id,
    recipientEmail: user.email,
    recipientName: user.username,
    otp: otpResult.rawToken,
    verificationToken: linkResult.rawToken
  });
}

export async function verifyEmailWithOTP({
  email,
  otp
}) {
  const user = await findUserByEmail(
    email.trim().toLowerCase()
  );

  if (!user) {
    throw new AppError("Invalid verification request", 400);
  }

  if (user.email_verified) {
    return {
      alreadyVerified: true,
      user: sanitizeUser(user)
    };
  }

  const verification = await verifyTemporaryToken({
    userId: user.user_id,
    rawToken: otp.trim(),
    tokenType: "email_verification",
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
      "Invalid or expired verification OTP",
      400
    );
  }

  const verifiedUser = await markEmailAsVerified(
    user.user_id
  );

  return {
    alreadyVerified: false,
    user: sanitizeUser(verifiedUser)
  };
}

export async function verifyEmailWithLink({
  userId,
  token
}) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("Invalid verification request", 400);
  }

  if (user.email_verified) {
    return {
      alreadyVerified: true,
      user: sanitizeUser(user)
    };
  }

  const verification = await verifyTemporaryToken({
    userId: user.user_id,
    rawToken: token,
    tokenType: "email_verification",
    deliveryMethod: "link",
    maximumAttempts: 5
  });

  if (!verification.success) {
    throw new AppError(
      "Invalid or expired verification link",
      400
    );
  }

  const verifiedUser = await markEmailAsVerified(
    user.user_id
  );

  return {
    alreadyVerified: false,
    user: sanitizeUser(verifiedUser)
  };
}

export async function resendEmailVerification(email) {
  const user = await findUserByEmail(
    email.trim().toLowerCase()
  );

  /*
   * Do not reveal whether an email address exists.
   */
  if (!user || user.email_verified) {
    return;
  }

  await createAndSendEmailVerification(user);
}