import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Get Chatbot Settings
|--------------------------------------------------------------------------
*/

export async function getChatbotSettings(
  userId
) {
  const existingSettings =
    await pool.query(
      `
      SELECT
        chatbot_setting_id,
        user_id,
        preferred_provider,
        preferred_language,
        preferred_response_style,
        allow_conversation_history,
        allow_personalized_context,
        allow_predefined_responses,
        allow_ai_responses,
        enable_streaming,
        daily_ai_message_limit,
        created_at,
        updated_at
      FROM chatbot_settings
      WHERE user_id = $1
      `,
      [userId]
    );

  if (existingSettings.rows.length > 0) {
    return existingSettings.rows[0];
  }

  const createdSettings =
    await pool.query(
      `
      INSERT INTO chatbot_settings (
        user_id
      )
      VALUES ($1)
      RETURNING
        chatbot_setting_id,
        user_id,
        preferred_provider,
        preferred_language,
        preferred_response_style,
        allow_conversation_history,
        allow_personalized_context,
        allow_predefined_responses,
        allow_ai_responses,
        enable_streaming,
        daily_ai_message_limit,
        created_at,
        updated_at
      `,
      [userId]
    );

  return createdSettings.rows[0];
}

/*
|--------------------------------------------------------------------------
| Update Chatbot Settings
|--------------------------------------------------------------------------
*/

export async function updateChatbotSettings(
  userId,
  settingsData
) {
  const currentSettings =
    await getChatbotSettings(userId);

  const preferredProvider =
    settingsData.preferredProvider ??
    currentSettings.preferred_provider;

  const preferredLanguage =
    settingsData.preferredLanguage ??
    currentSettings.preferred_language;

  const preferredResponseStyle =
    settingsData.preferredResponseStyle ??
    currentSettings.preferred_response_style;

  const allowConversationHistory =
    settingsData.allowConversationHistory ??
    currentSettings.allow_conversation_history;

  const allowPersonalizedContext =
    settingsData.allowPersonalizedContext ??
    currentSettings.allow_personalized_context;

  const allowPredefinedResponses =
    settingsData.allowPredefinedResponses ??
    currentSettings.allow_predefined_responses;

  const allowAIResponses =
    settingsData.allowAIResponses ??
    currentSettings.allow_ai_responses;

  const enableStreaming =
    settingsData.enableStreaming ??
    currentSettings.enable_streaming;

  const dailyAIMessageLimit =
    settingsData.dailyAIMessageLimit ??
    currentSettings.daily_ai_message_limit;

  const updatedSettings =
    await pool.query(
      `
      UPDATE chatbot_settings
      SET
        preferred_provider = $1,
        preferred_language = $2,
        preferred_response_style = $3,
        allow_conversation_history = $4,
        allow_personalized_context = $5,
        allow_predefined_responses = $6,
        allow_ai_responses = $7,
        enable_streaming = $8,
        daily_ai_message_limit = $9,
        updated_at = NOW()
      WHERE user_id = $10
      RETURNING
        chatbot_setting_id,
        user_id,
        preferred_provider,
        preferred_language,
        preferred_response_style,
        allow_conversation_history,
        allow_personalized_context,
        allow_predefined_responses,
        allow_ai_responses,
        enable_streaming,
        daily_ai_message_limit,
        created_at,
        updated_at
      `,
      [
        preferredProvider,
        preferredLanguage,
        preferredResponseStyle,
        allowConversationHistory,
        allowPersonalizedContext,
        allowPredefinedResponses,
        allowAIResponses,
        enableStreaming,
        dailyAIMessageLimit,
        userId
      ]
    );

  return updatedSettings.rows[0];
}