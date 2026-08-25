import { Readable } from "stream";

import cloudinary from "../../config/cloudinary.js";

import {
  createMultiplePostMedia,
  findMediaByPostId,
  deletePostMediaByPostId
} from "../../models/community/postMedia.model.js";

function uploadBuffer(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

export async function uploadPostMedia({
  postId,
  files
}) {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadedCloudinaryFiles = [];

  try {
    const mediaItems = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      const result = await uploadBuffer(
        file,
        "unwind/community/posts"
      );

      uploadedCloudinaryFiles.push(result.public_id);

      mediaItems.push({
        postId,
        mediaType: result.resource_type === "video"
          ? "video"
          : "image",

        mediaUrl: result.secure_url,

        cloudinaryPublicId: result.public_id,

        thumbnailUrl:
          result.resource_type === "video"
            ? result.secure_url.replace(
                "/upload/",
                "/upload/so_0/"
              )
            : null,

        fileSizeBytes: result.bytes,

        width: result.width,

        height: result.height,

        durationSeconds: result.duration ?? null,

        displayOrder: index + 1
      });
    }

    return await createMultiplePostMedia(mediaItems);

  } catch (error) {

    for (const publicId of uploadedCloudinaryFiles) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image"
        });

        await cloudinary.uploader.destroy(publicId, {
          resource_type: "video"
        });

      } catch (_) {}
    }

    throw error;
  }
}

export async function getPostMedia(postId) {
  return await findMediaByPostId(postId);
}

export async function deletePostMedia(postId) {
  const media = await findMediaByPostId(postId);

  for (const item of media) {
    try {
      await cloudinary.uploader.destroy(
        item.cloudinary_public_id,
        {
          resource_type:
            item.media_type === "video"
              ? "video"
              : "image"
        }
      );
    } catch (_) {}
  }

  await deletePostMediaByPostId(postId);

  return true;
}