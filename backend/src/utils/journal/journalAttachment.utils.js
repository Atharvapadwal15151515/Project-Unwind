import path from "path";
import crypto from "crypto";

export const JOURNAL_ATTACHMENT_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  DOCUMENT: "document"
};

export const JOURNAL_PROCESSING_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
};

export const JOURNAL_ATTACHMENT_LIMITS = {
  MAX_FILES_PER_ENTRY: 10,

  MAX_IMAGE_SIZE:
    10 * 1024 * 1024,

  MAX_VIDEO_SIZE:
    25 * 1024 * 1024,

  MAX_AUDIO_SIZE:
    15 * 1024 * 1024,

  MAX_DOCUMENT_SIZE:
    10 * 1024 * 1024,

  MAX_CAPTION_LENGTH: 500,

  MAX_ALT_TEXT_LENGTH: 500
};

export const JOURNAL_ALLOWED_MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ],

  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ],

  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a"
  ],

  document: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
};

export const JOURNAL_ALLOWED_EXTENSIONS = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif"
  ],

  video: [
    "mp4",
    "webm",
    "mov"
  ],

  audio: [
    "mp3",
    "wav",
    "webm",
    "ogg",
    "m4a",
    "mp4"
  ],

  document: [
    "pdf",
    "txt",
    "doc",
    "docx"
  ]
};

export function getAttachmentTypeFromMimeType(
  mimeType
) {
  if (!mimeType) {
    return null;
  }

  for (
    const [
      attachmentType,
      mimeTypes
    ] of Object.entries(
      JOURNAL_ALLOWED_MIME_TYPES
    )
  ) {
    if (
      mimeTypes.includes(
        mimeType.toLowerCase()
      )
    ) {
      return attachmentType;
    }
  }

  return null;
}

export function isAllowedJournalMimeType(
  mimeType
) {
  return Boolean(
    getAttachmentTypeFromMimeType(
      mimeType
    )
  );
}

export function getAllowedMimeTypes() {
  return Object.values(
    JOURNAL_ALLOWED_MIME_TYPES
  ).flat();
}

export function getFileExtension(
  fileName
) {
  if (
    !fileName ||
    typeof fileName !== "string"
  ) {
    return null;
  }

  const extension = path
    .extname(fileName)
    .replace(".", "")
    .toLowerCase();

  return extension || null;
}

export function removeFileExtension(
  fileName
) {
  if (
    !fileName ||
    typeof fileName !== "string"
  ) {
    return "";
  }

  const extension =
    path.extname(fileName);

  return path.basename(
    fileName,
    extension
  );
}

export function sanitizeFileName(
  fileName
) {
  if (
    !fileName ||
    typeof fileName !== "string"
  ) {
    return "journal-file";
  }

  const extension =
    getFileExtension(fileName);

  const baseName =
    removeFileExtension(fileName)
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(0, 80) ||
    "journal-file";

  if (!extension) {
    return baseName;
  }

  return `${baseName}.${extension}`;
}

export function generateJournalFileName(
  originalFileName
) {
  const extension =
    getFileExtension(
      originalFileName
    );

  const randomValue =
    crypto
      .randomBytes(12)
      .toString("hex");

  const timestamp =
    Date.now();

  if (!extension) {
    return `journal-${timestamp}-${randomValue}`;
  }

  return `journal-${timestamp}-${randomValue}.${extension}`;
}

export function generateJournalPublicId({
  userId,
  entryId,
  originalFileName
}) {
  const baseName =
    removeFileExtension(
      sanitizeFileName(
        originalFileName
      )
    );

  const randomValue =
    crypto
      .randomBytes(8)
      .toString("hex");

  return [
    userId,
    entryId,
    `${baseName}-${randomValue}`
  ]
    .filter(Boolean)
    .join("-");
}

export function getJournalCloudinaryFolder(
  userId,
  entryId
) {
  if (!userId) {
    return "unwind/journal";
  }

  if (!entryId) {
    return `unwind/journal/${userId}`;
  }

  return `unwind/journal/${userId}/${entryId}`;
}

export function getCloudinaryResourceType(
  attachmentType
) {
  switch (attachmentType) {
    case JOURNAL_ATTACHMENT_TYPES.IMAGE:
      return "image";

    case JOURNAL_ATTACHMENT_TYPES.VIDEO:
    case JOURNAL_ATTACHMENT_TYPES.AUDIO:
      return "video";

    case JOURNAL_ATTACHMENT_TYPES.DOCUMENT:
      return "raw";

    default:
      return "auto";
  }
}

export function getMaximumFileSize(
  attachmentType
) {
  switch (attachmentType) {
    case JOURNAL_ATTACHMENT_TYPES.IMAGE:
      return JOURNAL_ATTACHMENT_LIMITS
        .MAX_IMAGE_SIZE;

    case JOURNAL_ATTACHMENT_TYPES.VIDEO:
      return JOURNAL_ATTACHMENT_LIMITS
        .MAX_VIDEO_SIZE;

    case JOURNAL_ATTACHMENT_TYPES.AUDIO:
      return JOURNAL_ATTACHMENT_LIMITS
        .MAX_AUDIO_SIZE;

    case JOURNAL_ATTACHMENT_TYPES.DOCUMENT:
      return JOURNAL_ATTACHMENT_LIMITS
        .MAX_DOCUMENT_SIZE;

    default:
      return 0;
  }
}

export function validateJournalFile(
  file
) {
  if (!file) {
    return {
      isValid: false,
      message:
        "Journal attachment file is required."
    };
  }

  if (!file.mimetype) {
    return {
      isValid: false,
      message:
        "File MIME type is missing."
    };
  }

  const attachmentType =
    getAttachmentTypeFromMimeType(
      file.mimetype
    );

  if (!attachmentType) {
    return {
      isValid: false,
      message:
        "Unsupported journal attachment type."
    };
  }

  const fileExtension =
    getFileExtension(
      file.originalname
    );

  const allowedExtensions =
    JOURNAL_ALLOWED_EXTENSIONS[
      attachmentType
    ];

  if (
    fileExtension &&
    !allowedExtensions.includes(
      fileExtension
    )
  ) {
    return {
      isValid: false,
      message:
        "The file extension does not match an allowed journal attachment format."
    };
  }

  const maximumFileSize =
    getMaximumFileSize(
      attachmentType
    );

  if (
    !file.size ||
    file.size <= 0
  ) {
    return {
      isValid: false,
      message:
        "The uploaded file is empty."
    };
  }

  if (
    file.size >
    maximumFileSize
  ) {
    return {
      isValid: false,
      message:
        `${capitalizeFirstLetter(
          attachmentType
        )} attachments cannot exceed ${formatFileSize(
          maximumFileSize
        )}.`
    };
  }

  return {
    isValid: true,
    attachmentType,
    fileExtension,
    maximumFileSize
  };
}

export function validateJournalFiles(
  files
) {
  if (
    !Array.isArray(files) ||
    files.length === 0
  ) {
    return {
      isValid: false,
      message:
        "At least one journal attachment is required.",
      files: []
    };
  }

  if (
    files.length >
    JOURNAL_ATTACHMENT_LIMITS
      .MAX_FILES_PER_ENTRY
  ) {
    return {
      isValid: false,
      message:
        `A maximum of ${JOURNAL_ATTACHMENT_LIMITS.MAX_FILES_PER_ENTRY} journal attachments can be uploaded at once.`,
      files: []
    };
  }

  const validatedFiles = [];

  for (const file of files) {
    const result =
      validateJournalFile(file);

    if (!result.isValid) {
      return {
        isValid: false,
        message:
          `${file.originalname || "File"}: ${result.message}`,
        files: validatedFiles
      };
    }

    validatedFiles.push({
      file,
      attachmentType:
        result.attachmentType,
      fileExtension:
        result.fileExtension
    });
  }

  return {
    isValid: true,
    files: validatedFiles
  };
}

export function normalizeCloudinaryUpload({
  file,
  uploadResult,
  userId,
  entryId,
  attachmentOrder = 0,
  caption = null,
  altText = null,
  isCover = false
}) {
  if (!file) {
    throw new Error(
      "Original file metadata is required."
    );
  }

  if (!uploadResult) {
    throw new Error(
      "Cloudinary upload result is required."
    );
  }

  const attachmentType =
    getAttachmentTypeFromMimeType(
      file.mimetype
    );

  if (!attachmentType) {
    throw new Error(
      "Unsupported attachment MIME type."
    );
  }

  return {
    userId,
    entryId,

    attachmentType,

    originalFileName:
      file.originalname,

    storedFileName:
      uploadResult.original_filename ||
      uploadResult.public_id ||
      null,

    fileUrl:
      uploadResult.secure_url ||
      uploadResult.url,

    filePublicId:
      uploadResult.public_id,

    fileFormat:
      uploadResult.format ||
      getFileExtension(
        file.originalname
      ),

    mimeType:
      file.mimetype,

    fileSizeBytes:
      Number(
        uploadResult.bytes ||
        file.size ||
        0
      ),

    fileExtension:
      uploadResult.format ||
      getFileExtension(
        file.originalname
      ),

    width:
      uploadResult.width ||
      null,

    height:
      uploadResult.height ||
      null,

    durationSeconds:
      uploadResult.duration ||
      null,

    attachmentOrder:
      Number(
        attachmentOrder
      ) || 0,

    caption:
      normalizeOptionalText(
        caption
      ),

    altText:
      normalizeOptionalText(
        altText
      ),

    isCover:
      normalizeBoolean(
        isCover
      ),

    isProcessed: true,

    processingStatus:
      JOURNAL_PROCESSING_STATUSES
        .COMPLETED,

    processingError: null
  };
}

export function normalizeJournalAttachmentMetadata(
  attachmentData = {}
) {
  return {
    attachmentType:
      attachmentData
        .attachmentType ||
      attachmentData
        .attachment_type ||
      null,

    originalFileName:
      attachmentData
        .originalFileName ||
      attachmentData
        .original_file_name ||
      null,

    storedFileName:
      attachmentData
        .storedFileName ||
      attachmentData
        .stored_file_name ||
      null,

    fileUrl:
      attachmentData.fileUrl ||
      attachmentData.file_url ||
      attachmentData.secure_url ||
      null,

    filePublicId:
      attachmentData
        .filePublicId ||
      attachmentData
        .file_public_id ||
      attachmentData.public_id ||
      null,

    fileFormat:
      attachmentData
        .fileFormat ||
      attachmentData
        .file_format ||
      attachmentData.format ||
      null,

    mimeType:
      attachmentData.mimeType ||
      attachmentData.mime_type ||
      attachmentData.mimetype ||
      null,

    fileSizeBytes:
      Number(
        attachmentData
          .fileSizeBytes ||
        attachmentData
          .file_size_bytes ||
        attachmentData.bytes ||
        attachmentData.size ||
        0
      ),

    fileExtension:
      attachmentData
        .fileExtension ||
      attachmentData
        .file_extension ||
      null,

    width:
      normalizeNumber(
        attachmentData.width
      ),

    height:
      normalizeNumber(
        attachmentData.height
      ),

    durationSeconds:
      normalizeNumber(
        attachmentData
          .durationSeconds ||
        attachmentData
          .duration_seconds ||
        attachmentData.duration
      ),

    attachmentOrder:
      Number(
        attachmentData
          .attachmentOrder ??
        attachmentData
          .attachment_order ??
        0
      ),

    caption:
      normalizeOptionalText(
        attachmentData.caption
      ),

    altText:
      normalizeOptionalText(
        attachmentData.altText ??
        attachmentData.alt_text
      ),

    isCover:
      normalizeBoolean(
        attachmentData.isCover ??
        attachmentData.is_cover
      ),

    isProcessed:
      attachmentData
        .isProcessed !==
        undefined
        ? normalizeBoolean(
            attachmentData
              .isProcessed
          )
        : attachmentData
              .is_processed !==
            undefined
          ? normalizeBoolean(
              attachmentData
                .is_processed
            )
          : true,

    processingStatus:
      attachmentData
        .processingStatus ||
      attachmentData
        .processing_status ||
      JOURNAL_PROCESSING_STATUSES
        .COMPLETED,

    processingError:
      normalizeOptionalText(
        attachmentData
          .processingError ??
        attachmentData
          .processing_error
      )
  };
}

export function formatJournalAttachment(
  attachment
) {
  if (!attachment) {
    return null;
  }

  return {
    attachmentId:
      attachment.attachment_id,

    entryId:
      attachment.entry_id,

    attachmentType:
      attachment.attachment_type,

    originalFileName:
      attachment.original_file_name,

    fileUrl:
      attachment.file_url,

    fileFormat:
      attachment.file_format,

    mimeType:
      attachment.mime_type,

    fileSizeBytes:
      Number(
        attachment.file_size_bytes ||
        0
      ),

    formattedFileSize:
      formatFileSize(
        attachment.file_size_bytes
      ),

    fileExtension:
      attachment.file_extension,

    width:
      normalizeNumber(
        attachment.width
      ),

    height:
      normalizeNumber(
        attachment.height
      ),

    durationSeconds:
      normalizeNumber(
        attachment.duration_seconds
      ),

    formattedDuration:
      formatDuration(
        attachment.duration_seconds
      ),

    attachmentOrder:
      Number(
        attachment.attachment_order ||
        0
      ),

    caption:
      attachment.caption,

    altText:
      attachment.alt_text,

    isCover:
      Boolean(
        attachment.is_cover
      ),

    isProcessed:
      Boolean(
        attachment.is_processed
      ),

    processingStatus:
      attachment.processing_status,

    processingError:
      attachment.processing_error,

    isDeleted:
      Boolean(
        attachment.is_deleted
      ),

    deletedAt:
      attachment.deleted_at,

    createdAt:
      attachment.created_at,

    updatedAt:
      attachment.updated_at,

    icon:
      getAttachmentIcon(
        attachment.attachment_type
      )
  };
}

export function formatJournalAttachments(
  attachments = []
) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map(
      formatJournalAttachment
    )
    .sort(
      (first, second) =>
        first.attachmentOrder -
        second.attachmentOrder
    );
}

export function getAttachmentIcon(
  attachmentType
) {
  switch (attachmentType) {
    case JOURNAL_ATTACHMENT_TYPES.IMAGE:
      return "image";

    case JOURNAL_ATTACHMENT_TYPES.VIDEO:
      return "video";

    case JOURNAL_ATTACHMENT_TYPES.AUDIO:
      return "audio";

    case JOURNAL_ATTACHMENT_TYPES.DOCUMENT:
      return "document";

    default:
      return "attachment";
  }
}

export function isImageAttachment(
  attachment
) {
  return (
    attachment?.attachment_type ===
      JOURNAL_ATTACHMENT_TYPES.IMAGE ||
    attachment?.attachmentType ===
      JOURNAL_ATTACHMENT_TYPES.IMAGE
  );
}

export function isVideoAttachment(
  attachment
) {
  return (
    attachment?.attachment_type ===
      JOURNAL_ATTACHMENT_TYPES.VIDEO ||
    attachment?.attachmentType ===
      JOURNAL_ATTACHMENT_TYPES.VIDEO
  );
}

export function isAudioAttachment(
  attachment
) {
  return (
    attachment?.attachment_type ===
      JOURNAL_ATTACHMENT_TYPES.AUDIO ||
    attachment?.attachmentType ===
      JOURNAL_ATTACHMENT_TYPES.AUDIO
  );
}

export function isDocumentAttachment(
  attachment
) {
  return (
    attachment?.attachment_type ===
      JOURNAL_ATTACHMENT_TYPES.DOCUMENT ||
    attachment?.attachmentType ===
      JOURNAL_ATTACHMENT_TYPES.DOCUMENT
  );
}

export function selectCoverAttachment(
  attachments = []
) {
  if (
    !Array.isArray(attachments) ||
    attachments.length === 0
  ) {
    return null;
  }

  const explicitCover =
    attachments.find(
      (attachment) =>
        attachment.is_cover === true ||
        attachment.isCover === true
    );

  if (explicitCover) {
    return explicitCover;
  }

  const firstImage =
    attachments.find(
      (attachment) =>
        isImageAttachment(
          attachment
        )
    );

  return (
    firstImage ||
    attachments[0]
  );
}

export function sortAttachments(
  attachments = []
) {
  return [...attachments].sort(
    (first, second) => {
      const firstOrder =
        Number(
          first.attachment_order ??
          first.attachmentOrder ??
          0
        );

      const secondOrder =
        Number(
          second.attachment_order ??
          second.attachmentOrder ??
          0
        );

      return (
        firstOrder -
        secondOrder
      );
    }
  );
}

export function calculateTotalStorage(
  attachments = []
) {
  return attachments.reduce(
    (
      total,
      attachment
    ) =>
      total +
      Number(
        attachment.file_size_bytes ??
        attachment.fileSizeBytes ??
        0
      ),
    0
  );
}

export function calculateStoragePercentage(
  usedBytes,
  limitBytes
) {
  const used =
    Number(usedBytes) || 0;

  const limit =
    Number(limitBytes) || 0;

  if (limit <= 0) {
    return 0;
  }

  return Number(
    (
      (used / limit) *
      100
    ).toFixed(2)
  );
}

export function formatFileSize(
  bytes
) {
  const numericBytes =
    Number(bytes) || 0;

  if (numericBytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
  ];

  const unitIndex =
    Math.min(
      Math.floor(
        Math.log(numericBytes) /
        Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    numericBytes /
    1024 ** unitIndex;

  return `${Number(
    value.toFixed(2)
  )} ${units[unitIndex]}`;
}

export function formatDuration(
  durationSeconds
) {
  const duration =
    Math.floor(
      Number(
        durationSeconds
      ) || 0
    );

  if (duration <= 0) {
    return null;
  }

  const hours =
    Math.floor(
      duration / 3600
    );

  const minutes =
    Math.floor(
      (duration % 3600) /
      60
    );

  const seconds =
    duration % 60;

  if (hours > 0) {
    return [
      hours,
      String(minutes).padStart(
        2,
        "0"
      ),
      String(seconds).padStart(
        2,
        "0"
      )
    ].join(":");
  }

  return [
    minutes,
    String(seconds).padStart(
      2,
      "0"
    )
  ].join(":");
}

export function normalizeBoolean(
  value
) {
  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  return false;
}

export function normalizeOptionalText(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
}

export function normalizeNumber(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  if (
    Number.isNaN(
      numberValue
    )
  ) {
    return null;
  }

  return numberValue;
}

export function capitalizeFirstLetter(
  value
) {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}