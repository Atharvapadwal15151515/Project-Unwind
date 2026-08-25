import {
  findProfileByUserId,
  updateProfileImage
} from "../models/profile.model.js";
import { updateUserProfile } from "../services/profile.service.js";
import {
  uploadImageBuffer,
  deleteCloudinaryImage
} from "../services/cloudinary.service.js";

import AppError from "../utils/AppError.js";

export async function uploadProfilePicture(
  req,
  res,
  next
) {
  try {
    if (!req.file) {
      throw new AppError(
        "Profile image is required",
        400
      );
    }

    const userId = req.user.user_id;

    const currentProfile =
      await findProfileByUserId(userId);

    if (!currentProfile) {
      throw new AppError(
        "User profile not found",
        404
      );
    }

    const uploadResult = await uploadImageBuffer(
      req.file.buffer,
      {
        publicId: `user-${userId}`
      }
    );

    const updatedProfile = await updateProfileImage({
      userId,
      profileImageUrl: uploadResult.secure_url,
      profileImagePublicId: uploadResult.public_id
    });

    if (
      currentProfile.profile_image_public_id &&
      currentProfile.profile_image_public_id !==
        uploadResult.public_id
    ) {
      await deleteCloudinaryImage(
        currentProfile.profile_image_public_id
      );
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function removeProfilePicture(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;

    const currentProfile =
      await findProfileByUserId(userId);

    if (!currentProfile) {
      throw new AppError(
        "User profile not found",
        404
      );
    }

    if (currentProfile.profile_image_public_id) {
      await deleteCloudinaryImage(
        currentProfile.profile_image_public_id
      );
    }

    const updatedProfile = await updateProfileImage({
      userId,
      profileImageUrl: null,
      profileImagePublicId: null
    });

    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(
  req,
  res,
  next
) {
  try {
    const {
      username,
      fullName,
      displayName,
      dateOfBirth,
      gender,
      occupationType
    } = req.body;

    const result =
      await updateUserProfile({
        userId:
          req.user.user_id,

        username,
        fullName,
        displayName,
        dateOfBirth,
        gender,
        occupationType
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Profile updated successfully",

        data: {
          profile:
            result.profile,

          user:
            result.user
        }
      });
  } catch (error) {
    next(error);
  }
}