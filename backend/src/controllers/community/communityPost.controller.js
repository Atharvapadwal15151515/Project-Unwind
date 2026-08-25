import {
  createPost,
  getPostById,
  getFeed,
  editPost,
  deletePost,
  getPostsByUser
} from "../../services/community/communityPost.service.js";

export async function createCommunityPostController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const {
      caption,
      post_type,
      visibility,
      comments_enabled
    } = req.body;

    const post = await createPost({
      userId,
      caption,
      postType: post_type,
      visibility,
      commentsEnabled: comments_enabled,
      files: req.files ?? []
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getCommunityPostController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const post = await getPostById({
      postId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getCommunityFeedController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const {
      page,
      limit,
      post_type
    } = req.validatedQuery;

    const result = await getFeed({
      userId,
      page,
      limit,
      postType: post_type
    });

    return res.status(200).json({
      success: true,
      message: "Community feed fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCommunityPostController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const {
      caption,
      visibility,
      comments_enabled
    } = req.body;

    const post = await editPost({
      postId,
      userId,
      caption,
      visibility,
      commentsEnabled: comments_enabled
    });

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCommunityPostController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const post = await deletePost({
      postId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserPostsController(req, res, next) {
  try {
    const currentUserId = req.user.user_id;
    const { userId: authorUserId } = req.params;

    const {
      page,
      limit
    } = req.validatedQuery;

    const result = await getPostsByUser({
      authorUserId,
      currentUserId,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      message: "User posts fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}