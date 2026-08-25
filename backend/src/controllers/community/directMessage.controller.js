import {
  sendDirectMessage,
  getDirectMessageHistory,
  getDirectMessageById,
  editDirectMessage,
  deleteDirectMessage,
  markDirectMessagesAsRead,
  getUnreadDirectMessageCount,
} from "../../services/community/directMessage.service.js";

/**
 * Send a direct message.
 *
 * POST /api/direct-conversations/:conversationId/messages
 */
export async function sendDirectMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const {
      messageText,
      messageType = "text",
      replyToMessageId = null,
    } = req.body;

    const message = await sendDirectMessage({
      conversationId,
      userId,
      messageText,
      messageType,
      replyToMessageId,
    });

    return res.status(201).json({
      success: true,
      message: "Direct message sent.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get direct-message history.
 *
 * GET /api/direct-conversations/:conversationId/messages
 *
 * Query parameters:
 * beforeMessageId
 * limit
 */
export async function getDirectMessageHistoryController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;
    const { beforeMessageId, limit } = req.query;

    const messages = await getDirectMessageHistory({
      conversationId,
      userId,
      beforeMessageId: beforeMessageId || null,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get one direct message.
 *
 * GET /api/direct-conversations/:conversationId/messages/:messageId
 */
export async function getDirectMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId, messageId } = req.params;

    const message = await getDirectMessageById({
      conversationId,
      messageId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Edit a direct message.
 *
 * PATCH /api/direct-conversations/:conversationId/messages/:messageId
 */
export async function editDirectMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId, messageId } = req.params;
    const { messageText } = req.body;

    const message = await editDirectMessage({
      conversationId,
      messageId,
      userId,
      messageText,
    });

    return res.status(200).json({
      success: true,
      message: "Direct message updated.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft-delete a direct message.
 *
 * DELETE /api/direct-conversations/:conversationId/messages/:messageId
 */
export async function deleteDirectMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId, messageId } = req.params;

    const message = await deleteDirectMessage({
      conversationId,
      messageId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Direct message deleted.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark direct messages as read.
 *
 * PATCH /api/direct-conversations/:conversationId/messages/read
 */
export async function markDirectMessagesReadController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const membership = await markDirectMessagesAsRead({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Messages marked as read.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread direct-message count.
 *
 * GET /api/direct-conversations/:conversationId/messages/unread-count
 */
export async function getUnreadDirectMessageCountController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const unreadCount = await getUnreadDirectMessageCount({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: {
        conversationId,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}