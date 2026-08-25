import {
  sendPublicChatMessage,
  getPublicChatMessageHistory,
  editChatMessage,
  deleteChatMessage,
  getUnreadMessageCount,
  markChatMessagesAsRead,
  getChatMessageById
} from "../../services/community/chatMessage.service.js";

export async function getPublicChatHistoryController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const {
      limit,
      before_created_at,
      before_message_id
    } = req.validatedQuery;

    const result = await getPublicChatMessageHistory({
      userId,
      limit,
      beforeCreatedAt: before_created_at,
      beforeMessageId: before_message_id
    });

    return res.status(200).json({
      success: true,
      message: "Chat history fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function sendPublicChatMessageController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const {
      message_text,
      reply_to_message_id
    } = req.body;

    const message = await sendPublicChatMessage({
      userId,
      messageText: message_text,
      replyToMessageId: reply_to_message_id
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getChatMessageController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const { messageId } = req.params;

    const message = await getChatMessageById({
      messageId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: "Message fetched successfully.",
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function editChatMessageController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const { messageId } = req.params;

    const {
      message_text
    } = req.body;

    const message = await editChatMessage({
      messageId,
      userId,
      messageText: message_text
    });

    return res.status(200).json({
      success: true,
      message: "Message updated successfully.",
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteChatMessageController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const { messageId } = req.params;

    const message = await deleteChatMessage({
      messageId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadMessageCountController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const { roomId } = req.params;

    const result = await getUnreadMessageCount({
      roomId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: "Unread message count fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function markMessagesAsReadController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const { roomId } = req.params;

    const result = await markChatMessagesAsRead({
      roomId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: "Messages marked as read.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}