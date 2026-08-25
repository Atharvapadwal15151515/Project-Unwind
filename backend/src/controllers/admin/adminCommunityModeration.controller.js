import {
  removeCommunityContent,
  restoreCommunityContent
} from "../../services/admin/adminCommunityModeration.service.js";


const allowedTypes = [
  "post",
  "comment",
  "chat_message"
];


export async function removeCommunityContentController(
  req,
  res
) {
  try {
    const {
      targetType,
      targetId
    } = req.params;

    const {
      reason
    } = req.body;


    if (
      !allowedTypes.includes(
        targetType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid community content type"
      });
    }


    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Removal reason is required"
      });
    }


    const result =
      await removeCommunityContent({
        adminId:
          req.user.user_id,

        targetType,
        targetId,
        reason
      });


    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Community content not found"
      });
    }


    return res.status(200).json({
      success: true,
      message:
        "Community content removed successfully",
      result
    });

  } catch (error) {
    if (
      error.message ===
      "CONTENT_ALREADY_DELETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Content is already deleted"
      });
    }


    console.error(
      "Admin content removal error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove community content"
    });
  }
}


export async function restoreCommunityContentController(
  req,
  res
) {
  try {
    const {
      targetType,
      targetId
    } = req.params;

    const {
      reason
    } = req.body;


    if (
      ![
        "post",
        "comment"
      ].includes(targetType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only posts and comments can currently be restored"
      });
    }


    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Restore reason is required"
      });
    }


    const result =
      await restoreCommunityContent({
        adminId:
          req.user.user_id,

        targetType,
        targetId,
        reason
      });


    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Community content not found"
      });
    }


    return res.status(200).json({
      success: true,
      message:
        "Community content restored successfully",
      result
    });

  } catch (error) {
    if (
      error.message ===
      "CONTENT_NOT_DELETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Content is not deleted"
      });
    }


    console.error(
      "Admin content restore error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to restore community content"
    });
  }
}