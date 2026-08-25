import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Increment Daily Chatbot Usage
|--------------------------------------------------------------------------
*/

export async function incrementChatbotUsage(
  userId,
  {
    responseSource,
    promptTokens = 0,
    completionTokens = 0
  }
) {
  const totalTokens =
    promptTokens + completionTokens;

  const isAI =
    responseSource === "ai";

  const isPredefined =
    responseSource === "predefined";

  const result = await pool.query(
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
        chatbot_usage_daily.total_messages + 1,

      ai_messages =
        chatbot_usage_daily.ai_messages +
        EXCLUDED.ai_messages,

      predefined_messages =
        chatbot_usage_daily.predefined_messages +
        EXCLUDED.predefined_messages,

      prompt_tokens =
        chatbot_usage_daily.prompt_tokens +
        EXCLUDED.prompt_tokens,

      completion_tokens =
        chatbot_usage_daily.completion_tokens +
        EXCLUDED.completion_tokens,

      total_tokens =
        chatbot_usage_daily.total_tokens +
        EXCLUDED.total_tokens,

      updated_at = NOW()

    RETURNING *
    `,
    [
      userId,
      isAI ? 1 : 0,
      isPredefined ? 1 : 0,
      promptTokens,
      completionTokens,
      totalTokens
    ]
  );

  return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Get Today's Usage
|--------------------------------------------------------------------------
*/

export async function getTodayChatbotUsage(
  userId
) {
  const result = await pool.query(
    `
    SELECT *
    FROM chatbot_usage_daily
    WHERE user_id = $1
      AND usage_date = CURRENT_DATE
    LIMIT 1
    `,
    [userId]
  );

  return (
    result.rows[0] || {
      total_messages: 0,
      ai_messages: 0,
      predefined_messages: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
  );
}