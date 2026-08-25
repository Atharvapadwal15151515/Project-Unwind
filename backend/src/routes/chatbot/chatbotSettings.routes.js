import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  getChatbotSettingsController,
  updateChatbotSettingsController
} from "../../controllers/chatbot/chatbotSettings.controller.js";

import {
  updateChatbotSettingsSchema
} from "../../validators/chatbot/chatbotSettings.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Chatbot Settings
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  getChatbotSettingsController
);

router.patch(
  "/",
  authenticate,
  validate(updateChatbotSettingsSchema),
  updateChatbotSettingsController
);

export default router;