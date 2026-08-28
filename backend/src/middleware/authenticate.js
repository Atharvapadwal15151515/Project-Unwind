import jwt from "jsonwebtoken";
import {
  restoreExpiredSuspensionForUser
} from "../services/admin/adminSuspension.service.js";

import pool
  from "../config/database.js";


export async function authenticate(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;


  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message:
        "Authorization header missing"
    });
  }


  const [
    tokenType,
    token
  ] =
    authHeader.split(" ");


  if (
    tokenType !== "Bearer" ||
    !token
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid authorization format"
    });
  }


  try {
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
      );


    /*
    |--------------------------------------------------------------------------
    | Check Current User State
    |--------------------------------------------------------------------------
    |
    | We intentionally do not trust account status from the JWT.
    | This ensures bans/suspensions take effect even for users who
    | were already logged in when the admin action occurred.
    |
    */

    const result =
      await pool.query(
        `
          SELECT
            user_id,
            role,
            account_status
          FROM users
          WHERE user_id = $1
          LIMIT 1
        `,
        [
          decoded.sub
        ]
      );


    if (
      result.rows.length === 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "User account no longer exists"
      });
    }


    const user =
      result.rows[0];


    if (
  user.account_status ===
  "suspended"
) {
  const restored =
    await restoreExpiredSuspensionForUser(
      user.user_id
    );

  if (restored) {
    const refreshedUserResult =
      await pool.query(
        `
          SELECT
            user_id,
            role,
            account_status
          FROM users
          WHERE user_id = $1
          LIMIT 1
        `,
        [
          user.user_id
        ]
      );

    if (
      refreshedUserResult.rows.length === 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "User account no longer exists"
      });
    }

    const refreshedUser =
      refreshedUserResult.rows[0];

    req.user = {
      user_id:
        refreshedUser.user_id,

      role:
        refreshedUser.role
    };

    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      "This account is temporarily suspended"
  });
}


    if (
      user.account_status ===
      "banned"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been banned"
      });
    }


    if (
      user.account_status ===
      "disabled"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been disabled"
      });
    }


    if (
      user.account_status ===
      "deleted"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account is no longer active"
      });
    }


    if (
      user.account_status !==
      "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account is not currently active"
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Attach Current User Data
    |--------------------------------------------------------------------------
    |
    | Use the database role instead of decoded.role as well.
    | This means admin promotion/revocation takes effect immediately.
    |
    */

    req.user = {
      user_id:
        user.user_id,

      role:
        user.role
    };


    next();

  } catch (error) {
    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Your session has expired. Please sign in again."
      });
    }


    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid access token"
      });
    }


    console.error(
      "Authentication middleware error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to authenticate user"
    });
  }
}