import pool from "../../config/database.js";

import {
  generateChatbotReply
} from "./chatbot.service.js";

import {
  logChatbotSafetyEvent
} from "./chatbotSafetyLogger.service.js";

import {
  generateChatbotConversationTitle
} from "../../utils/chatbot/chatbotTitle.util.js";

/*
|--------------------------------------------------------------------------
| Send Chat Message
|--------------------------------------------------------------------------
*/

export async function sendChatbotMessage(
  userId,
  conversationId,
  message
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | Verify Conversation
    |--------------------------------------------------------------------------
    */

    const conversationResult =
      await client.query(
        `
        SELECT
          conversation_id
        FROM chatbot_conversations
        WHERE conversation_id = $1
          AND user_id = $2
          AND conversation_status <> 'deleted'
        LIMIT 1
        `,
        [
          conversationId,
          userId
        ]
      );

    if (
      conversationResult.rows.length === 0
    ) {
      throw new Error(
        "Conversation not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Save User Message
    |--------------------------------------------------------------------------
    */

    const userMessageResult =
      await client.query(
        `
        INSERT INTO chatbot_messages (
          conversation_id,
          user_id,
          message_role,
          message_content,
          message_status
        )
        VALUES (
          $1,
          $2,
          'user',
          $3,
          'completed'
        )
        RETURNING *
        `,
        [
          conversationId,
          userId,
          message
        ]
      );

    const savedUserMessage =
      userMessageResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Generate Assistant Reply
    |--------------------------------------------------------------------------
    */

    const startedAt =
      Date.now();

    const chatbotReply =
      await generateChatbotReply(
        userId,
        message
      );

    const responseTimeMs =
      Date.now() - startedAt;

    const promptTokens =
      Number(
        chatbotReply.promptTokens || 0
      );

    const completionTokens =
      Number(
        chatbotReply.completionTokens || 0
      );

    const totalTokens =
      promptTokens +
      completionTokens;

    /*
    |--------------------------------------------------------------------------
    | Log Safety Event
    |--------------------------------------------------------------------------
    */

    let safetyEvent = null;

    if (
      chatbotReply.source === "safety"
    ) {
      safetyEvent =
        await logChatbotSafetyEvent(
          client,
          {
            userId,
            conversationId,

            messageId:
              savedUserMessage.message_id,

            safetyLevel:
              chatbotReply.safetyLevel,

            matchedKeyword:
              chatbotReply.matchedPattern,

            message,

            providerUsed: null,

            detectionSource:
              "keyword"
          }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Save Assistant Message
    |--------------------------------------------------------------------------
    */

    const assistantMessageResult =
      await client.query(
        `
        INSERT INTO chatbot_messages (
          conversation_id,
          user_id,
          message_role,
          message_content,
          message_status,
          response_source,
          provider_name,
          model_name,
          prompt_tokens,
          completion_tokens,
          total_tokens,
          response_time_ms,
          metadata
        )
        VALUES (
          $1,
          $2,
          'assistant',
          $3,
          'completed',
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        RETURNING *
        `,
        [
          conversationId,
          userId,
          chatbotReply.reply,
          chatbotReply.source,
          chatbotReply.provider,
          chatbotReply.model,
          promptTokens,
          completionTokens,
          totalTokens,
          responseTimeMs,

          JSON.stringify({
            intent:
              chatbotReply.intent,

            matchedPattern:
              chatbotReply.matchedPattern,

            matchScore:
              chatbotReply.matchScore,

            safetyLevel:
              chatbotReply.safetyLevel,

            safetyEventId:
              safetyEvent?.safety_event_id ||
              null
          })
        ]
      );

    const savedAssistantMessage =
      assistantMessageResult.rows[0];

      /*
|--------------------------------------------------------------------------
| Generate Conversation Title
|--------------------------------------------------------------------------
*/

const conversationDetails =
  await client.query(
    `
    SELECT
      total_messages,
      is_title_generated
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

const conversation =
  conversationDetails.rows[0];

if (
  conversation &&
  !conversation.is_title_generated &&
  conversation.total_messages === 0
) {
  const generatedTitle =
    generateChatbotConversationTitle(
      message
    );

  await client.query(
    `
    UPDATE chatbot_conversations
    SET
      title = $1,
      is_title_generated = TRUE
    WHERE conversation_id = $2
      AND user_id = $3
    `,
    [
      generatedTitle,
      conversationId,
      userId
    ]
  );
}
    /*
    |--------------------------------------------------------------------------
    | Update Conversation
    |--------------------------------------------------------------------------
    */

    await client.query(
      `
      UPDATE chatbot_conversations
      SET
        total_messages =
          total_messages + 2,

        first_message_at =
          COALESCE(
            first_message_at,
            NOW()
          ),

        last_message_at =
          NOW(),

        updated_at =
          NOW()
      WHERE conversation_id = $1
        AND user_id = $2
      `,
      [
        conversationId,
        userId
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Update Daily Usage
    |--------------------------------------------------------------------------
    */

    const isAIResponse =
      chatbotReply.source === "ai";

    const isPredefinedResponse =
      chatbotReply.source ===
      "predefined";

    const usageResult =
      await client.query(
        `
        INSERT INTO chatbot_usage_daily (
          user_id,
          usage_date,
          total_messages,
          ai_messages,
          predefined_messages,
          prompt_tokens,
          completion_tokens,
          total_tokens
        )
        VALUES (
          $1,
          CURRENT_DATE,
          1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        ON CONFLICT (
          user_id,
          usage_date
        )
        DO UPDATE SET
          total_messages =
            chatbot_usage_daily.total_messages
            + EXCLUDED.total_messages,

          ai_messages =
            chatbot_usage_daily.ai_messages
            + EXCLUDED.ai_messages,

          predefined_messages =
            chatbot_usage_daily.predefined_messages
            + EXCLUDED.predefined_messages,

          prompt_tokens =
            chatbot_usage_daily.prompt_tokens
            + EXCLUDED.prompt_tokens,

          completion_tokens =
            chatbot_usage_daily.completion_tokens
            + EXCLUDED.completion_tokens,

          total_tokens =
            chatbot_usage_daily.total_tokens
            + EXCLUDED.total_tokens,

          updated_at =
            NOW()

        RETURNING *
        `,
        [
          userId,
          isAIResponse ? 1 : 0,
          isPredefinedResponse ? 1 : 0,
          promptTokens,
          completionTokens,
          totalTokens
        ]
      );

    await client.query("COMMIT");

    return {
      userMessage:
        savedUserMessage,

      assistantMessage:
        savedAssistantMessage,

      usage:
        usageResult.rows[0],

      safetyEvent,

      reply:
        chatbotReply
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Get Conversation Messages
|--------------------------------------------------------------------------
*/

export async function getConversationMessages(
  userId,
  conversationId
) {
  const conversationResult =
    await pool.query(
      `
      SELECT
        conversation_id
      FROM chatbot_conversations
      WHERE conversation_id = $1
        AND user_id = $2
        AND conversation_status <> 'deleted'
      LIMIT 1
      `,
      [
        conversationId,
        userId
      ]
    );

  if (
    conversationResult.rows.length === 0
  ) {
    return null;
  }

  const result =
    await pool.query(
      `
      SELECT
        message_id,
        conversation_id,
        user_id,
        message_role,
        message_content,
        message_status,
        response_source,
        provider_name,
        model_name,
        finish_reason,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        response_time_ms,
        is_edited,
        metadata,
        created_at,
        updated_at
      FROM chatbot_messages
      WHERE conversation_id = $1
        AND user_id = $2
        AND is_deleted = FALSE
      ORDER BY created_at ASC
      `,
      [
        conversationId,
        userId
      ]
    );

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Message By ID
|--------------------------------------------------------------------------
*/

export async function getChatbotMessageById(
  userId,
  messageId
) {
  const result =
    await pool.query(
      `
      SELECT
        message_id,
        conversation_id,
        user_id,
        message_role,
        message_content,
        message_status,
        response_source,
        provider_name,
        model_name,
        finish_reason,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        response_time_ms,
        is_edited,
        metadata,
        created_at,
        updated_at
      FROM chatbot_messages
      WHERE message_id = $1
        AND user_id = $2
        AND is_deleted = FALSE
      LIMIT 1
      `,
      [
        messageId,
        userId
      ]
    );

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Delete Message
|--------------------------------------------------------------------------
*/

export async function deleteChatbotMessage(
  userId,
  messageId
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const messageResult =
      await client.query(
        `
        UPDATE chatbot_messages
        SET
          is_deleted = TRUE,
          message_status = 'deleted',
          updated_at = NOW()
        WHERE message_id = $1
          AND user_id = $2
          AND is_deleted = FALSE
        RETURNING
          message_id,
          conversation_id,
          user_id,
          message_role,
          message_status,
          is_deleted,
          updated_at
        `,
        [
          messageId,
          userId
        ]
      );

    const deletedMessage =
      messageResult.rows[0];

    if (!deletedMessage) {
      await client.query(
        "ROLLBACK"
      );

      return null;
    }

    await client.query(
      `
      UPDATE chatbot_conversations
      SET
        total_messages =
          GREATEST(
            total_messages - 1,
            0
          ),

        updated_at =
          NOW()
      WHERE conversation_id = $1
        AND user_id = $2
      `,
      [
        deletedMessage.conversation_id,
        userId
      ]
    );

    await client.query("COMMIT");

    return deletedMessage;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}
/*
|--------------------------------------------------------------------------
| Get Conversation Context
|--------------------------------------------------------------------------
*/

export async function getConversationContext(
  userId,
  conversationId,
  limit = 20
) {
  const result =
    await pool.query(
      `
      SELECT
        message_role,
        message_content
      FROM chatbot_messages
      WHERE conversation_id = $1
        AND user_id = $2
        AND is_deleted = FALSE
        AND message_status = 'completed'
      ORDER BY created_at DESC
      LIMIT $3
      `,
      [
        conversationId,
        userId,
        limit
      ]
    );

  return result.rows
    .reverse()
    .map((message) => ({
      role: message.message_role,
      content:
        message.message_content
    }));
}