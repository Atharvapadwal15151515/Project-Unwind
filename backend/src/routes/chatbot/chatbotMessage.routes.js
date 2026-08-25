import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  sendChatbotMessageController,
  getConversationMessagesController,
  getChatbotMessageController,
  deleteChatbotMessageController
} from "../../controllers/chatbot/chatbotMessage.controller.js";

import {
  sendChatMessageSchema,
  conversationIdParamSchema,
  messageIdParamSchema
} from "../../validators/chatbot/chatbotMessage.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Chatbot Messages
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  validate(sendChatMessageSchema),
  sendChatbotMessageController
);

router.get(
  "/conversation/:conversationId",
  authenticate,
  validate(conversationIdParamSchema),
  getConversationMessagesController
);

router.get(
  "/:messageId",
  authenticate,
  validate(messageIdParamSchema),
  getChatbotMessageController
);

router.delete(
  "/:messageId",
  authenticate,
  validate(messageIdParamSchema),
  deleteChatbotMessageController
);

export default router;