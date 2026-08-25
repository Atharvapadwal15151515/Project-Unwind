import pool from "../../config/database.js";

import {
  getIO
} from "../../config/socket.js";

import {
  createNotification
} from "./notification.service.js";

import {
  getCommunityProfile
} from "../community/communityProfile.service.js";

/*
|--------------------------------------------------------------------------
| Socket Event
|--------------------------------------------------------------------------
*/

export const NOTIFICATION_SOCKET_EVENT =
  "notification:new";

/*
|--------------------------------------------------------------------------
| Recipient Normalizer
|--------------------------------------------------------------------------
*/

function uniqueRecipients(
  userIds = [],
  actorUserId = null
) {
  return [
    ...new Set(
      userIds
        .filter(Boolean)
        .map(String)
        .filter(
          userId =>
            userId !==
            String(
              actorUserId ||
                ""
            )
        )
    )
  ];
}

/*
|--------------------------------------------------------------------------
| Text Preview
|--------------------------------------------------------------------------
*/

function truncate(
  value,
  max = 120
) {
  const text =
    String(
      value || ""
    ).trim();

  if (
    text.length <= max
  ) {
    return text;
  }

  return `${text.slice(
    0,
    max - 1
  )}…`;
}

/*
|--------------------------------------------------------------------------
| UUID Detection
|--------------------------------------------------------------------------
|
| Some community entities such as private-room IDs may use numeric IDs.
| notification.reference_id expects UUID-compatible values in the current
| Phase 1 notification design.
|
| Non-UUID entity IDs are therefore stored safely in metadata instead.
|--------------------------------------------------------------------------
*/

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(
      value || ""
    )
  );
}

/*
|--------------------------------------------------------------------------
| Actor Name
|--------------------------------------------------------------------------
*/

async function resolveActorName(
  userId,
  fallback = "Someone"
) {
  if (!userId) {
    return fallback;
  }

  try {
    const result =
      await getCommunityProfile(
        userId
      );

    return (
      result?.visibleName ||
      fallback
    );
  } catch {
    return fallback;
  }
}

/*
|--------------------------------------------------------------------------
| Realtime Delivery
|--------------------------------------------------------------------------
*/

function emitRealtimeNotification(
  userIds,
  notification
) {
  try {
    const io =
      getIO();

    for (
      const userId of userIds
    ) {
      io
        .to(
          `user:${userId}`
        )
        .emit(
          NOTIFICATION_SOCKET_EVENT,
          {
            notification
          }
        );
    }
  } catch (error) {
    console.error(
      "Unable to emit realtime notification:",
      error?.message ||
        error
    );
  }
}

/*
|--------------------------------------------------------------------------
| Generic Community Notification
|--------------------------------------------------------------------------
*/

export async function createCommunityEventNotification({
  actorUserId = null,

  recipientUserIds = [],

  title,

  message,

  priority = "normal",

  iconName = "message-circle",

  actionUrl =
    "/dashboard/community",

  referenceType = null,

  referenceId = null,

  metadata = {}
}) {
  const recipients =
    uniqueRecipients(
      recipientUserIds,
      actorUserId
    );

  /*
   * Prevent:
   *
   * - self notifications
   * - notifications with no recipient
   */

  if (
    !recipients.length
  ) {
    return null;
  }

  try {
    const notification =
      await createNotification(
        actorUserId,
        {
          title,

          message,

          notificationType:
            "community",

          audienceType:
            recipients.length ===
            1
              ? "individual"
              : "selected_users",

          priority,

          iconName,

          actionUrl,

          referenceType,

          referenceId:
            isUuid(
              referenceId
            )
              ? String(
                  referenceId
                )
              : null,

          metadata: {
            ...metadata,

            actor_user_id:
              actorUserId ||
              null
          },

          userIds:
            recipients
        }
      );

    emitRealtimeNotification(
      recipients,
      notification
    );

    return notification;
  } catch (error) {
    /*
     * IMPORTANT:
     *
     * Notification failure must never
     * undo a successful like, comment,
     * message, etc.
     */

    console.error(
      "Community notification creation failed:",
      error?.message ||
        error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Post Like
|--------------------------------------------------------------------------
*/

export async function notifyPostLiked({
  post,
  actorUserId
}) {
  if (
    !post?.author_user_id
  ) {
    return null;
  }

  const actorName =
    await resolveActorName(
      actorUserId
    );

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds: [
      post.author_user_id
    ],

    title:
      "New like on your post",

    message:
      `${actorName} liked your post.`,

    iconName:
      "heart",

    actionUrl:
      "/dashboard/community",

    referenceType:
      "community_post",

    referenceId:
      post.post_id,

    metadata: {
      event:
        "post_liked",

      post_id:
        post.post_id,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Post Comment / Comment Reply
|--------------------------------------------------------------------------
*/

export async function notifyPostCommented({
  post,

  comment,

  parentComment = null,

  actorUserId,

  actorVisibleName
}) {
  const actorName =
    actorVisibleName ||
    (
      await resolveActorName(
        actorUserId
      )
    );

  const isReply =
    Boolean(
      parentComment
    );

  const recipientUserId =
    isReply
      ? parentComment
          ?.author_user_id
      : post
          ?.author_user_id;

  if (
    !recipientUserId
  ) {
    return null;
  }

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds: [
      recipientUserId
    ],

    title:
      isReply
        ? "New reply to your comment"
        : "New comment on your post",

    message:
      isReply
        ? `${actorName} replied: “${truncate(
            comment
              ?.comment_text
          )}”`
        : `${actorName} commented: “${truncate(
            comment
              ?.comment_text
          )}”`,

    iconName:
      "message-circle",

    actionUrl:
      "/dashboard/community",

    referenceType:
      isReply
        ? "post_comment"
        : "community_post",

    referenceId:
      isReply
        ? comment
            ?.comment_id
        : post
            ?.post_id,

    metadata: {
      event:
        isReply
          ? "comment_replied"
          : "post_commented",

      post_id:
        post?.post_id ||
        comment?.post_id ||
        null,

      comment_id:
        comment
          ?.comment_id ||
        null,

      parent_comment_id:
        parentComment
          ?.comment_id ||
        null,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Comment Like
|--------------------------------------------------------------------------
*/

export async function notifyCommentLiked({
  comment,
  actorUserId
}) {
  if (
    !comment?.author_user_id
  ) {
    return null;
  }

  const actorName =
    await resolveActorName(
      actorUserId
    );

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds: [
      comment.author_user_id
    ],

    title:
      "New like on your comment",

    message:
      `${actorName} liked your comment.`,

    iconName:
      "heart",

    actionUrl:
      "/dashboard/community",

    referenceType:
      "post_comment",

    referenceId:
      comment.comment_id,

    metadata: {
      event:
        "comment_liked",

      post_id:
        comment.post_id,

      comment_id:
        comment.comment_id,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Direct Conversation Started
|--------------------------------------------------------------------------
*/

export async function notifyDirectConversationStarted({
  conversationId,

  actorUserId,

  recipientUserId,

  actorVisibleName
}) {
  const actorName =
    actorVisibleName ||
    (
      await resolveActorName(
        actorUserId
      )
    );

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds: [
      recipientUserId
    ],

    title:
      "New direct conversation",

    message:
      `${actorName} started a conversation with you.`,

    iconName:
      "message-circle",

    actionUrl:
      "/dashboard/direct-messages",

    referenceType:
      "direct_conversation",

    referenceId:
      conversationId,

    metadata: {
      event:
        "direct_conversation_started",

      conversation_id:
        conversationId,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Direct Message
|--------------------------------------------------------------------------
*/

export async function notifyDirectMessage({
  conversationId,

  messageId,

  actorUserId,

  actorVisibleName,

  messageText
}) {
  const {
    rows
  } =
    await pool.query(
      `
        SELECT
          user_id

        FROM
          direct_conversation_members

        WHERE
          conversation_id = $1

          AND user_id <> $2

          AND left_at IS NULL

          AND request_status =
            'accepted'
      `,
      [
        conversationId,
        actorUserId
      ]
    );

  const actorName =
    actorVisibleName ||
    (
      await resolveActorName(
        actorUserId
      )
    );

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds:
      rows.map(
        row =>
          row.user_id
      ),

    title:
      `New message from ${actorName}`,

    message:
      truncate(
        messageText,
        180
      ) ||
      "Sent you a message.",

    iconName:
      "message-circle",

    actionUrl:
      "/dashboard/direct-messages",

    referenceType:
      "direct_message",

    referenceId:
      messageId,

    metadata: {
      event:
        "direct_message_received",

      conversation_id:
        conversationId,

      message_id:
        messageId,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Private Room Message
|--------------------------------------------------------------------------
*/

export async function notifyPrivateRoomMessage({
  room,

  messageId,

  actorUserId,

  actorVisibleName,

  messageText
}) {
  const {
    rows
  } =
    await pool.query(
      `
        SELECT
          user_id

        FROM
          chat_room_members

        WHERE
          room_id = $1

          AND user_id <> $2

          AND left_at IS NULL

          AND is_removed = FALSE
      `,
      [
        room.room_id,
        actorUserId
      ]
    );

  const actorName =
    actorVisibleName ||
    (
      await resolveActorName(
        actorUserId
      )
    );

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds:
      rows.map(
        row =>
          row.user_id
      ),

    title:
      `New message in ${
        room.room_name ||
        "private room"
      }`,

    message:
      `${actorName}: ${truncate(
        messageText,
        160
      )}`,

    iconName:
      "message-circle",

    actionUrl:
      "/dashboard/private-rooms",

    referenceType:
      "private_room_message",

    referenceId:
      messageId,

    metadata: {
      event:
        "private_room_message_received",

      room_id:
        room.room_id,

      room_name:
        room.room_name ||
        null,

      message_id:
        messageId,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Community Chat Reply
|--------------------------------------------------------------------------
*/

export async function notifyPublicChatReply({
  replyTarget,

  message,

  actorUserId,

  actorVisibleName
}) {
  if (
    !replyTarget
      ?.sender_user_id
  ) {
    return null;
  }

  const actorName =
    actorVisibleName ||
    (
      await resolveActorName(
        actorUserId
      )
    );

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds: [
      replyTarget
        .sender_user_id
    ],

    title:
      "New reply in Community Chat",

    message:
      `${actorName} replied: “${truncate(
        message
          ?.message_text
      )}”`,

    iconName:
      "message-circle",

    actionUrl:
      "/dashboard/community-chat",

    referenceType:
      "chat_message",

    referenceId:
      message
        ?.chat_message_id,

    metadata: {
      event:
        "community_chat_reply",

      room_id:
        message
          ?.room_id ||
        null,

      message_id:
        message
          ?.chat_message_id ||
        null,

      reply_to_message_id:
        replyTarget
          .chat_message_id ||
        null,

      actor_visible_name:
        actorName
    }
  });
}

/*
|--------------------------------------------------------------------------
| Private Room Moderation
|--------------------------------------------------------------------------
*/

export async function notifyPrivateRoomModeration({
  room,

  actorUserId,

  targetUserId,

  event,

  isMuted = null
}) {
  const messages = {
    removed:
      `You were removed from ${
        room?.room_name ||
        "a private room"
      }.`,

    muted:
      `You were muted in ${
        room?.room_name ||
        "a private room"
      }.`,

    unmuted:
      `You were unmuted in ${
        room?.room_name ||
        "a private room"
      }.`,

    ownership_transferred:
      `You are now the owner of ${
        room?.room_name ||
        "a private room"
      }.`
  };

  return createCommunityEventNotification({
    actorUserId,

    recipientUserIds: [
      targetUserId
    ],

    title:
      event ===
      "ownership_transferred"
        ? "Private room ownership transferred"
        : "Private room update",

    message:
      messages[event] ||
      (
        isMuted
          ? messages.muted
          : messages.unmuted
      ),

    priority:
      event === "removed"
        ? "high"
        : "normal",

    iconName:
      "message-circle",

    actionUrl:
      "/dashboard/private-rooms",

    referenceType:
      "private_room",

    referenceId:
      room?.room_id,

    metadata: {
      event:
        `private_room_${event}`,

      room_id:
        room?.room_id ||
        null,

      room_name:
        room?.room_name ||
        null
    }
  });
}