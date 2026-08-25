import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";

import {
  createDirectConversationController,
  getDirectConversationController,
  listDirectConversationsController,
  markDirectConversationReadController,
  refreshDirectConversationIdentityController,
  setDirectConversationMuteController,
  leaveDirectConversationController,
  rejoinDirectConversationController
} from "../controllers/community/directConversation.controller.js";

import {
  createDirectConversationRequestSchema,
  getDirectConversationRequestSchema,
  listDirectConversationsRequestSchema,
  markDirectConversationReadRequestSchema,
  refreshDirectConversationIdentityRequestSchema,
  setDirectConversationMuteRequestSchema,
  leaveDirectConversationRequestSchema,
  rejoinDirectConversationRequestSchema
} from "../validators/directConversation.validator.js";

const router = Router();

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Direct conversation collection routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createDirectConversationRequestSchema),
  createDirectConversationController
);

router.get(
  "/",
  validate(listDirectConversationsRequestSchema),
  listDirectConversationsController
);

/*
|--------------------------------------------------------------------------
| Direct conversation actions
|--------------------------------------------------------------------------
*/

router.patch(
  "/:conversationId/read",
  validate(markDirectConversationReadRequestSchema),
  markDirectConversationReadController
);

router.patch(
  "/:conversationId/identity",
  validate(refreshDirectConversationIdentityRequestSchema),
  refreshDirectConversationIdentityController
);

router.patch(
  "/:conversationId/mute",
  validate(setDirectConversationMuteRequestSchema),
  setDirectConversationMuteController
);

router.patch(
  "/:conversationId/leave",
  validate(leaveDirectConversationRequestSchema),
  leaveDirectConversationController
);

router.patch(
  "/:conversationId/rejoin",
  validate(rejoinDirectConversationRequestSchema),
  rejoinDirectConversationController
);

/*
|--------------------------------------------------------------------------
| Get one conversation
|--------------------------------------------------------------------------
| Keep this after the specific action routes.
*/

router.get(
  "/:conversationId",
  validate(getDirectConversationRequestSchema),
  getDirectConversationController
);

export default router;