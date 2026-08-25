import pool from "../../config/database.js";

import AppError from "../../utils/AppError.js";

import {
  createJournalSecuritySettings,
  findJournalSecurityByUserId,
  setJournalPinHash,
  updateJournalPinHash,
  removeJournalPinHash,
  incrementFailedPinAttempts,
  resetFailedPinAttempts,
  setJournalLockout,
  clearJournalLockout,
  updateLastUnlockedAt,
  createJournalUnlockSession,
  revokeJournalUnlockSession,
  revokeAllJournalUnlockSessions
} from "../../models/journal/journalSecurity.model.js";

import {
  hashJournalPin,
  compareJournalPin,
  createJournalLockoutTime,
  isJournalPinLocked,
  getJournalLockoutRemainingSeconds,
  MAX_JOURNAL_PIN_ATTEMPTS
} from "../../utils/journal/journalPin.util.js";

import {
  generateJournalUnlockToken,
  createJournalUnlockExpiry
} from "../../utils/journal/journalUnlockToken.util.js";

/*
|--------------------------------------------------------------------------
| Format Journal security response
|--------------------------------------------------------------------------
| Never return pin_hash to the frontend.
*/

function formatJournalSecuritySettings(
  settings
) {
  if (!settings) {
    return {
      isSecurityEnabled: false,
      isLocked: false,
      lockedUntil: null,
      failedAttempts: 0,
      pinCreatedAt: null,
      pinUpdatedAt: null,
      lastUnlockedAt: null
    };
  }

  const currentlyLocked =
    isJournalPinLocked(
      settings.locked_until
    );

  return {
    isSecurityEnabled:
      settings.is_security_enabled,

    isLocked: currentlyLocked,

    lockedUntil: currentlyLocked
      ? settings.locked_until
      : null,

    failedAttempts:
      settings.failed_attempts,

    pinCreatedAt:
      settings.pin_created_at,

    pinUpdatedAt:
      settings.pin_updated_at,

    lastUnlockedAt:
      settings.last_unlocked_at
  };
}

/*
|--------------------------------------------------------------------------
| Get Journal security status
|--------------------------------------------------------------------------
*/

export async function getJournalSecurityStatus(
  userId
) {
  let settings =
    await findJournalSecurityByUserId(
      userId
    );

  if (!settings) {
    settings =
      await createJournalSecuritySettings(
        userId
      );
  }

  /*
   * A lockout may remain in the database after
   * its expiry. Clear it before returning status.
   */
  if (
    settings.locked_until &&
    !isJournalPinLocked(
      settings.locked_until
    )
  ) {
    await clearJournalLockout(
      userId
    );

    settings =
      await findJournalSecurityByUserId(
        userId
      );
  }

  return formatJournalSecuritySettings(
    settings
  );
}

/*
|--------------------------------------------------------------------------
| Create Journal PIN
|--------------------------------------------------------------------------
*/

export async function createJournalPin(
  userId,
  pin
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    let settings =
      await findJournalSecurityByUserId(
        userId,
        client
      );

    if (!settings) {
      settings =
        await createJournalSecuritySettings(
          userId,
          client
        );
    }

    if (
      settings.is_security_enabled ||
      settings.pin_hash
    ) {
      throw new AppError(
        "Journal PIN is already enabled",
        409
      );
    }

    const pinHash =
      await hashJournalPin(pin);

    const updatedSettings =
      await setJournalPinHash(
        userId,
        pinHash,
        client
      );

    if (!updatedSettings) {
      throw new AppError(
        "Unable to create Journal PIN",
        500
      );
    }

    /*
     * Defensive cleanup in case any old Journal
     * sessions exist for this user.
     */
    await revokeAllJournalUnlockSessions(
      userId,
      client
    );

    await client.query("COMMIT");

    return formatJournalSecuritySettings(
      updatedSettings
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Unlock Journal
|--------------------------------------------------------------------------
*/
export async function unlockJournal(
  userId,
  pin
) {
  const client =
    await pool.connect();

  let errorAfterCommit = null;

  try {
    await client.query("BEGIN");

    const { rows } =
      await client.query(
        `
          SELECT
            journal_security_id,
            user_id,
            is_security_enabled,
            pin_hash,
            failed_attempts,
            locked_until,
            pin_created_at,
            pin_updated_at,
            last_unlocked_at,
            created_at,
            updated_at
          FROM journal_security_settings
          WHERE user_id = $1
          FOR UPDATE
        `,
        [userId]
      );

    const settings =
      rows[0] || null;

    if (
      !settings ||
      !settings.is_security_enabled ||
      !settings.pin_hash
    ) {
      throw new AppError(
        "Journal PIN security is not enabled",
        400
      );
    }

    if (
      settings.locked_until &&
      !isJournalPinLocked(
        settings.locked_until
      )
    ) {
      await clearJournalLockout(
        userId,
        client
      );

      settings.failed_attempts = 0;
      settings.locked_until = null;
    }

    if (
      isJournalPinLocked(
        settings.locked_until
      )
    ) {
      const remainingSeconds =
        getJournalLockoutRemainingSeconds(
          settings.locked_until
        );

      throw new AppError(
        `Journal is temporarily locked. Try again in ${remainingSeconds} seconds`,
        423
      );
    }

    const pinMatches =
      await compareJournalPin(
        pin,
        settings.pin_hash
      );

    if (!pinMatches) {
      const attemptResult =
        await incrementFailedPinAttempts(
          userId,
          client
        );

      const failedAttempts =
        attemptResult.failed_attempts;

      if (
        failedAttempts >=
        MAX_JOURNAL_PIN_ATTEMPTS
      ) {
        const lockedUntil =
          createJournalLockoutTime();

        await setJournalLockout(
          userId,
          lockedUntil,
          client
        );

        errorAfterCommit =
          new AppError(
            "Too many incorrect PIN attempts. Journal access is temporarily locked for 15 minutes",
            423
          );
      } else {
        const attemptsRemaining =
          MAX_JOURNAL_PIN_ATTEMPTS -
          failedAttempts;

        errorAfterCommit =
          new AppError(
            `Incorrect Journal PIN. ${attemptsRemaining} attempt${
              attemptsRemaining === 1
                ? ""
                : "s"
            } remaining`,
            401
          );
      }

      await client.query("COMMIT");

      throw errorAfterCommit;
    }

    await updateLastUnlockedAt(
      userId,
      client
    );

    const {
      rawToken,
      tokenHash
    } =
      generateJournalUnlockToken();

    const expiresAt =
      createJournalUnlockExpiry();

    const unlockSession =
      await createJournalUnlockSession(
        userId,
        tokenHash,
        expiresAt,
        client
      );

    await client.query("COMMIT");

    return {
      journalUnlockToken:
        rawToken,

      expiresAt:
        unlockSession.expires_at
    };
  } catch (error) {
    if (error !== errorAfterCommit) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {
        // Transaction was already completed.
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Change Journal PIN
|--------------------------------------------------------------------------
*/

export async function changeJournalPin(
  userId,
  currentPin,
  newPin
) {
  if (currentPin === newPin) {
    throw new AppError(
      "New Journal PIN must be different from the current PIN",
      400
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } =
      await client.query(
        `
          SELECT
            user_id,
            is_security_enabled,
            pin_hash,
            failed_attempts,
            locked_until
          FROM journal_security_settings
          WHERE user_id = $1
          FOR UPDATE
        `,
        [userId]
      );

    const settings =
      rows[0] || null;

    if (
      !settings ||
      !settings.is_security_enabled ||
      !settings.pin_hash
    ) {
      throw new AppError(
        "Journal PIN security is not enabled",
        400
      );
    }

    if (
      isJournalPinLocked(
        settings.locked_until
      )
    ) {
      const remainingSeconds =
        getJournalLockoutRemainingSeconds(
          settings.locked_until
        );

      throw new AppError(
        `Journal is temporarily locked. Try again in ${remainingSeconds} seconds`,
        423
      );
    }

    const currentPinMatches =
      await compareJournalPin(
        currentPin,
        settings.pin_hash
      );

    if (!currentPinMatches) {
      throw new AppError(
        "Current Journal PIN is incorrect",
        401
      );
    }

    const newPinHash =
      await hashJournalPin(
        newPin
      );

    const updatedSettings =
      await updateJournalPinHash(
        userId,
        newPinHash,
        client
      );

    await revokeAllJournalUnlockSessions(
      userId,
      client
    );

    await client.query("COMMIT");

    return formatJournalSecuritySettings(
      updatedSettings
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Disable Journal PIN
|--------------------------------------------------------------------------
*/

export async function disableJournalPin(
  userId,
  currentPin
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } =
      await client.query(
        `
          SELECT
            user_id,
            is_security_enabled,
            pin_hash,
            locked_until
          FROM journal_security_settings
          WHERE user_id = $1
          FOR UPDATE
        `,
        [userId]
      );

    const settings =
      rows[0] || null;

    if (
      !settings ||
      !settings.is_security_enabled ||
      !settings.pin_hash
    ) {
      throw new AppError(
        "Journal PIN security is not enabled",
        400
      );
    }

    if (
      isJournalPinLocked(
        settings.locked_until
      )
    ) {
      const remainingSeconds =
        getJournalLockoutRemainingSeconds(
          settings.locked_until
        );

      throw new AppError(
        `Journal is temporarily locked. Try again in ${remainingSeconds} seconds`,
        423
      );
    }

    const pinMatches =
      await compareJournalPin(
        currentPin,
        settings.pin_hash
      );

    if (!pinMatches) {
      throw new AppError(
        "Current Journal PIN is incorrect",
        401
      );
    }

    const updatedSettings =
      await removeJournalPinHash(
        userId,
        client
      );

    await revokeAllJournalUnlockSessions(
      userId,
      client
    );

    await client.query("COMMIT");

    return formatJournalSecuritySettings(
      updatedSettings
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Lock Journal
|--------------------------------------------------------------------------
| Revokes only the current Journal unlock session.
|
| Other devices remain unlocked unless their own unlock sessions
| are separately revoked.
*/

export async function lockJournal(
  userId,
  unlockSessionId
) {
  if (!unlockSessionId) {
    throw new AppError(
      "Journal unlock session is required",
      400
    );
  }

  const settings =
    await findJournalSecurityByUserId(
      userId
    );

  if (
    !settings ||
    !settings.is_security_enabled ||
    !settings.pin_hash
  ) {
    throw new AppError(
      "Journal PIN security is not enabled",
      400
    );
  }

  await revokeJournalUnlockSession(
    unlockSessionId
  );

  return {
    isLocked: true
  };
}

/*
|--------------------------------------------------------------------------
| Reset Journal PIN after verified OTP
|--------------------------------------------------------------------------
| This function will be called by the OTP reset service
| after the existing temporary-token system confirms the OTP.
*/

export async function resetJournalPinAfterVerification(
  userId,
  newPin
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    let settings =
      await findJournalSecurityByUserId(
        userId,
        client
      );

    const pinHash =
      await hashJournalPin(
        newPin
      );

    let updatedSettings;

    if (!settings) {
      await createJournalSecuritySettings(
        userId,
        client
      );

      updatedSettings =
        await setJournalPinHash(
          userId,
          pinHash,
          client
        );
    } else if (
      settings.pin_hash
    ) {
      updatedSettings =
        await updateJournalPinHash(
          userId,
          pinHash,
          client
        );
    } else {
      updatedSettings =
        await setJournalPinHash(
          userId,
          pinHash,
          client
        );
    }

    await revokeAllJournalUnlockSessions(
      userId,
      client
    );

    await client.query("COMMIT");

    return formatJournalSecuritySettings(
      updatedSettings
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}