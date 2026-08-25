import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";

import {
  getPublicChatRoomController,
  joinPublicChatRoomController,
  leavePublicChatRoomController,
  getPublicRoomMembersController,
  getPublicRoomDetailsController,
  markRoomAsReadController
} from "../controllers/community/chatRoom.controller.js";

import {
  getPublicChatRoomRequestSchema,
  joinPublicChatRoomRequestSchema,
  leavePublicChatRoomRequestSchema,
  getPublicRoomMembersRequestSchema,
  getPublicRoomDetailsRequestSchema,
  markRoomAsReadRequestSchema
} from "../validators/chatRoom.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/public",
  validate(getPublicChatRoomRequestSchema),
  getPublicChatRoomController
);

router.get(
  "/public/details",
  validate(getPublicRoomDetailsRequestSchema),
  getPublicRoomDetailsController
);

router.get(
  "/public/members",
  validate(getPublicRoomMembersRequestSchema),
  getPublicRoomMembersController
);

router.post(
  "/public/join",
  validate(joinPublicChatRoomRequestSchema),
  joinPublicChatRoomController
);

router.post(
  "/public/leave",
  validate(leavePublicChatRoomRequestSchema),
  leavePublicChatRoomController
);

router.patch(
  "/:roomId/read",
  validate(markRoomAsReadRequestSchema),
  markRoomAsReadController
);

export default router;