import crypto from "crypto";

import pool
  from "../../config/database.js";


export async function requireAdminAccess(
  req,
  res,
  next
) {
  try {
    const token =
      req.cookies?.admin_access_token;

    /*
    |--------------------------------------------------------------------------
    | Check Admin Access Cookie
    |--------------------------------------------------------------------------
    */

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Admin password verification required"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Token
    |--------------------------------------------------------------------------
    */

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    /*
    |--------------------------------------------------------------------------
    | Find Admin Session
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(
        `
          SELECT
            admin_access_session_id,
            admin_id,
            expires_at,
            revoked_at
          FROM admin_access_sessions
          WHERE session_token_hash = $1
          LIMIT 1
        `,
        [tokenHash]
      );

    if (result.rows.length === 0) {
      res.clearCookie(
        "admin_access_token"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid admin access session"
      });
    }

    const session =
      result.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Check Session Owner
    |--------------------------------------------------------------------------
    */

    if (
      session.admin_id !==
      req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin session does not belong to this user"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Revoked Session
    |--------------------------------------------------------------------------
    */

    if (session.revoked_at) {
      res.clearCookie(
        "admin_access_token"
      );

      return res.status(401).json({
        success: false,
        message:
          "Admin access session has been revoked"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Expiration
    |--------------------------------------------------------------------------
    */

    if (
      new Date(session.expires_at) <=
      new Date()
    ) {
      res.clearCookie(
        "admin_access_token"
      );

      return res.status(401).json({
        success: false,
        message:
          "Admin access session expired"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Last Used
    |--------------------------------------------------------------------------
    */

    await pool.query(
      `
        UPDATE admin_access_sessions
        SET last_used_at = NOW()
        WHERE admin_access_session_id = $1
      `,
      [
        session.admin_access_session_id
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Attach Admin Session To Request
    |--------------------------------------------------------------------------
    */

    req.adminAccess = {
      session_id:
        session.admin_access_session_id,

      admin_id:
        session.admin_id,

      expires_at:
        session.expires_at
    };

    next();
  } catch (error) {
    console.error(
      "Admin access middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to validate admin access"
    });
  }
}