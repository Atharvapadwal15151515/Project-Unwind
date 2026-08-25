import {
  likePost,
  unlikePost
} from "../../services/community/postLike.service.js";

export async function likePostController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const result = await likePost({
      postId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyLiked
        ? "Post already liked"
        : "Post liked successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function unlikePostController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const result = await unlikePost({
      postId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyUnliked
        ? "Post was not liked"
        : "Post unliked successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}