import asyncHandler from "../../utils/asyncHandler.js";

import {
  createChatbotConversation,
  listChatbotConversations,
  getChatbotConversationById,
  updateChatbotConversation,
  deleteChatbotConversation
} from "../../services/chatbot/chatbotConversation.service.js";

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
*/

export const createChatbotConversationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const conversation =
        await createChatbotConversation(
          userId,
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Chatbot conversation created successfully",
        data: {
          conversation
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| List Conversations
|--------------------------------------------------------------------------
*/

export const listChatbotConversationsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const result =
        await listChatbotConversations(
          userId,
          req.query
        );

      return res.status(200).json({
        success: true,
        message:
          "Chatbot conversations retrieved successfully",
        data: result
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Conversation
|--------------------------------------------------------------------------
*/

export const getChatbotConversationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        conversationId
      } = req.params;

      const conversation =
        await getChatbotConversationById(
          userId,
          conversationId
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Chatbot conversation not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Chatbot conversation retrieved successfully",
        data: {
          conversation
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Update Conversation
|--------------------------------------------------------------------------
*/

export const updateChatbotConversationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        conversationId
      } = req.params;

      const conversation =
        await updateChatbotConversation(
          userId,
          conversationId,
          req.body
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Chatbot conversation not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Chatbot conversation updated successfully",
        data: {
          conversation
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Delete Conversation
|--------------------------------------------------------------------------
*/

export const deleteChatbotConversationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        conversationId
      } = req.params;

      const conversation =
        await deleteChatbotConversation(
          userId,
          conversationId
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Chatbot conversation not found"
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Chatbot conversation deleted successfully",
        data: {
          conversation
        }
      });
    }
  );