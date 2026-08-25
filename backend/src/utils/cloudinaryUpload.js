import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET
});

function getPublicId(
  originalFileName
) {
  if (!originalFileName) {
    return `journal-${Date.now()}`;
  }

  const extensionIndex =
    originalFileName.lastIndexOf(".");

  const baseName =
    extensionIndex === -1
      ? originalFileName
      : originalFileName.substring(
          0,
          extensionIndex
        );

  return `${Date.now()}-${baseName
    .trim()
    .replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}`;
}

export function uploadBufferToCloudinary({
  buffer,
  folder,
  resourceType = "auto",
  originalFileName
}) {
  return new Promise(
    (resolve, reject) => {
      if (!buffer) {
        return reject(
          new Error(
            "File buffer is required."
          )
        );
      }

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder,

            resource_type:
              resourceType,

            public_id:
              getPublicId(
                originalFileName
              ),

            overwrite: false
          },
          (
            error,
            result
          ) => {
            if (error) {
              return reject(
                error
              );
            }

            resolve(result);
          }
        );

      streamifier
        .createReadStream(
          buffer
        )
        .pipe(uploadStream);
    }
  );
}

export async function deleteFromCloudinary({
  publicId,
  resourceType = "auto"
}) {
  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(
    publicId,
    {
      resource_type:
        resourceType
    }
  );
}

export async function uploadMultipleBuffersToCloudinary({
  files,
  folder
}) {
  if (
    !Array.isArray(files)
  ) {
    return [];
  }

  const uploads = [];

  for (const file of files) {
    let resourceType =
      "auto";

    if (
      file.mimetype.startsWith(
        "image/"
      )
    ) {
      resourceType =
        "image";
    } else if (
      file.mimetype.startsWith(
        "video/"
      ) ||
      file.mimetype.startsWith(
        "audio/"
      )
    ) {
      resourceType =
        "video";
    } else {
      resourceType =
        "raw";
    }

    const result =
      await uploadBufferToCloudinary(
        {
          buffer:
            file.buffer,

          folder,

          resourceType,

          originalFileName:
            file.originalname
        }
      );

    uploads.push(result);
  }

  return uploads;
}

export default cloudinary;