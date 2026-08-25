import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createChatbotConversationController,
  listChatbotConversationsController,
  getChatbotConversationController,
  updateChatbotConversationController,
  deleteChatbotConversationController
} from "../../controllers/chatbot/chatbotConversation.controller.js";

import {
  createConversationSchema,
  updateConversationSchema,
  conversationIdParamSchema,
  listConversationsQuerySchema
} from "../../validators/chatbot/chatbotConversation.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Chatbot Conversations
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  validate(createConversationSchema),
  createChatbotConversationController
);

router.get(
  "/",
  authenticate,
  validate(listConversationsQuerySchema),
  listChatbotConversationsController
);

router.get(
  "/:conversationId",
  authenticate,
  validate(conversationIdParamSchema),
  getChatbotConversationController
);

router.patch(
  "/:conversationId",
  authenticate,
  validate(updateConversationSchema),
  updateChatbotConversationController
);

router.delete(
  "/:conversationId",
  authenticate,
  validate(conversationIdParamSchema),
  deleteChatbotConversationController
);

export default router;