import asyncHandler from "../../utils/asyncHandler.js";

import {
  sendChatbotMessage,
  getConversationMessages,
  getChatbotMessageById,
  deleteChatbotMessage
} from "../../services/chatbot/chatbotMessage.service.js";

/*
|--------------------------------------------------------------------------
| Send Chat Message
|--------------------------------------------------------------------------
*/

export const sendChatbotMessageController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        conversationId,
        message
      } = req.body;

      const result =
        await sendChatbotMessage(
          userId,
          conversationId,
          message
        );

      return res.status(201).json({
        success: true,
        message:
          "Chatbot message sent successfully",
        data: result
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Conversation Messages
|--------------------------------------------------------------------------
*/

export const getConversationMessagesController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        conversationId
      } = req.params;

      const messages =
        await getConversationMessages(
          userId,
          conversationId
        );

      if (!messages) {
        return res.status(404).json({
          success: false,
          message:
            "Chatbot conversation not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Chatbot messages retrieved successfully",
        data: {
          messages
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Message By ID
|--------------------------------------------------------------------------
*/

export const getChatbotMessageController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        messageId
      } = req.params;

      const message =
        await getChatbotMessageById(
          userId,
          messageId
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Chatbot message not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Chatbot message retrieved successfully",
        data: {
          message
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Delete Message
|--------------------------------------------------------------------------
*/

export const deleteChatbotMessageController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        messageId
      } = req.params;

      const message =
        await deleteChatbotMessage(
          userId,
          messageId
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Chatbot message not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Chatbot message deleted successfully",
        data: {
          message
        }
      });
    }
  );