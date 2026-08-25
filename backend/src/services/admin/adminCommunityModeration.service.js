import pool
  from "../../config/database.js";

import {
  sendAdminUserNotification
} from "./adminNotification.service.js";

async function getContent(
  client,
  targetType,
  targetId
) {
  if (targetType === "post") {
    const result =
      await client.query(
        `
          SELECT
            post_id AS id,
            author_user_id AS user_id,
            caption AS content,
            is_deleted
          FROM community_posts
          WHERE post_id = $1
          LIMIT 1
        `,
        [targetId]
      );

    return result.rows[0] || null;
  }


  if (targetType === "comment") {
    const result =
      await client.query(
        `
          SELECT
            comment_id AS id,
            author_user_id AS user_id,
            comment_text AS content,
            is_deleted
          FROM post_comments
          WHERE comment_id = $1
          LIMIT 1
        `,
        [targetId]
      );

    return result.rows[0] || null;
  }


  if (targetType === "chat_message") {
    const result =
      await client.query(
        `
          SELECT
            chat_message_id AS id,
            sender_user_id AS user_id,
            message_text AS content,
            is_deleted
          FROM chat_messages
          WHERE chat_message_id = $1
          LIMIT 1
        `,
        [targetId]
      );

    return result.rows[0] || null;
  }


  return null;
}


async function softDeleteContent(
  client,
  targetType,
  targetId
) {
  if (targetType === "post") {
    return client.query(
      `
        UPDATE community_posts

        SET
          is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = 'moderator',
          updated_at = NOW()

        WHERE post_id = $1

        RETURNING *
      `,
      [targetId]
    );
  }


  if (targetType === "comment") {
    return client.query(
      `
        UPDATE post_comments

        SET
          is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = 'moderator',
          updated_at = NOW()

        WHERE comment_id = $1

        RETURNING *
      `,
      [targetId]
    );
  }


  if (targetType === "chat_message") {
    return client.query(
      `
        UPDATE chat_messages

        SET
          is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = 'moderator',
          updated_at = NOW()

        WHERE chat_message_id = $1

        RETURNING *
      `,
      [targetId]
    );
  }


  return null;
}


async function restoreContent(
  client,
  targetType,
  targetId
) {
  if (targetType === "post") {
    return client.query(
      `
        UPDATE community_posts

        SET
          is_deleted = FALSE,
          deleted_at = NULL,
          deleted_by = NULL,
          updated_at = NOW()

        WHERE post_id = $1

        RETURNING *
      `,
      [targetId]
    );
  }


  if (targetType === "comment") {
    return client.query(
      `
        UPDATE post_comments

        SET
          is_deleted = FALSE,
          deleted_at = NULL,
          deleted_by = NULL,
          updated_at = NOW()

        WHERE comment_id = $1

        RETURNING *
      `,
      [targetId]
    );
  }


  return null;
}


export async function removeCommunityContent({
  adminId,
  targetType,
  targetId,
  reason
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const content =
      await getContent(
        client,
        targetType,
        targetId
      );

    if (!content) {
      await client.query("ROLLBACK");

      return null;
    }

    if (content.is_deleted) {
      throw new Error(
        "CONTENT_ALREADY_DELETED"
      );
    }

    const deleteResult =
      await softDeleteContent(
        client,
        targetType,
        targetId
      );

    if (!deleteResult) {
      throw new Error(
        "INVALID_CONTENT_TYPE"
      );
    }

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
          $1,
          $2,
          'content_removed',
          $3,
          $4,
          $5,
          $6
        )
      `,
      [
        adminId,
        content.user_id,
        targetType,
        targetId,
        reason,
        {
          contentPreview:
            content.content
              ?.slice(0, 200) ||
            null
        }
      ]
    );


    await client.query(
      `
        INSERT INTO admin_audit_logs (
          admin_id,
          action,
          target_type,
          target_id,
          reason,
          old_value,
          new_value
        )

        VALUES (
          $1,
          'community_content_removed',
          $2,
          $3,
          $4,
          $5,
          $6
        )
      `,
      [
        adminId,
        targetType,
        targetId,
        reason,

        {
          is_deleted: false
        },

        {
          is_deleted: true,
          deleted_by: "moderator"
        }
      ]
    );


    await client.query("COMMIT");

/*
|--------------------------------------------------------------------------
| Notify Content Owner
|--------------------------------------------------------------------------
*/

if (content.user_id) {
  try {
    const contentLabels = {
      post: "post",
      comment: "comment",
      chat_message: "chat message"
    };

    const contentLabel =
      contentLabels[targetType] ||
      "content";

    await sendAdminUserNotification({
      adminId,

      userId:
        content.user_id,

      title:
        "Community Content Removed",

      message:
        `Your ${contentLabel} was removed following a moderation review.`,

      priority:
        "high",

      iconName:
        "trash-2",

      actionUrl:
        "/notifications",

      referenceType:
        targetType,

      referenceId:
        targetId,

      metadata: {
        moderationAction:
          "content_removed",

        targetType
      }
    });

  } catch (notificationError) {
    console.error(
      "Failed to send content removal notification:",
      notificationError
    );
  }
}

return {
  targetType,
  targetId,

  userId:
    content.user_id,

  removed: true
};

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}


export async function restoreCommunityContent({
  adminId,
  targetType,
  targetId,
  reason
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    if (
      ![
        "post",
        "comment"
      ].includes(targetType)
    ) {
      throw new Error(
        "RESTORE_NOT_SUPPORTED"
      );
    }

    const content =
      await getContent(
        client,
        targetType,
        targetId
      );

    if (!content) {
      await client.query("ROLLBACK");

      return null;
    }

    if (!content.is_deleted) {
      throw new Error(
        "CONTENT_NOT_DELETED"
      );
    }

    await restoreContent(
      client,
      targetType,
      targetId
    );


    await client.query(
      `
        INSERT INTO moderation_actions (
          admin_id,
          target_user_id,
          action_type,
          target_type,
          target_id,
          reason
        )

        VALUES (
          $1,
          $2,
          'content_restored',
          $3,
          $4,
          $5
        )
      `,
      [
        adminId,
        content.user_id,
        targetType,
        targetId,
        reason
      ]
    );


    await client.query(
      `
        INSERT INTO admin_audit_logs (
          admin_id,
          action,
          target_type,
          target_id,
          reason,
          old_value,
          new_value
        )

        VALUES (
          $1,
          'community_content_restored',
          $2,
          $3,
          $4,
          $5,
          $6
        )
      `,
      [
        adminId,
        targetType,
        targetId,
        reason,

        {
          is_deleted: true
        },

        {
          is_deleted: false
        }
      ]
    );


    await client.query("COMMIT");

/*
|--------------------------------------------------------------------------
| Notify Content Owner
|--------------------------------------------------------------------------
*/

if (content.user_id) {
  try {
    const contentLabels = {
      post: "post",
      comment: "comment"
    };

    const contentLabel =
      contentLabels[targetType] ||
      "content";

    await sendAdminUserNotification({
      adminId,

      userId:
        content.user_id,

      title:
        "Community Content Restored",

      message:
        `Your ${contentLabel} has been restored following a moderation review.`,

      priority:
        "normal",

      iconName:
        "rotate-ccw",

      actionUrl:
        "/notifications",

      referenceType:
        targetType,

      referenceId:
        targetId,

      metadata: {
        moderationAction:
          "content_restored",

        targetType
      }
    });

  } catch (notificationError) {
    console.error(
      "Failed to send content restoration notification:",
      notificationError
    );
  }
}

return {
  targetType,
  targetId,

  userId:
    content.user_id,

  restored: true
};

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}