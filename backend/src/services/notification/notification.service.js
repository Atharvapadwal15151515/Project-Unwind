import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Notification Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/*
|--------------------------------------------------------------------------
| Normalize Pagination
|--------------------------------------------------------------------------
*/

function normalizePagination(
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT
) {
  const parsedPage =
    Number(page) || DEFAULT_PAGE;

  const parsedLimit =
    Number(limit) || DEFAULT_LIMIT;

  const safePage =
    Math.max(
      parsedPage,
      DEFAULT_PAGE
    );

  const safeLimit =
    Math.min(
      Math.max(
        parsedLimit,
        1
      ),
      MAX_LIMIT
    );

  return {
    page: safePage,
    limit: safeLimit,
    offset:
      (safePage - 1) *
      safeLimit
  };
}

/*
|--------------------------------------------------------------------------
| Verify Notification Exists
|--------------------------------------------------------------------------
*/

async function findNotificationById(
  notificationId,
  client = pool
) {
  const result =
    await client.query(
      `
        SELECT
          notification_id,
          title,
          message,
          notification_type,
          audience_type,
          priority,
          icon_name,
          action_url,
          reference_type,
          reference_id,
          metadata,
          starts_at,
          expires_at,
          is_active,
          created_by_user_id,
          created_at,
          updated_at
        FROM notifications
        WHERE notification_id = $1
        LIMIT 1
      `,
      [
        notificationId
      ]
    );

  return (
    result.rows[0] ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Verify Users Exist
|--------------------------------------------------------------------------
*/

async function verifyUsersExist(
  userIds,
  client
) {
  if (
    !Array.isArray(userIds) ||
    userIds.length === 0
  ) {
    return;
  }

  const uniqueUserIds = [
    ...new Set(userIds)
  ];

  const result =
    await client.query(
      `
        SELECT user_id
        FROM users
        WHERE user_id =
          ANY($1::uuid[])
      `,
      [
        uniqueUserIds
      ]
    );

  if (
    result.rows.length !==
    uniqueUserIds.length
  ) {
    throw new AppError(
      "One or more selected users do not exist",
      404
    );
  }
}

/*
|--------------------------------------------------------------------------
| Get Public Global Notifications
|--------------------------------------------------------------------------
|
| Used by the landing page.
| Does not use user_notifications.
|--------------------------------------------------------------------------
*/

export async function getPublicNotifications() {
  const result =
    await pool.query(
      `
        SELECT
          notification_id,
          title,
          message,
          notification_type,
          audience_type,
          priority,
          icon_name,
          action_url,
          reference_type,
          reference_id,
          metadata,
          starts_at,
          expires_at,
          created_at,
          updated_at
        FROM notifications
        WHERE
          audience_type = 'global'

          AND
          is_active = TRUE

          AND
          starts_at <=
          CURRENT_TIMESTAMP

          AND
          (
            expires_at IS NULL
            OR
            expires_at >
            CURRENT_TIMESTAMP
          )

        ORDER BY
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          created_at DESC

        LIMIT 10
      `
    );

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/

export async function createNotification(
  createdByUserId,
  notificationData
) {
  const {
    title,
    message,
    notificationType,
    audienceType,
    priority = "normal",
    iconName = null,
    actionUrl = null,
    referenceType = null,
    referenceId = null,
    metadata = {},
    startsAt = null,
    expiresAt = null,
    isActive = true,
    userIds = []
  } = notificationData;

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const uniqueUserIds = [
      ...new Set(userIds)
    ];

    if (
      audienceType !==
      "global"
    ) {
      await verifyUsersExist(
        uniqueUserIds,
        client
      );
    }

    const notificationResult =
      await client.query(
        `
          INSERT INTO notifications (
            title,
            message,
            notification_type,
            audience_type,
            priority,
            icon_name,
            action_url,
            reference_type,
            reference_id,
            metadata,
            starts_at,
            expires_at,
            is_active,
            created_by_user_id
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10::jsonb,
            COALESCE(
              $11::timestamptz,
              CURRENT_TIMESTAMP
            ),
            $12::timestamptz,
            $13,
            $14
          )
          RETURNING *
        `,
        [
          title,
          message,
          notificationType,
          audienceType,
          priority,
          iconName,
          actionUrl,
          referenceType,
          referenceId,
          JSON.stringify(
            metadata
          ),
          startsAt,
          expiresAt,
          isActive,
          createdByUserId || null
        ]
      );

    const notification =
      notificationResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Assign To Individual / Selected Users
    |--------------------------------------------------------------------------
    */

    if (
      audienceType !== "global" &&
      uniqueUserIds.length > 0
    ) {
      await client.query(
        `
          INSERT INTO user_notifications (
            notification_id,
            user_id,
            is_delivered,
            delivered_at
          )
          SELECT
            $1,
            user_id,
            TRUE,
            CURRENT_TIMESTAMP
          FROM UNNEST(
            $2::uuid[]
          ) AS user_id

          ON CONFLICT (
            notification_id,
            user_id
          )
          DO NOTHING
        `,
        [
          notification.notification_id,
          uniqueUserIds
        ]
      );
    }

    await client.query(
      "COMMIT"
    );

    return notification;
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
| Get User Notifications
|--------------------------------------------------------------------------
*/

export async function getUserNotifications(
  userId,
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(
    filters.page,
    filters.limit
  );

  const {
    notificationType,
    priority,
    unreadOnly = false,
    includeDismissed = false,
    dismissedOnly = false,
    search
  } = filters;

  const values = [
    userId
  ];

  const conditions = [
    `
      n.is_active = TRUE
    `,
    `
      n.starts_at <=
      CURRENT_TIMESTAMP
    `,
    `
      (
        n.expires_at IS NULL
        OR
        n.expires_at >
        CURRENT_TIMESTAMP
      )
    `,
    `
      (
        n.audience_type = 'global'
        OR
        un.user_id = $1
      )
    `
  ];

  if (
    notificationType
  ) {
    values.push(
      notificationType
    );

    conditions.push(
      `
        n.notification_type =
        $${values.length}
      `
    );
  }

  if (
    priority
  ) {
    values.push(
      priority
    );

    conditions.push(
      `
        n.priority =
        $${values.length}
      `
    );
  }

  if (
    unreadOnly
  ) {
    conditions.push(
      `
        COALESCE(
          un.is_read,
          FALSE
        ) = FALSE
      `
    );
  }

  if (
    dismissedOnly
  ) {
    conditions.push(
      `
        COALESCE(
          un.is_dismissed,
          FALSE
        ) = TRUE
      `
    );
  } else if (
    !includeDismissed
  ) {
    conditions.push(
      `
        COALESCE(
          un.is_dismissed,
          FALSE
        ) = FALSE
      `
    );
  }

  if (
    search
  ) {
    values.push(
      `%${search}%`
    );

    conditions.push(
      `
        (
          n.title ILIKE
          $${values.length}
          OR
          n.message ILIKE
          $${values.length}
        )
      `
    );
  }

  const whereClause =
    conditions.join(
      " AND "
    );

  /*
  |--------------------------------------------------------------------------
  | Count
  |--------------------------------------------------------------------------
  */

  const countResult =
    await pool.query(
      `
        SELECT
          COUNT(
            DISTINCT
            n.notification_id
          )::INTEGER AS total

        FROM notifications n

        LEFT JOIN user_notifications un
          ON
            un.notification_id =
            n.notification_id
            AND
            un.user_id = $1

        WHERE
          ${whereClause}
      `,
      values
    );

  /*
  |--------------------------------------------------------------------------
  | List
  |--------------------------------------------------------------------------
  */

  const queryValues = [
    ...values,
    limit,
    offset
  ];

  const limitParameter =
    queryValues.length - 1;

  const offsetParameter =
    queryValues.length;

  const notificationsResult =
    await pool.query(
      `
        SELECT
          n.notification_id,
          un.user_notification_id,

          n.title,
          n.message,
          n.notification_type,
          n.audience_type,
          n.priority,
          n.icon_name,
          n.action_url,

          n.reference_type,
          n.reference_id,
          n.metadata,

          n.starts_at,
          n.expires_at,

          COALESCE(
            un.is_delivered,
            TRUE
          ) AS is_delivered,

          un.delivered_at,

          COALESCE(
            un.is_read,
            FALSE
          ) AS is_read,

          un.read_at,

          COALESCE(
            un.is_dismissed,
            FALSE
          ) AS is_dismissed,

          un.dismissed_at,

          n.created_at,
          n.updated_at

        FROM notifications n

        LEFT JOIN user_notifications un
          ON
            un.notification_id =
            n.notification_id
            AND
            un.user_id = $1

        WHERE
          ${whereClause}

        ORDER BY
          CASE n.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          n.created_at DESC

        LIMIT
          $${limitParameter}

        OFFSET
          $${offsetParameter}
      `,
      queryValues
    );

  const total =
    countResult.rows[0]
      ?.total || 0;

  return {
    notifications:
      notificationsResult.rows,

    pagination: {
      page,
      limit,
      total,
      totalPages:
        Math.ceil(
          total / limit
        )
    }
  };
}

/*
|--------------------------------------------------------------------------
| Get User Notification Details
|--------------------------------------------------------------------------
*/

export async function getUserNotificationById(
  userId,
  notificationId
) {
  const result =
    await pool.query(
      `
        SELECT
          n.notification_id,
          un.user_notification_id,

          n.title,
          n.message,
          n.notification_type,
          n.audience_type,
          n.priority,
          n.icon_name,
          n.action_url,

          n.reference_type,
          n.reference_id,
          n.metadata,

          n.starts_at,
          n.expires_at,

          COALESCE(
            un.is_delivered,
            TRUE
          ) AS is_delivered,

          un.delivered_at,

          COALESCE(
            un.is_read,
            FALSE
          ) AS is_read,

          un.read_at,

          COALESCE(
            un.is_dismissed,
            FALSE
          ) AS is_dismissed,

          un.dismissed_at,

          n.created_at,
          n.updated_at

        FROM notifications n

        LEFT JOIN user_notifications un
          ON
            un.notification_id =
            n.notification_id
            AND
            un.user_id = $1

        WHERE
          n.notification_id = $2

          AND
          n.is_active = TRUE

          AND
          n.starts_at <=
          CURRENT_TIMESTAMP

          AND
          (
            n.expires_at IS NULL
            OR
            n.expires_at >
            CURRENT_TIMESTAMP
          )

          AND
          (
            n.audience_type = 'global'
            OR
            un.user_id = $1
          )

        LIMIT 1
      `,
      [
        userId,
        notificationId
      ]
    );

  const notification =
    result.rows[0];

  if (
    !notification
  ) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  return notification;
}

/*
|--------------------------------------------------------------------------
| Get Unread Notification Count
|--------------------------------------------------------------------------
*/

export async function getUnreadNotificationCount(
  userId
) {
  const result =
    await pool.query(
      `
        SELECT
          COUNT(
            DISTINCT
            n.notification_id
          )::INTEGER AS unread_count

        FROM notifications n

        LEFT JOIN user_notifications un
          ON
            un.notification_id =
            n.notification_id
            AND
            un.user_id = $1

        WHERE
          n.is_active = TRUE

          AND
          n.starts_at <=
          CURRENT_TIMESTAMP

          AND
          (
            n.expires_at IS NULL
            OR
            n.expires_at >
            CURRENT_TIMESTAMP
          )

          AND
          (
            n.audience_type = 'global'
            OR
            un.user_id = $1
          )

          AND
          COALESCE(
            un.is_read,
            FALSE
          ) = FALSE

          AND
          COALESCE(
            un.is_dismissed,
            FALSE
          ) = FALSE
      `,
      [
        userId
      ]
    );

  return {
    unreadCount:
      result.rows[0]
        ?.unread_count || 0
  };
}

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export async function markNotificationAsRead(
  userId,
  notificationId
) {
  const notification =
    await getUserNotificationById(
      userId,
      notificationId
    );

  const result =
    await pool.query(
      `
        INSERT INTO user_notifications (
          notification_id,
          user_id,
          is_delivered,
          delivered_at,
          is_read,
          read_at,
          is_dismissed
        )
        VALUES (
          $1,
          $2,
          TRUE,
          CURRENT_TIMESTAMP,
          TRUE,
          CURRENT_TIMESTAMP,
          FALSE
        )

        ON CONFLICT (
          notification_id,
          user_id
        )
        DO UPDATE SET
          is_read = TRUE,
          read_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP

        RETURNING *
      `,
      [
        notification.notification_id,
        userId
      ]
    );

  return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

export async function markAllNotificationsAsRead(
  userId
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Create State Rows For Global Notifications
    |--------------------------------------------------------------------------
    */

    await client.query(
      `
        INSERT INTO user_notifications (
          notification_id,
          user_id,
          is_delivered,
          delivered_at,
          is_read,
          read_at
        )

        SELECT
          n.notification_id,
          $1,
          TRUE,
          CURRENT_TIMESTAMP,
          TRUE,
          CURRENT_TIMESTAMP

        FROM notifications n

        WHERE
          n.audience_type =
          'global'

          AND
          n.is_active = TRUE

          AND
          n.starts_at <=
          CURRENT_TIMESTAMP

          AND
          (
            n.expires_at IS NULL
            OR
            n.expires_at >
            CURRENT_TIMESTAMP
          )

        ON CONFLICT (
          notification_id,
          user_id
        )
        DO UPDATE SET
          is_read = TRUE,
          read_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
      `,
      [
        userId
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Mark Assigned Notifications
    |--------------------------------------------------------------------------
    */

    const result =
      await client.query(
        `
          UPDATE user_notifications un

          SET
            is_read = TRUE,
            read_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP

          FROM notifications n

          WHERE
            un.notification_id =
            n.notification_id

            AND
            un.user_id = $1

            AND
            un.is_dismissed =
            FALSE

            AND
            n.is_active = TRUE

            AND
            n.starts_at <=
            CURRENT_TIMESTAMP

            AND
            (
              n.expires_at IS NULL
              OR
              n.expires_at >
              CURRENT_TIMESTAMP
            )

          RETURNING
            un.user_notification_id
        `,
        [
          userId
        ]
      );

    await client.query(
      "COMMIT"
    );

    return {
      updatedCount:
        result.rowCount
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
| Dismiss Notification
|--------------------------------------------------------------------------
*/

export async function dismissNotification(
  userId,
  notificationId
) {
  const notification =
    await getUserNotificationById(
      userId,
      notificationId
    );

  const result =
    await pool.query(
      `
        INSERT INTO user_notifications (
          notification_id,
          user_id,
          is_delivered,
          delivered_at,
          is_dismissed,
          dismissed_at
        )
        VALUES (
          $1,
          $2,
          TRUE,
          CURRENT_TIMESTAMP,
          TRUE,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT (
          notification_id,
          user_id
        )
        DO UPDATE SET
          is_dismissed = TRUE,
          dismissed_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP

        RETURNING *
      `,
      [
        notification.notification_id,
        userId
      ]
    );

  return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Restore Notification
|--------------------------------------------------------------------------
*/

export async function restoreNotification(
  userId,
  notificationId
) {
  const notification =
    await findNotificationById(
      notificationId
    );

  if (
    !notification
  ) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  const result =
    await pool.query(
      `
        UPDATE user_notifications

        SET
          is_dismissed = FALSE,
          dismissed_at = NULL,
          updated_at =
            CURRENT_TIMESTAMP

        WHERE
          notification_id = $1
          AND
          user_id = $2

        RETURNING *
      `,
      [
        notificationId,
        userId
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new AppError(
      "Dismissed notification not found",
      404
    );
  }

  return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Delete User Notification State
|--------------------------------------------------------------------------
|
| Global notifications are dismissed instead of deleting
| their state, otherwise they would immediately reappear.
|--------------------------------------------------------------------------
*/

export async function deleteUserNotification(
  userId,
  notificationId
) {
  const notification =
    await findNotificationById(
      notificationId
    );

  if (
    !notification
  ) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  if (
    notification.audience_type ===
    "global"
  ) {
    await dismissNotification(
      userId,
      notificationId
    );

    return {
      notificationId,
      deleted: false,
      dismissed: true
    };
  }

  const result =
    await pool.query(
      `
        DELETE FROM user_notifications

        WHERE
          notification_id = $1
          AND
          user_id = $2

        RETURNING
          user_notification_id
      `,
      [
        notificationId,
        userId
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new AppError(
      "User notification not found",
      404
    );
  }

  return {
    notificationId,
    deleted: true,
    dismissed: false
  };
}

/*
|--------------------------------------------------------------------------
| Delete All User Notifications
|--------------------------------------------------------------------------
|
| Assigned notifications are removed.
| Global notifications are dismissed for this user
| so they do not affect other users.
|--------------------------------------------------------------------------
*/

export async function deleteAllUserNotifications(
  userId
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Dismiss All Active Global Notifications
    |--------------------------------------------------------------------------
    */

    const globalResult =
      await client.query(
        `
          INSERT INTO user_notifications (
            notification_id,
            user_id,
            is_delivered,
            delivered_at,
            is_dismissed,
            dismissed_at
          )

          SELECT
            n.notification_id,
            $1,
            TRUE,
            CURRENT_TIMESTAMP,
            TRUE,
            CURRENT_TIMESTAMP

          FROM notifications n

          WHERE
            n.audience_type = 'global'

            AND
            n.is_active = TRUE

            AND
            n.starts_at <=
              CURRENT_TIMESTAMP

            AND
            (
              n.expires_at IS NULL
              OR
              n.expires_at >
                CURRENT_TIMESTAMP
            )

          ON CONFLICT (
            notification_id,
            user_id
          )

          DO UPDATE SET
            is_dismissed = TRUE,
            dismissed_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP

          RETURNING
            user_notification_id
        `,
        [
          userId
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | Delete Assigned Notifications
    |--------------------------------------------------------------------------
    */

    const assignedResult =
      await client.query(
        `
          DELETE FROM user_notifications un

          USING notifications n

          WHERE
            un.notification_id =
              n.notification_id

            AND
            un.user_id = $1

            AND
            n.audience_type <>
              'global'

          RETURNING
            un.user_notification_id
        `,
        [
          userId
        ]
      );

    await client.query(
      "COMMIT"
    );

    return {
      globalDismissed:
        globalResult.rowCount,

      assignedDeleted:
        assignedResult.rowCount,

      totalAffected:
        globalResult.rowCount +
        assignedResult.rowCount
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
| Update Main Notification
|--------------------------------------------------------------------------
*/

export async function updateNotification(
  notificationId,
  updateData
) {
  const existingNotification =
    await findNotificationById(
      notificationId
    );

  if (
    !existingNotification
  ) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Effective Date Range
  |--------------------------------------------------------------------------
  */

  const effectiveStartsAt =
    Object.prototype.hasOwnProperty.call(
      updateData,
      "startsAt"
    )
      ? updateData.startsAt
      : existingNotification.starts_at;

  const effectiveExpiresAt =
    Object.prototype.hasOwnProperty.call(
      updateData,
      "expiresAt"
    )
      ? updateData.expiresAt
      : existingNotification.expires_at;

  if (
    effectiveStartsAt &&
    effectiveExpiresAt &&
    new Date(effectiveExpiresAt) <=
      new Date(effectiveStartsAt)
  ) {
    throw new AppError(
      "Expiration time must be after the start time",
      400
    );
  }

  const fieldMap = {
    title:
      "title",

    message:
      "message",

    notificationType:
      "notification_type",

    priority:
      "priority",

    iconName:
      "icon_name",

    actionUrl:
      "action_url",

    referenceType:
      "reference_type",

    referenceId:
      "reference_id",

    metadata:
      "metadata",

    startsAt:
      "starts_at",

    expiresAt:
      "expires_at",

    isActive:
      "is_active"
  };

  const setClauses = [];
  const values = [];

  for (
    const [
      key,
      column
    ] of Object.entries(
      fieldMap
    )
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        updateData,
        key
      )
    ) {
      continue;
    }

    let value =
      updateData[key];

    if (
      key ===
      "metadata"
    ) {
      value =
        JSON.stringify(
          value
        );

      values.push(
        value
      );

      setClauses.push(
        `${column} = $${values.length}::jsonb`
      );

      continue;
    }

    values.push(
      value
    );

    setClauses.push(
      `${column} = $${values.length}`
    );
  }

  if (
    setClauses.length === 0
  ) {
    throw new AppError(
      "No notification fields were provided",
      400
    );
  }

  values.push(
    notificationId
  );

  const result =
    await pool.query(
      `
        UPDATE notifications

        SET
          ${setClauses.join(", ")},
          updated_at =
            CURRENT_TIMESTAMP

        WHERE
          notification_id =
          $${values.length}

        RETURNING *
      `,
      values
    );

  return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Deactivate Main Notification
|--------------------------------------------------------------------------
*/

export async function deactivateNotification(
  notificationId
) {
  const result =
    await pool.query(
      `
        UPDATE notifications

        SET
          is_active = FALSE,
          updated_at =
            CURRENT_TIMESTAMP

        WHERE
          notification_id = $1

        RETURNING *
      `,
      [
        notificationId
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  return result.rows[0];
}