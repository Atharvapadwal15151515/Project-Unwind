import {
  likeComment,
  unlikeComment
} from "../../services/community/commentLike.service.js";

export async function likeCommentController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { commentId } = req.params;

    const result = await likeComment({
      commentId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyLiked
        ? "Comment already liked"
        : "Comment liked successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function unlikeCommentController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { commentId } = req.params;

    const result = await unlikeComment({
      commentId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyUnliked
        ? "Comment already unliked"
        : "Comment unliked successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}