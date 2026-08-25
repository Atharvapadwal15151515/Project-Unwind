import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  checkCommunityRestriction
} from "../middleware/community/checkCommunityRestriction.js";

import {
  getPublicChatHistoryController,
  sendPublicChatMessageController,
  getChatMessageController,
  editChatMessageController,
  deleteChatMessageController,
  getUnreadMessageCountController,
  markMessagesAsReadController
} from "../controllers/community/chatMessage.controller.js";

import {
  getPublicChatHistoryRequestSchema,
  sendPublicChatMessageRequestSchema,
  getChatMessageRequestSchema,
  editChatMessageRequestSchema,
  deleteChatMessageRequestSchema,
  getUnreadMessageCountRequestSchema,
  markMessagesAsReadRequestSchema
} from "../validators/chatMessage.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/public/history",
  validate(getPublicChatHistoryRequestSchema),
  getPublicChatHistoryController
);

router.post(
  "/public/messages",

  checkCommunityRestriction([
    "community_chat_block",
    "community_mute",
    "temporary_account_restriction"
  ]),

  validate(
    sendPublicChatMessageRequestSchema
  ),

  sendPublicChatMessageController
);

router.get(
  "/messages/:messageId",
  validate(getChatMessageRequestSchema),
  getChatMessageController
);

router.patch(
  "/messages/:messageId",

  checkCommunityRestriction([
    "community_chat_block",
    "community_mute",
    "temporary_account_restriction"
  ]),

  validate(
    editChatMessageRequestSchema
  ),

  editChatMessageController
);

router.delete(
  "/messages/:messageId",
  validate(deleteChatMessageRequestSchema),
  deleteChatMessageController
);

router.get(
  "/rooms/:roomId/unread-count",
  validate(getUnreadMessageCountRequestSchema),
  getUnreadMessageCountController
);

router.patch(
  "/rooms/:roomId/read",
  validate(markMessagesAsReadRequestSchema),
  markMessagesAsReadController
);

export default router;