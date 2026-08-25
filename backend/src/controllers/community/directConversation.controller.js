import {
  startDirectConversation,
  getDirectConversationDetails,
  listMyDirectConversations,
  markDirectConversationAsRead,
  refreshDirectConversationIdentity,
  setDirectConversationMute,
  leaveDirectConversation,
  rejoinDirectConversation,
} from "../../services/community/directConversation.service.js";

/**
 * Start a new direct conversation.
 *
 * POST /api/direct-conversations
 */
export async function createDirectConversationController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { recipientUserId } = req.body;

    const result = await startDirectConversation({
      userId,
      recipientUserId,
    });

    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Direct conversation created."
        : "Existing direct conversation returned.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return one direct conversation.
 *
 * GET /api/direct-conversations/:conversationId
 */
export async function getDirectConversationController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const result = await getDirectConversationDetails({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return the authenticated user's conversations.
 *
 * GET /api/direct-conversations
 */
export async function listDirectConversationsController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { limit, offset } = req.query;

    const conversations = await listMyDirectConversations({
      userId,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a conversation as read.
 *
 * PATCH /api/direct-conversations/:conversationId/read
 */
export async function markDirectConversationReadController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const result = await markDirectConversationAsRead({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh the identity shown in a conversation.
 *
 * PATCH /api/direct-conversations/:conversationId/identity
 */
export async function refreshDirectConversationIdentityController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const result = await refreshDirectConversationIdentity({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Conversation identity updated.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mute or unmute a conversation.
 *
 * PATCH /api/direct-conversations/:conversationId/mute
 */
export async function setDirectConversationMuteController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;
    const { isMuted } = req.body;

    const result = await setDirectConversationMute({
      conversationId,
      userId,
      isMuted,
    });

    return res.status(200).json({
      success: true,
      message: isMuted
        ? "Conversation muted."
        : "Conversation unmuted.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Leave a conversation.
 *
 * PATCH /api/direct-conversations/:conversationId/leave
 */
export async function leaveDirectConversationController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const result = await leaveDirectConversation({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "You left the conversation.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rejoin a previous conversation.
 *
 * PATCH /api/direct-conversations/:conversationId/rejoin
 */
export async function rejoinDirectConversationController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const result = await rejoinDirectConversation({
      conversationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "You rejoined the conversation.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}