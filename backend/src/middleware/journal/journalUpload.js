import multer from "multer";

const storage = multer.memoryStorage();

const MAX_JOURNAL_FILE_SIZE =
  25 * 1024 * 1024;

const MAX_JOURNAL_ATTACHMENTS = 10;

const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",

  // Audio and voice notes
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",

  // Documents
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function journalAttachmentFileFilter(
  req,
  file,
  callback
) {
  if (
    !allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Unsupported journal attachment. Allowed files include JPEG, PNG, WebP, GIF, MP4, WebM, MOV, MP3, WAV, OGG, M4A, PDF, TXT, DOC and DOCX."
      )
    );
  }

  callback(null, true);
}

const journalMulter = multer({
  storage,

  fileFilter:
    journalAttachmentFileFilter,

  limits: {
    fileSize:
      MAX_JOURNAL_FILE_SIZE,

    files:
      MAX_JOURNAL_ATTACHMENTS
  }
});

/*
  Upload one journal attachment.

  Multipart field name:
  attachment
*/
export const uploadJournalAttachment =
  journalMulter.single(
    "attachment"
  );

/*
  Upload multiple journal attachments.

  Multipart field name:
  attachments
*/
export const uploadJournalAttachments =
  journalMulter.array(
    "attachments",
    MAX_JOURNAL_ATTACHMENTS
  );

/*
  Converts Multer errors into responses compatible
  with the application's error middleware.

  Add this immediately after the Multer middleware
  in the route when needed.
*/
export function handleJournalUploadError(
  error,
  req,
  res,
  next
) {
  if (!error) {
    return next();
  }

  if (
    error instanceof
    multer.MulterError
  ) {
    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Each journal attachment must be 25 MB or smaller."
      });
    }

    if (
      error.code ===
      "LIMIT_FILE_COUNT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A maximum of 10 journal attachments can be uploaded at once."
      });
    }

    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected upload field. Use 'attachment' for one file or 'attachments' for multiple files."
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Journal attachment upload failed."
    });
  }

  return res.status(400).json({
    success: false,
    message:
      error.message ||
      "Invalid journal attachment."
  });
}