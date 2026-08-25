import {
  addPostComment,
  getPostComments,
  getReplies,
  editPostComment,
  deletePostComment
} from "../../services/community/postComment.service.js";

export async function createPostCommentController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;
    const { comment_text, parent_comment_id } = req.body;

    const result = await addPostComment({
      postId,
      userId,
      commentText: comment_text,
      parentCommentId: parent_comment_id || null
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostCommentsController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.validatedQuery;

    const result = await getPostComments({
      postId,
      userId,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getCommentRepliesController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.validatedQuery;

    const result = await getReplies({
      parentCommentId: commentId,
      userId,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePostCommentController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { commentId } = req.params;
    const { comment_text } = req.body;

    const comment = await editPostComment({
      commentId,
      userId,
      commentText: comment_text
    });

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePostCommentController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { commentId } = req.params;

    const result = await deletePostComment({
      commentId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyDeleted
        ? "Comment already deleted"
        : "Comment deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}