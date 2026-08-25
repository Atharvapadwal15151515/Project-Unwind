import pool from "../../config/database.js";

import {
  createDirectMessage,
  findDirectMessageById,
  findDirectMessageByIdForUpdate,
  findDirectMessagesByCursor,
  findDirectMessageReplyTarget,
  updateDirectMessage,
  softDeleteDirectMessage,
  countUnreadDirectMessages,
} from "../../models/community/directMessage.model.js";

import {
  updateDirectConversationLastRead,
} from "../../models/community/directConversationMember.model.js";

import {
  notifyDirectMessage
} from "../notification/communityNotification.service.js";

import {
  verifyDirectConversationAccess,
  touchDirectConversation,
} from "./directConversation.service.js";

const MAX_MESSAGE_LENGTH = 2000;
const EDIT_WINDOW_MINUTES = 10;

async function ensureDirectMessagingAllowed(
  userId
) {
  const result =
    await pool.query(
      `
        SELECT
          restriction_type

        FROM user_restrictions

        WHERE user_id = $1

          AND is_active = TRUE

          AND starts_at <= NOW()

          AND (
            expires_at IS NULL
            OR expires_at > NOW()
          )

          AND restriction_type IN (
            'community_chat_block',
            'community_mute',
            'temporary_account_restriction'
          )

        LIMIT 1
      `,
      [
        userId
      ]
    );

  if (result.rows.length > 0) {
    throw createServiceError(
      "You are currently unable to send messages.",
      403,
      "DIRECT_MESSAGE_RESTRICTED"
    );
  }
}

/**
 * Create a consistent service error.
 */
function createServiceError(
  message,
  statusCode = 400,
  code = "DIRECT_MESSAGE_ERROR"
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;

  return error;
}

/**
 * Validate and normalize message text.
 */
function validateMessageText(messageText) {
  if (
    typeof messageText !== "string" ||
    !messageText.trim()
  ) {
    throw createServiceError(
      "Message text is required.",
      400,
      "MESSAGE_REQUIRED"
    );
  }

  const normalizedText = messageText.trim();

  if (normalizedText.length > MAX_MESSAGE_LENGTH) {
    throw createServiceError(
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      400,
      "MESSAGE_TOO_LONG"
    );
  }

  return normalizedText;
}

/**
 * Send a direct message.
 */
export async function sendDirectMessage({
  conversationId,
  userId,
  messageText,
  messageType = "text",
  replyToMessageId = null,
}) {
  await ensureDirectMessagingAllowed(
    userId
  );

  const { membership } =
    await verifyDirectConversationAccess({
      conversationId,
      userId,
    });

  const normalizedMessage =
    validateMessageText(messageText);

  if (replyToMessageId) {
    const replyTarget =
      await findDirectMessageReplyTarget(
        conversationId,
        replyToMessageId
      );

    if (!replyTarget) {
      throw createServiceError(
        "Reply target was not found in this conversation.",
        404,
        "REPLY_TARGET_NOT_FOUND"
      );
    }
  }

  const createdMessage =
    await createDirectMessage({
      conversationId,
      senderUserId: userId,
      senderVisibleName: membership.visible_name,
      senderIdentityMode: membership.identity_mode,
      messageText: normalizedMessage,
      replyToMessageId,
      messageType,
    });

  if (!createdMessage) {
    throw createServiceError(
      "Unable to create direct message.",
      500,
      "MESSAGE_CREATION_FAILED"
    );
  }

  await touchDirectConversation(
  conversationId
);

const completeMessage =
  await findDirectMessageById(
    createdMessage
      .direct_message_id
  );

await notifyDirectMessage({
  conversationId,

  messageId:
    createdMessage
      .direct_message_id,

  actorUserId:
    userId,

  actorVisibleName:
    membership
      .visible_name,

  messageText:
    normalizedMessage
});

return completeMessage;
}

/**
 * Return direct-message history using cursor pagination.
 */
export async function getDirectMessageHistory({
  conversationId,
  userId,
  beforeMessageId = null,
  limit = 30,
}) {
  await verifyDirectConversationAccess({
    conversationId,
    userId,
  });

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  return findDirectMessagesByCursor({
    conversationId,
    userId,
    beforeMessageId,
    limit: normalizedLimit,
  });
}

export async function getDirectMessageById({
  messageId,
  userId,
}) {
  const message =
    await findDirectMessageById(messageId);

  if (!message) {
    throw createServiceError(
      "Direct message not found.",
      404,
      "MESSAGE_NOT_FOUND"
    );
  }

  await verifyDirectConversationAccess({
    conversationId: message.conversation_id,
    userId,
  });

  return message;
}

/**
 * Edit the authenticated user's direct message.
 */
export async function editDirectMessage({
  messageId,
  userId,
  messageText,
}) {
  const normalizedMessage =
    validateMessageText(messageText);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const message =
      await findDirectMessageByIdForUpdate(
        messageId,
        client
      );

    if (!message) {
      throw createServiceError(
        "Direct message not found.",
        404,
        "MESSAGE_NOT_FOUND"
      );
    }

    await verifyDirectConversationAccess({
      conversationId: message.conversation_id,
      userId,
    });

    if (message.sender_user_id !== userId) {
      throw createServiceError(
        "You can edit only your own messages.",
        403,
        "MESSAGE_EDIT_FORBIDDEN"
      );
    }

    if (message.is_deleted) {
      throw createServiceError(
        "Deleted messages cannot be edited.",
        400,
        "MESSAGE_ALREADY_DELETED"
      );
    }

    const editableUntil =
      new Date(message.created_at);

    editableUntil.setMinutes(
      editableUntil.getMinutes() +
        EDIT_WINDOW_MINUTES
    );

    if (new Date() > editableUntil) {
      throw createServiceError(
        `Messages can only be edited within ${EDIT_WINDOW_MINUTES} minutes.`,
        403,
        "EDIT_WINDOW_EXPIRED"
      );
    }

    await updateDirectMessage({
      messageId,
      messageText: normalizedMessage,
      client,
    });

    await client.query(
  `
    UPDATE direct_conversations
    SET
      last_message_at = NOW(),
      updated_at = NOW()
    WHERE conversation_id = $1
  `,
  [
    message.conversation_id
  ]
);

    await client.query("COMMIT");

    return findDirectMessageById(messageId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Soft-delete a direct message.
 */
export async function deleteDirectMessage({
  messageId,
  userId,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const message =
      await findDirectMessageByIdForUpdate(
        messageId,
        client
      );

    if (!message) {
      throw createServiceError(
        "Direct message not found.",
        404,
        "MESSAGE_NOT_FOUND"
      );
    }

    await verifyDirectConversationAccess({
      conversationId: message.conversation_id,
      userId,
    });

    if (message.sender_user_id !== userId) {
      throw createServiceError(
        "You can delete only your own direct messages.",
        403,
        "MESSAGE_DELETE_FORBIDDEN"
      );
    }

    if (message.is_deleted) {
      throw createServiceError(
        "Message is already deleted.",
        400,
        "MESSAGE_ALREADY_DELETED"
      );
    }

    await softDeleteDirectMessage({
  messageId,
  deletedBy: "sender",
  client,
});

    await client.query(
  `
    UPDATE direct_conversations
    SET
      last_message_at = NOW(),
      updated_at = NOW()
    WHERE conversation_id = $1
  `,
  [
    message.conversation_id
  ]
);

    await client.query("COMMIT");

    return findDirectMessageById(messageId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mark a direct conversation as read.
 */
export async function markDirectMessagesAsRead({
  conversationId,
  userId,
}) {
  await verifyDirectConversationAccess({
    conversationId,
    userId,
  });

  const readStatus =
    await updateDirectConversationLastRead(
      conversationId,
      userId
    );

  return {
    conversation_id: conversationId,
    user_id: userId,
    last_read_at:
      readStatus?.last_read_at || new Date(),
  };
}

/**
 * Return unread direct-message count.
 */
export async function getUnreadDirectMessageCount({
  conversationId,
  userId,
}) {
  await verifyDirectConversationAccess({
    conversationId,
    userId,
  });

  const unreadCount =
    await countUnreadDirectMessages(
      conversationId,
      userId
    );

  return {
    conversation_id: conversationId,
    unread_count: unreadCount,
  };
}