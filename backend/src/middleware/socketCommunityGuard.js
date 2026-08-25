import pool
  from "../config/database.js";

import {
  findUserById
} from "../models/user.model.js";

import {
  restoreExpiredSuspensionForUser
} from "../services/admin/adminSuspension.service.js";


function createGuardError(
  message,
  code,
  statusCode = 403
) {
  const error =
    new Error(message);

  error.code = code;
  error.statusCode =
    statusCode;

  return error;
}


export async function requireSocketCommunityAccess(
  userId
) {
  /*
  |--------------------------------------------------------------------------
  | Check Current Account
  |--------------------------------------------------------------------------
  */

  let user =
    await findUserById(
      userId
    );

  if (!user) {
    throw createGuardError(
      "User account was not found.",
      "USER_NOT_FOUND",
      401
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Expired Suspension
  |--------------------------------------------------------------------------
  */

  if (
    user.account_status ===
    "suspended"
  ) {
    const restored =
      await restoreExpiredSuspensionForUser(
        user.user_id
      );

    if (restored) {
      user =
        await findUserById(
          user.user_id
        );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Account Status
  |--------------------------------------------------------------------------
  */

  if (
    user?.account_status ===
    "suspended"
  ) {
    throw createGuardError(
      "Your account is temporarily suspended.",
      "ACCOUNT_SUSPENDED"
    );
  }


  if (
    user?.account_status ===
    "banned"
  ) {
    throw createGuardError(
      "Your account has been banned.",
      "ACCOUNT_BANNED"
    );
  }


  if (
    !user ||
    user.account_status !==
    "active"
  ) {
    throw createGuardError(
      "Your account is not active.",
      "ACCOUNT_NOT_ACTIVE"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Active Community Restrictions
  |--------------------------------------------------------------------------
  */

  const restrictionResult =
    await pool.query(
      `
        SELECT
          restriction_type

        FROM user_restrictions

        WHERE user_id = $1

          AND is_active = TRUE

          AND starts_at <= NOW()

          AND (
            expires_at IS NULL
            OR expires_at > NOW()
          )

          AND restriction_type IN (
            'community_chat_block',
            'community_mute',
            'temporary_account_restriction'
          )

        LIMIT 1
      `,
      [
        userId
      ]
    );


  if (
    restrictionResult.rows.length > 0
  ) {
    throw createGuardError(
      "You are currently unable to send community messages.",
      "COMMUNITY_CHAT_RESTRICTED"
    );
  }


  return user;
}