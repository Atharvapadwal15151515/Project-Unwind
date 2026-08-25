import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";

import {
  sendDirectMessageController,
  getDirectMessageHistoryController,
  getDirectMessageController,
  editDirectMessageController,
  deleteDirectMessageController,
  markDirectMessagesReadController,
  getUnreadDirectMessageCountController
} from "../controllers/community/directMessage.controller.js";

import {
  sendDirectMessageRequestSchema,
  getDirectMessageHistoryRequestSchema,
  getDirectMessageRequestSchema,
  editDirectMessageRequestSchema,
  deleteDirectMessageRequestSchema,
  markDirectMessagesReadRequestSchema,
  getUnreadDirectMessageCountRequestSchema
} from "../validators/directMessage.validator.js";

const router = Router();

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Conversation message collection
|--------------------------------------------------------------------------
*/

router.post(
  "/conversations/:conversationId/messages",
  validate(sendDirectMessageRequestSchema),
  sendDirectMessageController
);

router.get(
  "/conversations/:conversationId/messages",
  validate(getDirectMessageHistoryRequestSchema),
  getDirectMessageHistoryController
);

/*
|--------------------------------------------------------------------------
| Read status and unread count
|--------------------------------------------------------------------------
| These must remain above /messages/:messageId.
*/

router.patch(
  "/conversations/:conversationId/messages/read",
  validate(markDirectMessagesReadRequestSchema),
  markDirectMessagesReadController
);

router.get(
  "/conversations/:conversationId/messages/unread-count",
  validate(getUnreadDirectMessageCountRequestSchema),
  getUnreadDirectMessageCountController
);

/*
|--------------------------------------------------------------------------
| Individual direct message
|--------------------------------------------------------------------------
*/

router.get(
  "/conversations/:conversationId/messages/:messageId",
  validate(getDirectMessageRequestSchema),
  getDirectMessageController
);

router.patch(
  "/conversations/:conversationId/messages/:messageId",
  validate(editDirectMessageRequestSchema),
  editDirectMessageController
);

router.delete(
  "/conversations/:conversationId/messages/:messageId",
  validate(deleteDirectMessageRequestSchema),
  deleteDirectMessageController
);

export default router;