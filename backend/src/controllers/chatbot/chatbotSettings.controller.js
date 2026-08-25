import asyncHandler from "../../utils/asyncHandler.js";

import {
  getChatbotSettings,
  updateChatbotSettings
} from "../../services/chatbot/chatbotSettings.service.js";

/*
|--------------------------------------------------------------------------
| Get Chatbot Settings
|--------------------------------------------------------------------------
*/

export const getChatbotSettingsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const settings =
        await getChatbotSettings(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Chatbot settings retrieved successfully",
        data: {
          settings
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Update Chatbot Settings
|--------------------------------------------------------------------------
*/

export const updateChatbotSettingsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const settings =
        await updateChatbotSettings(
          userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Chatbot settings updated successfully",
        data: {
          settings
        }
      });
    }
  );