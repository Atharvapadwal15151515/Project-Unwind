import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

import {
  findActiveChatRoomById,
  findOrCreatePublicChatRoom,
  updateChatRoomLastActivity
} from "../../models/community/chatRoom.model.js";

import {
  notifyPublicChatReply
} from "../notification/communityNotification.service.js";

import {
  findRoomMember,
  updateLastRead
} from "../../models/community/chatRoomMember.model.js";

import {
  createChatMessage,
  findChatMessageById,
  findChatMessageByIdForUpdate,
  findRoomMessagesByCursor,
  findReplyTarget,
  countUnreadRoomMessages,
  updateChatMessage,
  softDeleteChatMessage
} from "../../models/community/chatMessage.model.js";

const MAX_MESSAGE_LENGTH = 2000;
const EDIT_WINDOW_MINUTES = 10;

function normalizeMessageText(messageText) {
  if (typeof messageText !== "string") {
    return "";
  }

  return messageText.trim();
}

function ensureValidMessageText(messageText) {
  const normalizedText = normalizeMessageText(messageText);

  if (!normalizedText) {
    throw new AppError("Message text is required.", 400);
  }

  if (normalizedText.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      400
    );
  }

  return normalizedText;
}

function ensureActiveMembership(member) {
  if (!member) {
    throw new AppError("You are not a member of this chat room.", 403);
  }

  if (member.is_removed) {
    throw new AppError(
      "You have been removed from this chat room.",
      403
    );
  }

  if (member.left_at) {
    throw new AppError(
      "You must join the chat room before sending messages.",
      403
    );
  }

  if (member.is_muted) {
    throw new AppError(
      "You are currently muted in this chat room.",
      403
    );
  }
}

function ensureMessageOwner(message, userId) {
  if (message.sender_user_id !== userId) {
    throw new AppError(
      "You can only modify your own messages.",
      403
    );
  }
}

function ensureMessageCanBeEdited(message) {
  if (message.is_deleted) {
    throw new AppError("Deleted messages cannot be edited.", 400);
  }

  if (message.message_type !== "text") {
    throw new AppError(
      "Only text messages can currently be edited.",
      400
    );
  }

  const createdAt = new Date(message.created_at).getTime();
  const editDeadline =
    createdAt + EDIT_WINDOW_MINUTES * 60 * 1000;

  if (Date.now() > editDeadline) {
    throw new AppError(
      `Messages can only be edited within ${EDIT_WINDOW_MINUTES} minutes.`,
      400
    );
  }
}

async function getActiveMember({
  roomId,
  userId,
  client = pool
}) {
  const member = await findRoomMember({
    roomId,
    userId,
    client
  });

  ensureActiveMembership(member);

  return member;
}

export async function sendChatMessage({
  roomId,
  userId,
  messageText,
  replyToMessageId = null,
  messageType = "text"
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const room = await findActiveChatRoomById({
      roomId,
      client
    });

    if (!room) {
      throw new AppError("Chat room not found.", 404);
    }

    if (room.is_locked) {
      throw new AppError(
        "This chat room is currently locked.",
        403
      );
    }

    const member = await getActiveMember({
      roomId,
      userId,
      client
    });

    const normalizedText = ensureValidMessageText(messageText);

    let replyTarget = null;

    if (replyToMessageId) {
      replyTarget = await findReplyTarget({
        messageId: replyToMessageId,
        roomId,
        client
      });

      if (!replyTarget) {
        throw new AppError(
          "The message you are replying to was not found.",
          404
        );
      }
    }

    const createdMessage = await createChatMessage({
      roomId,
      senderUserId: userId,
      senderVisibleName: member.visible_name,
      senderIdentityMode: member.identity_mode,
      messageText: normalizedText,
      replyToMessageId,
      messageType,
      client
    });

   await client.query("COMMIT");

const completeMessage =
  await findChatMessageById({
    messageId:
      createdMessage.chat_message_id
  });

Promise.allSettled([
  updateChatRoomLastActivity({
    roomId
  }),
  updateLastRead({
    roomId,
    userId
  })
]).catch(() => {});
if (replyTarget) {
  await notifyPublicChatReply({
    replyTarget,

    message:
      completeMessage,

    actorUserId:
      userId,

    actorVisibleName:
      member.visible_name
  });
}

return completeMessage;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function sendPublicChatMessage({
  roomId,
  userId,
  messageText,
  replyToMessageId = null
}) {
  if (!roomId) {
    throw new AppError(
      "Public chat room is unavailable.",
      400
    );
  }

  return sendChatMessage({
    roomId,
    userId,
    messageText,
    replyToMessageId,
    messageType: "text"
  });
}

export async function getChatMessageHistory({
  roomId,
  userId,
  limit = 30,
  beforeCreatedAt = null,
  beforeMessageId = null,
  requireMembership = true
}) {
  const room = await findActiveChatRoomById({
    roomId
  });

  if (!room) {
    throw new AppError("Chat room not found.", 404);
  }

 if (requireMembership) {
  await getActiveMember({
    roomId,
    userId
  });
}

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  const messages = await findRoomMessagesByCursor({
    roomId,
    limit: normalizedLimit + 1,
    beforeCreatedAt,
    beforeMessageId
  });

  const hasMore = messages.length > normalizedLimit;

  if (hasMore) {
    messages.shift();
  }

  const oldestMessage = messages[0] ?? null;

  return {
    messages,
    pagination: {
      limit: normalizedLimit,
      has_more: hasMore,
      next_cursor: oldestMessage
        ? {
            before_created_at: oldestMessage.created_at,
            before_message_id:
              oldestMessage.chat_message_id
          }
        : null
    }
  };
}

export async function getPublicChatMessageHistory({
  userId,
  limit = 30,
  beforeCreatedAt = null,
  beforeMessageId = null
}) {
  const room =
    await findOrCreatePublicChatRoom();

  return getChatMessageHistory({
    roomId:
      room.room_id,

    userId,

    limit,

    beforeCreatedAt,

    beforeMessageId,

    requireMembership:
      false
  });
}

export async function editChatMessage({
  messageId,
  userId,
  messageText
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const message = await findChatMessageByIdForUpdate({
      messageId,
      client
    });

    if (!message) {
      throw new AppError("Chat message not found.", 404);
    }

    ensureMessageOwner(message, userId);
    ensureMessageCanBeEdited(message);

    await getActiveMember({
      roomId: message.room_id,
      userId,
      client
    });

    const normalizedText = ensureValidMessageText(messageText);

    const updatedMessage = await updateChatMessage({
      messageId,
      messageText: normalizedText,
      client
    });

    await updateChatRoomLastActivity({
      roomId: message.room_id,
      client
    });

    await client.query("COMMIT");

    return findChatMessageById({
      messageId: updatedMessage.chat_message_id
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteChatMessage({
  messageId,
  userId
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const message = await findChatMessageByIdForUpdate({
      messageId,
      client
    });

    if (!message) {
      throw new AppError("Chat message not found.", 404);
    }

    if (message.is_deleted) {
      throw new AppError(
        "This message has already been deleted.",
        400
      );
    }

    ensureMessageOwner(message, userId);

    await getActiveMember({
      roomId: message.room_id,
      userId,
      client
    });

    const deletedMessage = await softDeleteChatMessage({
      messageId,
      deletedBy: "sender",
      client
    });

    await updateChatRoomLastActivity({
      roomId: message.room_id,
      client
    });

    await client.query("COMMIT");

    return deletedMessage;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUnreadMessageCount({
  roomId,
  userId
}) {
  const room = await findActiveChatRoomById({
    roomId
  });

  if (!room) {
    throw new AppError("Chat room not found.", 404);
  }

  const member = await getActiveMember({
    roomId,
    userId
  });

  const unreadCount = await countUnreadRoomMessages({
    roomId,
    userId,
    lastReadAt: member.last_read_at
  });

  return {
    room_id: roomId,
    unread_count: unreadCount
  };
}

export async function markChatMessagesAsRead({
  roomId,
  userId
}) {
  const room = await findActiveChatRoomById({
    roomId
  });

  if (!room) {
    throw new AppError("Chat room not found.", 404);
  }

  await getActiveMember({
    roomId,
    userId
  });

  const membership = await updateLastRead({
    roomId,
    userId
  });

  return {
    room_id: roomId,
    last_read_at: membership.last_read_at
  };
}

export async function getChatMessageById({
  messageId,
  userId
}) {
  const message = await findChatMessageById({
    messageId
  });

  if (!message) {
    throw new AppError("Chat message not found.", 404);
  }

  await getActiveMember({
    roomId: message.room_id,
    userId
  });

  return message;
}