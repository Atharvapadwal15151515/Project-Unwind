import AppError from "../../utils/AppError.js";

import {
  findJournalSecurityByUserId,
  findJournalUnlockSession,
  revokeJournalUnlockSession
} from "../../models/journal/journalSecurity.model.js";

import {
  hashJournalUnlockToken,
  isJournalUnlockExpired
} from "../../utils/journal/journalUnlockToken.util.js";

/*
|--------------------------------------------------------------------------
| Require Journal Unlock
|--------------------------------------------------------------------------
|
| This middleware must run after authenticate.
|
| PIN disabled:
| - Journal endpoints remain accessible normally.
|
| PIN enabled:
| - A valid X-Journal-Unlock-Token header is required.
|
*/

export async function requireJournalUnlock(
  req,
  res,
  next
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Confirm authenticated user
    |--------------------------------------------------------------------------
    */

    const userId =
      req.user?.user_id ||
      req.user?.userId;

    if (!userId) {
      throw new AppError(
        "Authentication is required",
        401
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get Journal security settings
    |--------------------------------------------------------------------------
    */

  const securitySettings =
  await findJournalSecurityByUserId(
    userId
  );
    /*
    |--------------------------------------------------------------------------
    | Normalize database/service property names
    |--------------------------------------------------------------------------
    |
    | Supports both:
    | - snake_case database fields
    | - camelCase mapped fields
    |
    */

    const isSecurityEnabled =
      securitySettings
        ?.is_security_enabled ??
      securitySettings
        ?.isSecurityEnabled ??
      false;

    const pinHash =
      securitySettings?.pin_hash ??
      securitySettings?.pinHash ??
      null;

    /*
    |--------------------------------------------------------------------------
    | PIN protection is optional
    |--------------------------------------------------------------------------
    |
    | No settings row:
    | Allow access.
    |
    | Security disabled:
    | Allow access.
    |
    | No PIN hash:
    | Allow access.
    |
    */

    if (
      !securitySettings ||
      !isSecurityEnabled ||
      !pinHash
    ) {
      return next();
    }

    /*
    |--------------------------------------------------------------------------
    | Read unlock token
    |--------------------------------------------------------------------------
    */

    const rawUnlockToken =
      req.get(
        "X-Journal-Unlock-Token"
      )?.trim();

    if (!rawUnlockToken) {
      throw new AppError(
        "Journal is locked. Enter your Journal PIN to continue",
        423
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Hash incoming unlock token
    |--------------------------------------------------------------------------
    */
/*
|--------------------------------------------------------------------------
| Hash incoming unlock token
|--------------------------------------------------------------------------
*/

const unlockTokenHash =
  hashJournalUnlockToken(
    rawUnlockToken
  );

/*
|--------------------------------------------------------------------------
| Find unlock session
|--------------------------------------------------------------------------
*/

const unlockSession =
  await findJournalUnlockSession(
    unlockTokenHash
  );

if (!unlockSession) {
  throw new AppError(
    "Journal unlock session is invalid or has been revoked",
    401
  );
}
    /*
    |--------------------------------------------------------------------------
    | Confirm session ownership
    |--------------------------------------------------------------------------
    */

    const sessionUserId =
      unlockSession.user_id ??
      unlockSession.userId;

    if (
      sessionUserId !== userId
    ) {
      throw new AppError(
        "Journal unlock session does not belong to this user",
        403
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Confirm session has not been revoked
    |--------------------------------------------------------------------------
    */

    const revokedAt =
      unlockSession.revoked_at ??
      unlockSession.revokedAt ??
      null;

    if (revokedAt) {
      throw new AppError(
        "Journal unlock session has been revoked",
        401
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Confirm session has not expired
    |--------------------------------------------------------------------------
    */

    const expiresAt =
      unlockSession.expires_at ??
      unlockSession.expiresAt;

    if (
      !expiresAt ||
      isJournalUnlockExpired(
        expiresAt
      )
    ) {
      const unlockSessionId =
        unlockSession
          .unlock_session_id ??
        unlockSession
          .unlockSessionId;

      if (unlockSessionId) {
        await revokeJournalUnlockSession(
          unlockSessionId
        );
      }

      throw new AppError(
        "Journal unlock session has expired. Enter your Journal PIN again",
        401
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Attach verified session to request
    |--------------------------------------------------------------------------
    */

    req.journalUnlockSession = {
      unlockSessionId:
        unlockSession
          .unlock_session_id ??
        unlockSession
          .unlockSessionId,

      userId:
        sessionUserId,

      expiresAt
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export default requireJournalUnlock;