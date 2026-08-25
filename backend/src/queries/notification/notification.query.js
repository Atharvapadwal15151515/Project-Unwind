/*
|--------------------------------------------------------------------------
| Notification Select Fields
|--------------------------------------------------------------------------
*/

const NOTIFICATION_SELECT_FIELDS = `
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
  n.is_active,

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
`;

/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/

export const CREATE_NOTIFICATION_QUERY = `
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
    $12,
    $13,
    $14
  )
  RETURNING *
`;

/*
|--------------------------------------------------------------------------
| Find Notification By ID
|--------------------------------------------------------------------------
*/

export const FIND_NOTIFICATION_BY_ID_QUERY = `
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
`;

/*
|--------------------------------------------------------------------------
| Find Existing Users
|--------------------------------------------------------------------------
*/

export const FIND_EXISTING_NOTIFICATION_USERS_QUERY = `
  SELECT
    user_id
  FROM users
  WHERE user_id = ANY(
    $1::uuid[]
  )
`;

/*
|--------------------------------------------------------------------------
| Assign Notification To Users
|--------------------------------------------------------------------------
*/

export const ASSIGN_NOTIFICATION_TO_USERS_QUERY = `
  INSERT INTO user_notifications (
    notification_id,
    user_id,
    is_delivered,
    delivered_at
  )
  SELECT
    $1,
    selected_user_id,
    TRUE,
    CURRENT_TIMESTAMP
  FROM UNNEST(
    $2::uuid[]
  ) AS selected_user_id
  ON CONFLICT (
    notification_id,
    user_id
  )
  DO NOTHING
`;

/*
|--------------------------------------------------------------------------
| Build User Notifications Count Query
|--------------------------------------------------------------------------
*/

export function buildUserNotificationsCountQuery(
  whereClause
) {
  return `
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
  `;
}

/*
|--------------------------------------------------------------------------
| Build User Notifications List Query
|--------------------------------------------------------------------------
*/

export function buildUserNotificationsListQuery({
  whereClause,
  limitParameter,
  offsetParameter
}) {
  return `
    SELECT 
      ${NOTIFICATION_SELECT_FIELDS}

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
  `;
}

/*
|--------------------------------------------------------------------------
| Get User Notification By ID
|--------------------------------------------------------------------------
*/

export const GET_USER_NOTIFICATION_BY_ID_QUERY = `
  SELECT
    ${NOTIFICATION_SELECT_FIELDS}

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

    (
      n.audience_type = 'global'

      OR

      un.user_id = $1
    )

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

  LIMIT 1
`;

/*
|--------------------------------------------------------------------------
| Get Unread Notification Count
|--------------------------------------------------------------------------
*/

export const GET_UNREAD_NOTIFICATION_COUNT_QUERY = `
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
`;

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export const MARK_NOTIFICATION_AS_READ_QUERY = `
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
`;

/*
|--------------------------------------------------------------------------
| Create Missing Global User Notification Rows
|--------------------------------------------------------------------------
*/

export const MARK_GLOBAL_NOTIFICATIONS_AS_READ_QUERY = `
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
`;

/*
|--------------------------------------------------------------------------
| Mark Assigned Notifications As Read
|--------------------------------------------------------------------------
*/

export const MARK_ASSIGNED_NOTIFICATIONS_AS_READ_QUERY = `
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

    un.is_dismissed = FALSE

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
`;

/*
|--------------------------------------------------------------------------
| Dismiss Notification
|--------------------------------------------------------------------------
*/

export const DISMISS_NOTIFICATION_QUERY = `
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
`;

/*
|--------------------------------------------------------------------------
| Restore Dismissed Notification
|--------------------------------------------------------------------------
*/

export const RESTORE_NOTIFICATION_QUERY = `
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
`;

/*
|--------------------------------------------------------------------------
| Delete User Notification
|--------------------------------------------------------------------------
*/

export const DELETE_USER_NOTIFICATION_QUERY = `
  DELETE FROM user_notifications
  WHERE
    notification_id = $1

    AND

    user_id = $2

  RETURNING
    user_notification_id
`;

/*
|--------------------------------------------------------------------------
| Deactivate Notification
|--------------------------------------------------------------------------
*/

export const DEACTIVATE_NOTIFICATION_QUERY = `
  UPDATE notifications
  SET
    is_active = FALSE,

    updated_at =
      CURRENT_TIMESTAMP

  WHERE
    notification_id = $1

  RETURNING *
`;

/*
|--------------------------------------------------------------------------
| Delete Main Notification
|--------------------------------------------------------------------------
*/

export const DELETE_NOTIFICATION_QUERY = `
  DELETE FROM notifications
  WHERE notification_id = $1
  RETURNING
    notification_id
`;