import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import chatbotSettingsRoutes from "./chatbotSettings.routes.js";
import chatbotConversationRoutes from "./chatbotConversation.routes.js";
import chatbotMessageRoutes from "./chatbotMessage.routes.js";

import {
  sendChatMessageSchema
} from "../../validators/chatbot/chatbot.validator.js";

import {
  streamChatMessage
} from "../../controllers/chatbot/chatbot.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Chatbot Settings
|--------------------------------------------------------------------------
*/

router.use(
  "/settings",
  chatbotSettingsRoutes
);

/*
|--------------------------------------------------------------------------
| Chatbot Conversations
|--------------------------------------------------------------------------
*/

router.use(
  "/conversations",
  chatbotConversationRoutes
);

/*
|--------------------------------------------------------------------------
| Chatbot Messages
|--------------------------------------------------------------------------
*/

router.use(
  "/messages",
  chatbotMessageRoutes
);

/*
|--------------------------------------------------------------------------
| Streaming Chat Message
|--------------------------------------------------------------------------
*/

router.post(
  "/message/stream",
  authenticate,
  validate(sendChatMessageSchema),
  streamChatMessage
);

export default router;