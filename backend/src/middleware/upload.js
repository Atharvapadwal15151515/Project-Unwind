import multer from "multer";

const storage = multer.memoryStorage();

function imageFileFilter(req, file, callback) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only JPEG, PNG and WebP images are allowed")
    );
  }

  callback(null, true);
}

export const uploadProfileImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).single("profileImage");

function postMediaFileFilter(req, file, callback) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error(
        "Only JPEG, PNG, WebP, GIF, MP4, WebM and MOV files are allowed"
      )
    );
  }

  callback(null, true);
}

export const uploadPostMedia = multer({
  storage,
  fileFilter: postMediaFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 10
  }
}).array("media", 10);