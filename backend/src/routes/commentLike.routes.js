import express from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";

import {
  likeCommentController,
  unlikeCommentController
} from "../controllers/community/commentLike.controller.js";

import {
  likeCommentRequestSchema,
  unlikeCommentRequestSchema
} from "../validators/postComment.validator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/comments/:commentId/like",
  validate(likeCommentRequestSchema),
  likeCommentController
);

router.delete(
  "/comments/:commentId/like",
  validate(unlikeCommentRequestSchema),
  unlikeCommentController
);

export default router;