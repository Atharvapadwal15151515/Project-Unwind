import pool from "../../config/database.js";

import {
  createProviderStream
} from "./chatbotStream.service.js";

import {
  findMatchingIntent
} from "./chatbotIntent.service.js";

import {
  evaluateChatbotSafety
} from "./chatbotSafety.service.js";

import {
  CHATBOT_CRISIS_RESPONSE_TEMPLATE
} from "../../prompts/chatbot/crisis.prompt.js";

import {
  logChatbotSafetyEvent
} from "./chatbotSafetyLogger.service.js";

import {
  getConversationContext
} from "./chatbotMessage.service.js";
import {
  getIndiaCrisisResources
} from "../../config/crisisResources.js";
/*
|--------------------------------------------------------------------------
| Prepare Streaming Chat Message
|--------------------------------------------------------------------------
*/

export async function prepareStreamingChatMessage(
  userId,
  conversationId,
  message
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const conversationResult =
      await client.query(
        `
        SELECT conversation_id
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

    const userMessage =
      userMessageResult.rows[0];

    const safetyResult =
      evaluateChatbotSafety(message);

    if (!safetyResult.safe) {
      const safetyEvent =
        await logChatbotSafetyEvent(
          client,
          {
            userId,
            conversationId,
            messageId:
              userMessage.message_id,
            safetyLevel:
              safetyResult.level,
            matchedKeyword:
              safetyResult.matchedKeyword,
            message,
            providerUsed: null,
            detectionSource:
              "keyword"
          }
        );

      await client.query("COMMIT");

      const resourcesText =
  getIndiaCrisisResources({
    includeMaharashtra: true
  });


return {
  type: "safety",

  userMessage,

  reply: `
${CHATBOT_CRISIS_RESPONSE_TEMPLATE}

${resourcesText}
  `.trim(),

  safetyEvent,

  intent:
    "crisis"
};
    }

    const matchedIntent =
      findMatchingIntent(message);

    if (matchedIntent) {
      await client.query("COMMIT");

      return {
        type: "predefined",
        userMessage,
        reply:
          matchedIntent.reply,
        intent:
          matchedIntent.intent,
        matchedPattern:
          matchedIntent.matchedPattern
      };
    }

    await client.query("COMMIT");

/*
|--------------------------------------------------------------------------
| Build Conversation History
|--------------------------------------------------------------------------
*/

const conversationHistory =
  await getConversationContext(
    userId,
    conversationId
  );

/*
 * The current user message has already been
 * stored in chatbot_messages before this point,
 * so getConversationContext() should already
 * include it.
 *
 * Still, keep this fallback in case the current
 * message is not present for any reason.
 */
const lastMessage =
  conversationHistory[
    conversationHistory.length - 1
  ];

const currentMessageAlreadyIncluded =
  lastMessage?.role === "user" &&
  lastMessage?.content === message;

if (
  !currentMessageAlreadyIncluded
) {
  conversationHistory.push({
    role: "user",
    content: message
  });
}

/*
|--------------------------------------------------------------------------
| Create AI Stream
|--------------------------------------------------------------------------
*/

const {
  stream,
  provider
} = await createProviderStream(
  conversationHistory
);

return {
  type: "ai",
  userMessage,
  stream,
  provider
};

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Save Streaming Assistant Message
|--------------------------------------------------------------------------
*/

export async function saveStreamingAssistantMessage(
  userId,
  conversationId,
  {
    content,
    source,
    provider = null,
    model = null,
    responseTimeMs = null,
    metadata = {}
  }
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const assistantResult =
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
          $8
        )
        RETURNING *
        `,
        [
          conversationId,
          userId,
          content,
          source,
          provider,
          model,
          responseTimeMs,
          JSON.stringify(metadata)
        ]
      );

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

    await client.query(
      `
      INSERT INTO chatbot_usage_daily (
        user_id,
        usage_date,
        total_messages,
        ai_messages,
        predefined_messages
      )
      VALUES (
        $1,
        CURRENT_DATE,
        1,
        $2,
        $3
      )
      ON CONFLICT (
        user_id,
        usage_date
      )
      DO UPDATE SET
        total_messages =
          chatbot_usage_daily.total_messages + 1,

        ai_messages =
          chatbot_usage_daily.ai_messages +
          EXCLUDED.ai_messages,

        predefined_messages =
          chatbot_usage_daily.predefined_messages +
          EXCLUDED.predefined_messages,

        updated_at =
          NOW()
      `,
      [
        userId,
        source === "ai" ? 1 : 0,
        source === "predefined" ? 1 : 0
      ]
    );

    await client.query("COMMIT");

    return assistantResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}