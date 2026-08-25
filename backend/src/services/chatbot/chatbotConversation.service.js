import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
*/

export async function createChatbotConversation(
  userId,
  conversationData = {}
) {
  const title =
    conversationData.title?.trim() ||
    "New Chat";

  const result = await pool.query(
    `
    INSERT INTO chatbot_conversations (
      user_id,
      title
    )
    VALUES ($1, $2)
    RETURNING
      conversation_id,
      user_id,
      title,
      is_title_generated,
      conversation_status,
      is_pinned,
      total_messages,
      first_message_at,
      last_message_at,
      created_at,
      updated_at
    `,
    [
      userId,
      title
    ]
  );

  return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| List Conversations
|--------------------------------------------------------------------------
*/

export async function listChatbotConversations(
  userId,
  queryData = {}
) {
  const status =
    queryData.status || "active";

  const search =
    queryData.search?.trim() || null;

  const isPinned =
    typeof queryData.isPinned === "boolean"
      ? queryData.isPinned
      : null;

  const limit =
    Number(queryData.limit || 20);

  const offset =
    Number(queryData.offset || 0);

  const conversationsResult =
    await pool.query(
      `
      SELECT
        conversation_id,
        user_id,
        title,
        is_title_generated,
        conversation_status,
        is_pinned,
        total_messages,
        first_message_at,
        last_message_at,
        created_at,
        updated_at
      FROM chatbot_conversations
      WHERE user_id = $1
        AND conversation_status = $2
        AND (
          $3::TEXT IS NULL
          OR title ILIKE '%' || $3 || '%'
        )
        AND (
          $4::BOOLEAN IS NULL
          OR is_pinned = $4
        )
      ORDER BY
        is_pinned DESC,
        COALESCE(
          last_message_at,
          created_at
        ) DESC
      LIMIT $5
      OFFSET $6
      `,
      [
        userId,
        status,
        search,
        isPinned,
        limit,
        offset
      ]
    );

  const countResult =
    await pool.query(
      `
      SELECT
        COUNT(*)::INTEGER AS total
      FROM chatbot_conversations
      WHERE user_id = $1
        AND conversation_status = $2
        AND (
          $3::TEXT IS NULL
          OR title ILIKE '%' || $3 || '%'
        )
        AND (
          $4::BOOLEAN IS NULL
          OR is_pinned = $4
        )
      `,
      [
        userId,
        status,
        search,
        isPinned
      ]
    );

  return {
    conversations:
      conversationsResult.rows,

    pagination: {
      total:
        countResult.rows[0].total,
      limit,
      offset
    },

    filters: {
      status,
      search,
      isPinned
    }
  };
}

/*
|--------------------------------------------------------------------------
| Get Conversation
|--------------------------------------------------------------------------
*/

export async function getChatbotConversationById(
  userId,
  conversationId
) {
  const result = await pool.query(
    `
    SELECT
      conversation_id,
      user_id,
      title,
      is_title_generated,
      conversation_status,
      is_pinned,
      total_messages,
      first_message_at,
      last_message_at,
      created_at,
      updated_at
    FROM chatbot_conversations
    WHERE conversation_id = $1
      AND user_id = $2
    LIMIT 1
    `,
    [
      conversationId,
      userId
    ]
  );

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update Conversation
|--------------------------------------------------------------------------
*/

export async function updateChatbotConversation(
  userId,
  conversationId,
  conversationData
) {
  const existingConversation =
    await getChatbotConversationById(
      userId,
      conversationId
    );

  if (!existingConversation) {
    return null;
  }

  const title =
    conversationData.title ??
    existingConversation.title;

  const conversationStatus =
    conversationData.conversationStatus ??
    existingConversation.conversation_status;

  const isPinned =
    conversationData.isPinned ??
    existingConversation.is_pinned;

  const isTitleGenerated =
    conversationData.title !== undefined
      ? false
      : existingConversation.is_title_generated;

  const result = await pool.query(
    `
    UPDATE chatbot_conversations
    SET
      title = $1,
      conversation_status = $2,
      is_pinned = $3,
      is_title_generated = $4,
      updated_at = NOW()
    WHERE conversation_id = $5
      AND user_id = $6
    RETURNING
      conversation_id,
      user_id,
      title,
      is_title_generated,
      conversation_status,
      is_pinned,
      total_messages,
      first_message_at,
      last_message_at,
      created_at,
      updated_at
    `,
    [
      title,
      conversationStatus,
      isPinned,
      isTitleGenerated,
      conversationId,
      userId
    ]
  );

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Delete Conversation
|--------------------------------------------------------------------------
*/

export async function deleteChatbotConversation(
  userId,
  conversationId
) {
  const result = await pool.query(
    `
    UPDATE chatbot_conversations
    SET
      conversation_status = 'deleted',
      is_pinned = FALSE,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
      AND conversation_status <> 'deleted'
    RETURNING
      conversation_id,
      user_id,
      title,
      conversation_status,
      is_pinned,
      updated_at
    `,
    [
      conversationId,
      userId
    ]
  );

  return result.rows[0] || null;
}