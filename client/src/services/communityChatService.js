import api from "./api";

/*
|--------------------------------------------------------------------------
| Community Chat API
|--------------------------------------------------------------------------
*/

const COMMUNITY_CHAT_BASE =
  "/community/chat";

/*
|--------------------------------------------------------------------------
| Message history
|--------------------------------------------------------------------------
*/

export async function getPublicChatHistory({
  limit = 30,
  beforeCreatedAt = null,
  beforeMessageId = null
} = {}) {
  const params = {
    limit
  };

  if (beforeCreatedAt) {
    params.before_created_at =
      beforeCreatedAt;
  }

  if (beforeMessageId) {
    params.before_message_id =
      beforeMessageId;
  }

  const response =
    await api.get(
      `${COMMUNITY_CHAT_BASE}/public/history`,
      {
        params
      }
    );

  return (
    response.data?.data ?? {
      messages: [],
      pagination: {
        has_more: false,
        next_cursor: null
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| Community members
|--------------------------------------------------------------------------
*/

export async function getPublicChatMembers() {
  const response =
    await api.get(
      `${COMMUNITY_CHAT_BASE}/public/members`
    );

  return (
    response.data?.data ?? {
      members: [],
      member_count: 0
    }
  );
}

/*
|--------------------------------------------------------------------------
| Mark room as read
|--------------------------------------------------------------------------
*/

export async function markPublicChatRead(
  roomId
) {
  if (!roomId) {
    return null;
  }

  const response =
    await api.patch(
      `${COMMUNITY_CHAT_BASE}/rooms/${roomId}/read`
    );

  return (
    response.data?.data ??
    null
  );
}