/*
|--------------------------------------------------------------------------
| Log Chatbot Safety Event
|--------------------------------------------------------------------------
*/

export async function logChatbotSafetyEvent(
  client,
  {
    userId,
    conversationId,
    messageId,
    safetyLevel,
    matchedKeyword,
    message,
    providerUsed = null,
    detectionSource = "keyword"
  }
) {
  if (
    !client ||
    !userId ||
    !safetyLevel
  ) {
    throw new Error(
      "Safety event data is incomplete"
    );
  }

  const allowedLevels = [
    "low",
    "medium",
    "high",
    "critical"
  ];

  const riskLevel =
    allowedLevels.includes(safetyLevel)
      ? safetyLevel
      : "high";

  const messagePreview =
    typeof message === "string"
      ? message.trim().slice(0, 500)
      : null;

  const result =
    await client.query(
      `
      INSERT INTO chatbot_safety_events (
        user_id,
        conversation_id,
        message_id,
        risk_level,
        detection_source,
        matched_keyword,
        message_preview,
        provider_used,
        ai_blocked,
        response_generated,
        helpline_country,
        metadata
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        TRUE,
        TRUE,
        'IN',
        $9
      )
      RETURNING *
      `,
      [
        userId,
        conversationId || null,
        messageId || null,
        riskLevel,
        detectionSource,
        matchedKeyword || null,
        messagePreview,
        providerUsed,
        JSON.stringify({
          responseType:
            "crisis_response",
          aiProviderBlocked: true
        })
      ]
    );

  return result.rows[0];
}