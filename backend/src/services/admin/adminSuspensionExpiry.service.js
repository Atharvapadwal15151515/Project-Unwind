import pool
  from "../../config/database.js";

import {
  sendAdminUserNotification
} from "./adminNotification.service.js";


/*
|--------------------------------------------------------------------------
| Expire One Suspended User
|--------------------------------------------------------------------------
*/

export async function expireSuspendedUser(
  userId
) {
  const client =
    await pool.connect();

  let restoredUser = null;

  try {
    await client.query(
      "BEGIN"
    );


    const userResult =
      await client.query(
        `
          SELECT
            user_id,
            username,
            email,
            role,
            account_status,
            suspended_at,
            suspension_expires_at,
            suspension_reason,
            suspension_proposal_id

          FROM users

          WHERE user_id = $1

          LIMIT 1

          FOR UPDATE
        `,
        [userId]
      );


    const user =
      userResult.rows[0];


    if (!user) {
      await client.query(
        "ROLLBACK"
      );

      return null;
    }


    /*
    |--------------------------------------------------------------------------
    | Nothing To Expire
    |--------------------------------------------------------------------------
    */

    if (
      user.account_status !==
      "suspended"
    ) {
      await client.query(
        "ROLLBACK"
      );

      return {
        restored: false,
        user
      };
    }


    if (
      !user.suspension_expires_at
    ) {
      await client.query(
        "ROLLBACK"
      );

      return {
        restored: false,
        user
      };
    }


    const expiry =
      new Date(
        user.suspension_expires_at
      );


    if (
      expiry.getTime() >
      Date.now()
    ) {
      await client.query(
        "ROLLBACK"
      );

      return {
        restored: false,
        user
      };
    }


    /*
    |--------------------------------------------------------------------------
    | Restore Account
    |--------------------------------------------------------------------------
    */

    const restoreResult =
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

            updated_at =
              NOW()

          WHERE user_id = $1

          RETURNING
            user_id,
            username,
            email,
            role,
            account_status,
            updated_at
        `,
        [userId]
      );


    restoredUser =
      restoreResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Moderation History
    |--------------------------------------------------------------------------
    */

    await client.query(
      `
        INSERT INTO moderation_actions (
          admin_id,
          target_user_id,
          action_type,
          target_type,
          target_id,
          reason,
          metadata
        )

        VALUES (
          NULL,
          $1,
          'automatic_unsuspension',
          'user',
          $1,
          $2,
          $3
        )
      `,
      [
        userId,

        "Temporary suspension expired automatically.",

        {
          previousSuspendedAt:
            user.suspended_at,

          previousExpiresAt:
            user.suspension_expires_at,

          previousReason:
            user.suspension_reason,

          proposalId:
            user.suspension_proposal_id,

          automatic:
            true
        }
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | Audit Log
    |--------------------------------------------------------------------------
    |
    | admin_id is NULL because this was performed automatically.
    |
    */

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
          NULL,
          'user_auto_unsuspended',
          'user',
          $1,
          $2,
          $3,
          $4,
          $5
        )
      `,
      [
        userId,

        "Temporary suspension period expired.",

        {
          account_status:
            "suspended",

          suspended_at:
            user.suspended_at,

          suspension_expires_at:
            user.suspension_expires_at
        },

        {
          account_status:
            "active"
        },

        {
          automatic:
            true,

          proposalId:
            user.suspension_proposal_id
        }
      ]
    );


    await client.query(
      "COMMIT"
    );


    /*
    |--------------------------------------------------------------------------
    | Notify User After Commit
    |--------------------------------------------------------------------------
    */

    try {
      await sendAdminUserNotification({
        adminId: null,

        userId,

        title:
          "Account Access Restored",

        message:
          "Your temporary suspension has ended and your Unwind account is active again.",

        priority:
          "normal",

        iconName:
          "shield-check",

        actionUrl:
          "/notifications",

        referenceType:
          "automatic_unsuspension",

        referenceId:
          userId,

        metadata: {
          automatic:
            true
        }
      });

    } catch (
      notificationError
    ) {
      console.error(
        "Failed to send automatic unsuspension notification:",
        notificationError
      );
    }


    return {
      restored: true,
      user:
        restoredUser
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


/*
|--------------------------------------------------------------------------
| Expire All Suspensions That Have Ended
|--------------------------------------------------------------------------
*/

export async function
expireFinishedSuspensions({
  limit = 100
} = {}) {
  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 100,
        1
      ),
      500
    );


  const result =
    await pool.query(
      `
        SELECT
          user_id

        FROM users

        WHERE
          account_status =
            'suspended'

          AND
          suspension_expires_at
            IS NOT NULL

          AND
          suspension_expires_at
            <= NOW()

        ORDER BY
          suspension_expires_at
          ASC

        LIMIT $1
      `,
      [safeLimit]
    );


  const outcomes = [];


  for (
    const row
    of result.rows
  ) {
    try {
      const outcome =
        await expireSuspendedUser(
          row.user_id
        );

      outcomes.push(
        outcome
      );

    } catch (error) {
      console.error(
        `Failed to auto-unsuspend user ${row.user_id}:`,
        error
      );
    }
  }


  return {
    checked:
      result.rows.length,

    restored:
      outcomes.filter(
        (item) =>
          item?.restored ===
          true
      ).length,

    outcomes
  };
}


/*
|--------------------------------------------------------------------------
| Normalize User Suspension
|--------------------------------------------------------------------------
|
| Useful inside authentication / refresh flows.
|
| If a suspended user's expiry has already passed, this automatically
| restores them before access decisions continue.
|
*/

export async function
normalizeUserSuspension(
  user
) {
  if (!user) {
    return user;
  }


  if (
    user.account_status !==
    "suspended"
  ) {
    return user;
  }


  if (
    !user.suspension_expires_at
  ) {
    return user;
  }


  const expiry =
    new Date(
      user.suspension_expires_at
    );


  if (
    Number.isNaN(
      expiry.getTime()
    ) ||
    expiry.getTime() >
      Date.now()
  ) {
    return user;
  }


  const result =
    await expireSuspendedUser(
      user.user_id
    );


  if (
    result?.restored &&
    result.user
  ) {
    return {
      ...user,
      ...result.user,

      suspended_at:
        null,

      suspension_expires_at:
        null,

      suspension_reason:
        null,

      suspension_proposal_id:
        null
    };
  }


  return user;
}