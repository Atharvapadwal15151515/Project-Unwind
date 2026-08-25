import asyncHandler from "../../utils/asyncHandler.js";

import {
  generateChatbotReply
} from "../../services/chatbot/chatbot.service.js";

import {
  prepareStreamingChatMessage,
  saveStreamingAssistantMessage
} from "../../services/chatbot/chatbotStreamingMessage.service.js";

/*
|--------------------------------------------------------------------------
| Send Chat Message
|--------------------------------------------------------------------------
*/

export const sendChatMessage =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        message
      } = req.body;

      const chatbotResponse =
        await generateChatbotReply(
          userId,
          message
        );

      return res.status(200).json({
        success: true,
        message:
          "Chatbot response generated successfully",
        data: chatbotResponse
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Stream Chat Message
|--------------------------------------------------------------------------
*/

export async function streamChatMessage(
  req,
  res,
  next
) {
  const userId =
    req.user.user_id;

  const {
    conversationId,
    message
  } = req.body;

  const startedAt =
    Date.now();
    const abortController =
  new AbortController();

req.on("close", () => {
  abortController.abort();
});

  let fullResponse = "";
  let streamStarted = false;

  try {
    const streamingResult =
      await prepareStreamingChatMessage(
        userId,
        conversationId,
        message
      );

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    res.setHeader(
      "X-Chatbot-Source",
      streamingResult.type
    );

    /*
    |--------------------------------------------------------------------------
    | Safety Response
    |--------------------------------------------------------------------------
    */

    if (
      streamingResult.type ===
      "safety"
    ) {
      fullResponse =
        streamingResult.reply;

      res.setHeader(
        "X-Chatbot-Intent",
        "crisis"
      );

      res.flushHeaders();

      res.write(fullResponse);

      await saveStreamingAssistantMessage(
        userId,
        conversationId,
        {
          content:
            fullResponse,

          source:
            "safety",

          provider:
            null,

          model:
            null,

          responseTimeMs:
            Date.now() -
            startedAt,

          metadata: {
            intent:
              "crisis",

            safetyLevel:
              streamingResult
                .safetyEvent
                ?.risk_level ||
              "high",

            safetyEventId:
              streamingResult
                .safetyEvent
                ?.safety_event_id ||
              null
          }
        }
      );

      res.end();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Predefined Response
    |--------------------------------------------------------------------------
    */

    if (
      streamingResult.type ===
      "predefined"
    ) {
      fullResponse =
        streamingResult.reply;

      res.setHeader(
        "X-Chatbot-Intent",
        streamingResult.intent
      );

      res.flushHeaders();

      res.write(fullResponse);

      await saveStreamingAssistantMessage(
        userId,
        conversationId,
        {
          content:
            fullResponse,

          source:
            "predefined",

          provider:
            null,

          model:
            null,

          responseTimeMs:
            Date.now() -
            startedAt,

          metadata: {
            intent:
              streamingResult.intent,

            matchedPattern:
              streamingResult
                .matchedPattern ||
              null
          }
        }
      );

      res.end();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | AI Stream
    |--------------------------------------------------------------------------
    */

    res.setHeader(
      "X-AI-Provider",
      streamingResult.provider
    );

    res.flushHeaders();

    for await (
      const textChunk
      of streamingResult.stream
    ) {
      if (!textChunk) {
        continue;
      }

      streamStarted = true;
      fullResponse += textChunk;

      res.write(textChunk);
    }

    await saveStreamingAssistantMessage(
      userId,
      conversationId,
      {
        content:
          fullResponse,

        source:
          "ai",

        provider:
          streamingResult.provider,

        model:
          null,

        responseTimeMs:
          Date.now() -
          startedAt,

        metadata: {
          streamed: true
        }
      }
    );

    res.end();
  } catch (error) {
    console.error(
      "Chatbot streaming error:",
      error.message
    );

    if (
      streamStarted ||
      res.headersSent
    ) {
      res.write(
        "\n\n⚠️ The response was interrupted. Please try again."
      );

      res.end();

      return;
    }

    next(error);
  }
}