import api from "./api";

/*
|--------------------------------------------------------------------------
| API paths
|--------------------------------------------------------------------------
|
| These match the backend mounts exactly:
|
| /api/community/direct-conversations
| /api/community/direct-messages
|--------------------------------------------------------------------------
*/

const DIRECT_CONVERSATIONS_BASE =
  "/community/direct-conversations";

const DIRECT_MESSAGES_BASE =
  "/community/direct-messages";

/*
|--------------------------------------------------------------------------
| Response helpers
|--------------------------------------------------------------------------
*/

function getResponseData(
  response
) {
  return (
    response?.data?.data ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| Conversations
|--------------------------------------------------------------------------
*/

export async function getDirectConversations({
  limit = 50,
  offset = 0
} = {}) {
  const response =
    await api.get(
      DIRECT_CONVERSATIONS_BASE,
      {
        params: {
          limit,
          offset
        }
      }
    );

  const data =
    getResponseData(
      response
    );

  /*
   * Backend currently returns the array
   * directly in data.
   */
  return Array.isArray(data)
    ? data
    : data?.conversations ??
        [];
}

export async function getDirectConversation(
  conversationId
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  const response =
    await api.get(
      `${DIRECT_CONVERSATIONS_BASE}/${conversationId}`
    );

  return getResponseData(
    response
  );
}

export async function createDirectConversation(
  recipientUserId
) {
  const response =
    await api.post(
      "/community/direct-conversations",
      {
        recipientUserId:
          String(
            recipientUserId
          )
      }
    );

  return (
    response.data?.data ??
    null
  );
}

export async function markDirectConversationRead(
  conversationId
) {
  if (!conversationId) {
    return null;
  }

  const response =
    await api.patch(
      `${DIRECT_CONVERSATIONS_BASE}/${conversationId}/read`
    );

  return getResponseData(
    response
  );
}

export async function refreshDirectConversationIdentity(
  conversationId
) {
  const response =
    await api.patch(
      `${DIRECT_CONVERSATIONS_BASE}/${conversationId}/identity`
    );

  return getResponseData(
    response
  );
}

export async function setDirectConversationMuted(
  conversationId,
  isMuted
) {
  const response =
    await api.patch(
      `${DIRECT_CONVERSATIONS_BASE}/${conversationId}/mute`,
      {
        isMuted:
          Boolean(isMuted)
      }
    );

  return getResponseData(
    response
  );
}

export async function leaveDirectConversation(
  conversationId
) {
  const response =
    await api.patch(
      `${DIRECT_CONVERSATIONS_BASE}/${conversationId}/leave`
    );

  return getResponseData(
    response
  );
}

export async function rejoinDirectConversation(
  conversationId
) {
  const response =
    await api.patch(
      `${DIRECT_CONVERSATIONS_BASE}/${conversationId}/rejoin`
    );

  return getResponseData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Message history
|--------------------------------------------------------------------------
*/

export async function getDirectMessages({
  conversationId,
  beforeMessageId = null,
  limit = 30
}) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  const params = {
    limit
  };

  if (beforeMessageId) {
    params.beforeMessageId =
      beforeMessageId;
  }

  const response =
    await api.get(
      `${DIRECT_MESSAGES_BASE}/conversations/${conversationId}/messages`,
      {
        params
      }
    );

  const data =
    getResponseData(
      response
    );

  return Array.isArray(data)
    ? data
    : [];
}

/*
|--------------------------------------------------------------------------
| Send
|--------------------------------------------------------------------------
*/

export async function sendDirectMessage({
  conversationId,
  messageText,
  replyToMessageId = null
}) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  const normalizedText =
    String(
      messageText ?? ""
    ).trim();

  if (!normalizedText) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  const response =
    await api.post(
      `${DIRECT_MESSAGES_BASE}/conversations/${conversationId}/messages`,
      {
        messageText:
          normalizedText,

        /*
         * Keep this text-only.
         * We deliberately do not expose
         * attachments in the frontend.
         */
        messageType:
          "text",

        replyToMessageId:
          replyToMessageId ||
          null
      }
    );

  return getResponseData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Edit
|--------------------------------------------------------------------------
*/

export async function editDirectMessage({
  conversationId,
  messageId,
  messageText
}) {
  if (
    !conversationId ||
    !messageId
  ) {
    throw new Error(
      "Conversation ID and message ID are required."
    );
  }

  const normalizedText =
    String(
      messageText ?? ""
    ).trim();

  if (!normalizedText) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  const response =
    await api.patch(
      `${DIRECT_MESSAGES_BASE}/conversations/${conversationId}/messages/${messageId}`,
      {
        messageText:
          normalizedText
      }
    );

  return getResponseData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export async function deleteDirectMessage({
  conversationId,
  messageId
}) {
  if (
    !conversationId ||
    !messageId
  ) {
    throw new Error(
      "Conversation ID and message ID are required."
    );
  }

  const response =
    await api.delete(
      `${DIRECT_MESSAGES_BASE}/conversations/${conversationId}/messages/${messageId}`
    );

  return getResponseData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Read state
|--------------------------------------------------------------------------
*/

export async function markDirectMessagesRead(
  conversationId
) {
  if (!conversationId) {
    return null;
  }

  const response =
    await api.patch(
      `${DIRECT_MESSAGES_BASE}/conversations/${conversationId}/messages/read`
    );

  return getResponseData(
    response
  );
}

export async function getDirectUnreadCount(
  conversationId
) {
  if (!conversationId) {
    return 0;
  }

  const response =
    await api.get(
      `${DIRECT_MESSAGES_BASE}/conversations/${conversationId}/messages/unread-count`
    );

  const data =
    getResponseData(
      response
    );

  return Number(
    data?.unreadCount ??
      data?.unread_count ??
      0
  );
}