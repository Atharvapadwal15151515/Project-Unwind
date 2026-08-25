import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createPrivateRoomController,
  joinPrivateRoomByCodeController,
  joinPrivateRoomByInviteController,
  listPrivateRoomsController,
  getPrivateRoomController,
  getPrivateRoomMembersController,
  updatePrivateRoomController,
  setPrivateRoomLockController,
  regeneratePrivateRoomInviteController,
  leavePrivateRoomController,
  removePrivateRoomMemberController,
  setPrivateRoomMemberMuteController,
  transferPrivateRoomOwnerController,
  closePrivateRoomController,
  sendPrivateRoomMessageController,
  getPrivateRoomMessagesController,
  editPrivateRoomMessageController,
  deletePrivateRoomMessageController,
  markPrivateRoomReadController,
  getPrivateRoomUnreadCountController
} from "../controllers/community/privateRoom.controller.js";

import {
  createPrivateRoomRequestSchema,
  joinPrivateRoomByCodeRequestSchema,
  joinPrivateRoomByInviteRequestSchema,
  listPrivateRoomsRequestSchema,
  getPrivateRoomRequestSchema,
  getPrivateRoomMembersRequestSchema,
  updatePrivateRoomRequestSchema,
  setPrivateRoomLockRequestSchema,
  regeneratePrivateRoomInviteRequestSchema,
  leavePrivateRoomRequestSchema,
  removePrivateRoomMemberRequestSchema,
  setPrivateRoomMemberMuteRequestSchema,
  transferPrivateRoomOwnerRequestSchema,
  closePrivateRoomRequestSchema,
  sendPrivateRoomMessageRequestSchema,
  getPrivateRoomMessagesRequestSchema,
  editPrivateRoomMessageRequestSchema,
  deletePrivateRoomMessageRequestSchema,
  markPrivateRoomReadRequestSchema,
  getPrivateRoomUnreadCountRequestSchema
} from "../validators/community/privateRoom.validator.js";

const router = Router();

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Room collection
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createPrivateRoomRequestSchema),
  createPrivateRoomController
);

router.get(
  "/",
  validate(listPrivateRoomsRequestSchema),
  listPrivateRoomsController
);

/*
|--------------------------------------------------------------------------
| Join private room
|--------------------------------------------------------------------------
*/

router.post(
  "/join/code",
  validate(joinPrivateRoomByCodeRequestSchema),
  joinPrivateRoomByCodeController
);

router.post(
  "/join/invite",
  validate(joinPrivateRoomByInviteRequestSchema),
  joinPrivateRoomByInviteController
);

/*
|--------------------------------------------------------------------------
| Room messages
|--------------------------------------------------------------------------
| Keep unread-count and read above the messageId routes.
*/

router.post(
  "/:roomId/messages",
  validate(sendPrivateRoomMessageRequestSchema),
  sendPrivateRoomMessageController
);

router.get(
  "/:roomId/messages",
  validate(getPrivateRoomMessagesRequestSchema),
  getPrivateRoomMessagesController
);

router.get(
  "/:roomId/messages/unread-count",
  validate(getPrivateRoomUnreadCountRequestSchema),
  getPrivateRoomUnreadCountController
);

router.patch(
  "/:roomId/messages/read",
  validate(markPrivateRoomReadRequestSchema),
  markPrivateRoomReadController
);

router.patch(
  "/:roomId/messages/:messageId",
  validate(editPrivateRoomMessageRequestSchema),
  editPrivateRoomMessageController
);

router.delete(
  "/:roomId/messages/:messageId",
  validate(deletePrivateRoomMessageRequestSchema),
  deletePrivateRoomMessageController
);

/*
|--------------------------------------------------------------------------
| Room members
|--------------------------------------------------------------------------
*/

router.get(
  "/:roomId/members",
  validate(getPrivateRoomMembersRequestSchema),
  getPrivateRoomMembersController
);

router.delete(
  "/:roomId/members/:memberUserId",
  validate(removePrivateRoomMemberRequestSchema),
  removePrivateRoomMemberController
);

router.patch(
  "/:roomId/members/:memberUserId/mute",
  validate(setPrivateRoomMemberMuteRequestSchema),
  setPrivateRoomMemberMuteController
);

/*
|--------------------------------------------------------------------------
| Room management
|--------------------------------------------------------------------------
*/

router.patch(
  "/:roomId/lock",
  validate(setPrivateRoomLockRequestSchema),
  setPrivateRoomLockController
);

router.post(
  "/:roomId/regenerate-invite",
  validate(regeneratePrivateRoomInviteRequestSchema),
  regeneratePrivateRoomInviteController
);

router.patch(
  "/:roomId/transfer-owner",
  validate(transferPrivateRoomOwnerRequestSchema),
  transferPrivateRoomOwnerController
);

router.patch(
  "/:roomId/leave",
  validate(leavePrivateRoomRequestSchema),
  leavePrivateRoomController
);

router.patch(
  "/:roomId/close",
  validate(closePrivateRoomRequestSchema),
  closePrivateRoomController
);

/*
|--------------------------------------------------------------------------
| Get or update one room
|--------------------------------------------------------------------------
| Keep these generic routes near the bottom.
*/

router.get(
  "/:roomId",
  validate(getPrivateRoomRequestSchema),
  getPrivateRoomController
);

router.patch(
  "/:roomId",
  validate(updatePrivateRoomRequestSchema),
  updatePrivateRoomController
);

export default router;