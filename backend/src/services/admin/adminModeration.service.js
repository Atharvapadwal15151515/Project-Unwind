import pool
  from "../../config/database.js";

  import {
  sendAdminUserNotification
} from "./adminNotification.service.js";

import {
  createLongSuspensionProposal,
  createPermanentBanProposal
} from "./adminModerationProposal.service.js";


async function getUserById(
  client,
  userId
) {
  const result =
    await client.query(
      `
        SELECT
          user_id,
          username,
          email,
          role,
          account_status
        FROM users
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

  return result.rows[0] || null;
}


async function createModerationAction(
  client,
  {
    adminId,
    targetUserId,
    actionType,
    targetType = "user",
    targetId,
    reason,
    durationMinutes = null,
    expiresAt = null,
    metadata = {}
  }
) {
  await client.query(
    `
      INSERT INTO moderation_actions (
        admin_id,
        target_user_id,
        action_type,
        target_type,
        target_id,
        reason,
        duration_minutes,
        expires_at,
        metadata
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9
      )
    `,
    [
      adminId,
      targetUserId,
      actionType,
      targetType,
      targetId || targetUserId,
      reason,
      durationMinutes,
      expiresAt,
      metadata
    ]
  );
}


async function createAuditLog(
  client,
  {
    adminId,
    action,
    targetUserId,
    reason,
    oldValue,
    newValue,
    metadata = {}
  }
) {
  await client.query(
    `
      INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_type,
        target_id,
        reason,
        old_value,
        new_value,
        metadata
      )
      VALUES (
        $1,
        $2,
        'user',
        $3,
        $4,
        $5,
        $6,
        $7
      )
    `,
    [
      adminId,
      action,
      targetUserId,
      reason,
      oldValue,
      newValue,
      metadata
    ]
  );
}


export async function warnUser({
  adminId,
  userId,
  reason,
  severity = "low"
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const user =
      await getUserById(
        client,
        userId
      );

    if (!user) {
      await client.query("ROLLBACK");
      return null;
    }

    const warningResult =
      await client.query(
        `
          INSERT INTO user_warnings (
            user_id,
            admin_id,
            reason,
            severity
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [
          userId,
          adminId,
          reason,
          severity
        ]
      );

    await createModerationAction(
      client,
      {
        adminId,
        targetUserId: userId,
        actionType: "warning",
        reason,
        metadata: {
          severity
        }
      }
    );

    await createAuditLog(
      client,
      {
        adminId,
        action: "user_warned",
        targetUserId: userId,
        reason,
        oldValue: null,
        newValue: {
          warning: true,
          severity
        }
      }
    );

   await client.query("COMMIT");

/*
|--------------------------------------------------------------------------
| Notify Warned User
|--------------------------------------------------------------------------
|
| Notification is intentionally sent after COMMIT.
| A notification failure should never roll back a successful moderation
| action.
|
*/

try {
  await sendAdminUserNotification({
    adminId,
    userId,

    title:
      "Community Warning",

    message:
      "A warning has been issued regarding your recent activity on Unwind. Please review the Community Guidelines.",

    priority:
      severity === "high"
        ? "high"
        : "normal",

    iconName:
      "triangle-alert",

    actionUrl:
      "/notifications",

    referenceType:
      "warning",

    referenceId:
      warningResult.rows[0]
        .warning_id,

    metadata: {
      severity
    }
  });
} catch (notificationError) {
  console.error(
    "Failed to send warning notification:",
    notificationError
  );
}

return {
  user,

  warning:
    warningResult.rows[0]
};

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}


export async function restrictUser({
  adminId,
  userId,
  restrictionType,
  reason,
  durationMinutes
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const user =
      await getUserById(
        client,
        userId
      );

    if (!user) {
      await client.query("ROLLBACK");
      return null;
    }

    const expiresAt =
      durationMinutes
        ? new Date(
            Date.now() +
            durationMinutes *
              60 *
              1000
          )
        : null;

    const restrictionResult =
      await client.query(
        `
          INSERT INTO user_restrictions (
            user_id,
            created_by,
            restriction_type,
            reason,
            expires_at
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        [
          userId,
          adminId,
          restrictionType,
          reason,
          expiresAt
        ]
      );

    await createModerationAction(
      client,
      {
        adminId,
        targetUserId: userId,
        actionType:
          restrictionType,
        reason,
        durationMinutes,
        expiresAt
      }
    );

    await createAuditLog(
      client,
      {
        adminId,
        action:
          "user_restricted",
        targetUserId:
          userId,
        reason,
        oldValue: null,
        newValue: {
          restrictionType,
          expiresAt
        }
      }
    );

    await client.query("COMMIT");

try {
  await sendAdminUserNotification({
    adminId,
    userId,

    title:
      "Community Access Restricted",

    message:
      expiresAt
        ? "Some of your community features have been temporarily restricted following a moderation review."
        : "Some of your community features have been restricted following a moderation review.",

    priority:
      "high",

    iconName:
      "shield-alert",

    actionUrl:
      "/notifications",

    referenceType:
      "restriction",

    referenceId:
      restrictionResult.rows[0]
        .restriction_id,

    metadata: {
      restrictionType,
      expiresAt
    }
  });
} catch (notificationError) {
  console.error(
    "Failed to send restriction notification:",
    notificationError
  );
}

return {
  user,
  restriction:
    restrictionResult.rows[0]
};

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}


const MAX_DIRECT_SUSPENSION_MINUTES =
  7 * 24 * 60;


export async function suspendUser({
  adminId,
  userId,
  reason,
  durationMinutes
}) {
  const cleanReason =
    String(reason || "")
      .trim();

  if (!cleanReason) {
    throw new Error(
      "MODERATION_REASON_REQUIRED"
    );
  }

  const normalizedDuration =
    Number(durationMinutes);


  if (
    !Number.isInteger(
      normalizedDuration
    ) ||
    normalizedDuration <= 0
  ) {
    throw new Error(
      "INVALID_SUSPENSION_DURATION"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | More Than 7 Days → Majority Vote
  |--------------------------------------------------------------------------
  */

  if (
    normalizedDuration >
    MAX_DIRECT_SUSPENSION_MINUTES
  ) {
    const proposal =
      await createLongSuspensionProposal({
        adminId,
        userId,
        reason:
          cleanReason,
        durationMinutes:
          normalizedDuration
      });


    if (!proposal) {
      return null;
    }


    return {
      requiresApproval: true,

      action:
        "long_suspension_proposal",

      ...proposal
    };
  }


  /*
  |--------------------------------------------------------------------------
  | 7 Days Or Less → Immediate Suspension
  |--------------------------------------------------------------------------
  */

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );


    const user =
      await getUserById(
        client,
        userId
      );


    if (!user) {
      await client.query(
        "ROLLBACK"
      );

      return null;
    }


    if (
      user.role === "admin"
    ) {
      throw new Error(
        "ADMIN_TARGET_PROTECTED"
      );
    }


    const suspendedAt =
      new Date();


    const expiresAt =
      new Date(
        suspendedAt.getTime() +
          normalizedDuration *
            60 *
            1000
      );


    await client.query(
      `
        UPDATE users

        SET
          account_status =
            'suspended',

          suspended_at =
            $2,

          suspension_expires_at =
            $3,

          suspension_reason =
            $4,

          suspension_proposal_id =
            NULL,

          banned_at =
            NULL,

          ban_reason =
            NULL,

          ban_proposal_id =
            NULL,

          updated_at =
            NOW()

        WHERE user_id = $1
      `,
      [
        userId,
        suspendedAt,
        expiresAt,
        cleanReason
      ]
    );


    await createModerationAction(
      client,
      {
        adminId,

        targetUserId:
          userId,

        actionType:
          "temporary_suspension",

        reason:
          cleanReason,

        durationMinutes:
          normalizedDuration,

        expiresAt,

        metadata: {
          requiresApproval:
            false,

          automaticExpiry:
            true
        }
      }
    );


    await createAuditLog(
      client,
      {
        adminId,

        action:
          "user_suspended",

        targetUserId:
          userId,

        reason:
          cleanReason,

        oldValue: {
          account_status:
            user.account_status
        },

        newValue: {
          account_status:
            "suspended",

          suspendedAt,

          suspension_expires_at:
            expiresAt
        },

        metadata: {
          durationMinutes:
            normalizedDuration,

          requiresApproval:
            false
        }
      }
    );


    await client.query(
      "COMMIT"
    );


    /*
    |--------------------------------------------------------------------------
    | Notification After Commit
    |--------------------------------------------------------------------------
    */

    try {
      await sendAdminUserNotification({
        adminId,
        userId,

        title:
          "Account Temporarily Suspended",

        message:
          "Your Unwind account has been temporarily suspended following a moderation review.",

        priority:
          "high",

        iconName:
          "shield-alert",

        actionUrl:
          "/notifications",

        referenceType:
          "account_suspension",

        referenceId:
          userId,

        metadata: {
          suspendedAt,

          expiresAt,

          durationMinutes:
            normalizedDuration
        }
      });

    } catch (
      notificationError
    ) {
      console.error(
        "Failed to send suspension notification:",
        notificationError
      );
    }


    return {
      ...user,

      account_status:
        "suspended",

      suspended_at:
        suspendedAt,

      suspension_expires_at:
        expiresAt,

      suspension_reason:
        cleanReason,

      requiresApproval:
        false
    };

  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {
    client.release();
  }
}


export async function banUser({
  adminId,
  userId,
  reason
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const user =
      await getUserById(
        client,
        userId
      );

    if (!user) {
      await client.query("ROLLBACK");
      return null;
    }

    if (user.role === "admin") {
      throw new Error(
        "ADMIN_TARGET_PROTECTED"
      );
    }

    await client.query(
      `
        UPDATE users
        SET
          account_status = 'banned',
          updated_at = NOW()
        WHERE user_id = $1
      `,
      [userId]
    );

    await createModerationAction(
      client,
      {
        adminId,
        targetUserId: userId,
        actionType:
          "permanent_ban",
        reason
      }
    );

    await createAuditLog(
      client,
      {
        adminId,
        action:
          "user_banned",
        targetUserId:
          userId,
        reason,
        oldValue: {
          account_status:
            user.account_status
        },
        newValue: {
          account_status:
            "banned"
        }
      }
    );

    await client.query("COMMIT");

try {
  await sendAdminUserNotification({
    adminId,
    userId,

    title:
      "Account Moderation Action",

    message:
      "Your Unwind account has been banned following a moderation review.",

    priority:
      "high",

    iconName:
      "ban",

    actionUrl:
      "/notifications",

    referenceType:
      "account_ban",

    referenceId:
      userId
  });
} catch (notificationError) {
  console.error(
    "Failed to send ban notification:",
    notificationError
  );
}

return {
  ...user,
  account_status:
    "banned"
};
   

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}


export async function restoreUser({
  adminId,
  userId,
  reason
}) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );


    const user =
      await getUserById(
        client,
        userId
      );


    if (!user) {
      await client.query(
        "ROLLBACK"
      );

      return null;
    }


    const cleanReason =
      String(reason || "")
        .trim();


    if (!cleanReason) {
      throw new Error(
        "MODERATION_REASON_REQUIRED"
      );
    }


    await client.query(
      `
        UPDATE users

        SET
          account_status =
            'active',

          suspended_at =
            NULL,

          suspension_expires_at =
            NULL,

          suspension_reason =
            NULL,

          suspension_proposal_id =
            NULL,

          banned_at =
            NULL,

          ban_reason =
            NULL,

          ban_proposal_id =
            NULL,

          updated_at =
            NOW()

        WHERE user_id = $1
      `,
      [userId]
    );


    await client.query(
      `
        UPDATE user_restrictions

        SET
          is_active =
            FALSE,

          updated_at =
            NOW()

        WHERE user_id = $1
          AND is_active =
            TRUE
      `,
      [userId]
    );


    await createModerationAction(
      client,
      {
        adminId,

        targetUserId:
          userId,

        actionType:
          "account_restored",

        reason:
          cleanReason
      }
    );


    await createAuditLog(
      client,
      {
        adminId,

        action:
          "user_restored",

        targetUserId:
          userId,

        reason:
          cleanReason,

        oldValue: {
          account_status:
            user.account_status
        },

        newValue: {
          account_status:
            "active",

          suspension:
            null,

          ban:
            null
        }
      }
    );


    await client.query(
      "COMMIT"
    );


    try {
      await sendAdminUserNotification({
        adminId,
        userId,

        title:
          "Account Access Restored",

        message:
          "Your Unwind account access has been restored. You can now use your account normally.",

        priority:
          "normal",

        iconName:
          "shield-check",

        actionUrl:
          "/notifications",

        referenceType:
          "account_restore",

        referenceId:
          userId
      });

    } catch (
      notificationError
    ) {
      console.error(
        "Failed to send account restoration notification:",
        notificationError
      );
    }


    return {
      ...user,

      account_status:
        "active",

      suspended_at:
        null,

      suspension_expires_at:
        null,

      suspension_reason:
        null,

      suspension_proposal_id:
        null,

      banned_at:
        null,

      ban_reason:
        null,

      ban_proposal_id:
        null
    };

  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {
    client.release();
  }
}