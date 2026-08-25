import cloudinary from "../config/cloudinary.js";

export function uploadImageBuffer(
  fileBuffer,
  {
    folder = "unwind/profile-images",
    publicId = undefined
  } = {}
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",

        // Replace existing profile picture
        overwrite: true,

        // Clear Cloudinary CDN cache after replacement
        invalidate: true,

        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face"
          },
          {
            quality: "auto",
            fetch_format: "auto"
          }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteCloudinaryImage(publicId) {
  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true
  });
}