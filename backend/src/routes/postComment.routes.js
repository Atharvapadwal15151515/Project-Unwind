import express from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";

import {
  createPostCommentController,
  getPostCommentsController,
  getCommentRepliesController,
  updatePostCommentController,
  deletePostCommentController
} from "../controllers/community/postComment.controller.js";

import {
  createCommentRequestSchema,
  getPostCommentsRequestSchema,
  getCommentRepliesRequestSchema,
  updateCommentRequestSchema,
  deleteCommentRequestSchema
} from "../validators/postComment.validator.js";

const router = express.Router();

router.use(authenticate);

// Create a comment or reply
router.post(
  "/posts/:postId/comments",
  validate(createCommentRequestSchema),
  createPostCommentController
);

// Get comments for a post
router.get(
  "/posts/:postId/comments",
  validate(getPostCommentsRequestSchema),
  getPostCommentsController
);

// Get replies of a comment
router.get(
  "/comments/:commentId/replies",
  validate(getCommentRepliesRequestSchema),
  getCommentRepliesController
);

// Update comment
router.patch(
  "/comments/:commentId",
  validate(updateCommentRequestSchema),
  updatePostCommentController
);

// Delete comment
router.delete(
  "/comments/:commentId",
  validate(deleteCommentRequestSchema),
  deletePostCommentController
);

export default router;