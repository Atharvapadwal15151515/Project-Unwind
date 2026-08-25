export const JOURNAL_ATTACHMENT_TYPES =
  Object.freeze({
    IMAGE: "image",
    VIDEO: "video",
    AUDIO: "audio",
    DOCUMENT: "document"
  });

export const JOURNAL_ATTACHMENT_LIMITS =
  Object.freeze({
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
  });

export const JOURNAL_ATTACHMENT_MIME_TYPES =
  Object.freeze({
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
  });

export const JOURNAL_ATTACHMENT_EXTENSIONS =
  Object.freeze({
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
  });

const MIME_TYPE_MAP =
  new Map(
    Object.entries(
      JOURNAL_ATTACHMENT_MIME_TYPES
    ).flatMap(
      ([attachmentType, mimeTypes]) =>
        mimeTypes.map(
          (mimeType) => [
            mimeType,
            attachmentType
          ]
        )
    )
  );

const SUPPORTED_ATTACHMENT_TYPES =
  new Set(
    Object.values(
      JOURNAL_ATTACHMENT_TYPES
    )
  );

const ALL_EXTENSIONS =
  [
    ...new Set(
      Object.values(
        JOURNAL_ATTACHMENT_EXTENSIONS
      ).flat()
    )
  ];

export const JOURNAL_ATTACHMENT_ACCEPT = [
  ...new Set(
    Object.values(
      JOURNAL_ATTACHMENT_MIME_TYPES
    ).flat()
  ),

  ...ALL_EXTENSIONS.map(
    (extension) =>
      `.${extension}`
  )
].join(",");

export function getJournalAttachmentId(
  attachment
) {
  return (
    attachment?.attachmentId ||
    attachment?.attachment_id ||
    null
  );
}

export function getJournalAttachmentType(
  fileOrAttachment
) {
  const savedType =
    fileOrAttachment?.attachmentType ||
    fileOrAttachment?.attachment_type;

  if (
    SUPPORTED_ATTACHMENT_TYPES.has(
      savedType
    )
  ) {
    return savedType;
  }

  const mimeType =
    typeof fileOrAttachment ===
    "string"
      ? fileOrAttachment
      : (
          fileOrAttachment?.type ||
          fileOrAttachment?.mimeType ||
          fileOrAttachment?.mime_type ||
          ""
        );

  return (
    MIME_TYPE_MAP.get(
      String(mimeType).toLowerCase()
    ) || null
  );
}

export function getJournalFileExtension(
  fileName
) {
  if (
    !fileName ||
    typeof fileName !== "string"
  ) {
    return "";
  }

  const lastDot =
    fileName.lastIndexOf(".");

  if (
    lastDot < 0 ||
    lastDot ===
      fileName.length - 1
  ) {
    return "";
  }

  return fileName
    .slice(lastDot + 1)
    .toLowerCase();
}

export function getMaximumJournalFileSize(
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

export function formatJournalFileSize(
  value
) {
  const bytes =
    Number(value) || 0;

  if (bytes <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const unitIndex =
    Math.min(
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      ),
      units.length - 1
    );

  const size =
    bytes /
    (1024 ** unitIndex);

  const formattedSize =
    unitIndex === 0 ||
    size >= 10
      ? size.toFixed(0)
      : size.toFixed(1);

  return `${formattedSize} ${units[unitIndex]}`;
}

export function validateJournalAttachmentFile(
  file
) {
  if (!file) {
    return {
      isValid: false,
      message:
        "Choose a file to attach."
    };
  }

  const attachmentType =
    getJournalAttachmentType(
      file
    );

  if (!attachmentType) {
    return {
      isValid: false,
      message:
        "Unsupported file. Use JPEG, PNG, WebP, GIF, MP4, WebM, MOV, MP3, WAV, OGG, M4A, PDF, TXT, DOC or DOCX."
    };
  }

  const fileExtension =
    getJournalFileExtension(
      file.name
    );

  const allowedExtensions =
    JOURNAL_ATTACHMENT_EXTENSIONS[
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
        "The file extension does not match its attachment type."
    };
  }

  const fileSize =
    Number(file.size) || 0;

  if (fileSize <= 0) {
    return {
      isValid: false,
      message:
        "The selected file is empty."
    };
  }

  const maximumFileSize =
    getMaximumJournalFileSize(
      attachmentType
    );

  if (
    fileSize >
    maximumFileSize
  ) {
    return {
      isValid: false,
      message:
        `${attachmentType[0].toUpperCase()}${attachmentType.slice(
          1
        )} attachments cannot exceed ${formatJournalFileSize(
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

export function validateJournalAttachmentFiles(
  files,
  {
    currentAttachmentCount = 0,
    remainingStorageBytes = null
  } = {}
) {
  const selectedFiles =
    Array.from(files || []);

  if (selectedFiles.length === 0) {
    return {
      isValid: false,
      message:
        "Choose at least one file.",
      files: [],
      totalSizeBytes: 0
    };
  }

  const existingCount =
    Math.max(
      Number(
        currentAttachmentCount
      ) || 0,
      0
    );

  if (
    existingCount +
      selectedFiles.length >
    JOURNAL_ATTACHMENT_LIMITS
      .MAX_FILES_PER_ENTRY
  ) {
    const availableSlots =
      Math.max(
        JOURNAL_ATTACHMENT_LIMITS
          .MAX_FILES_PER_ENTRY -
          existingCount,
        0
      );

    return {
      isValid: false,
      message:
        availableSlots === 0
          ? "This entry already has the maximum of 10 attachments."
          : `You can add only ${availableSlots} more attachment${availableSlots === 1 ? "" : "s"} to this entry.`,
      files: [],
      totalSizeBytes: 0
    };
  }

  let totalSizeBytes = 0;

  for (
    const file of selectedFiles
  ) {
    const validation =
      validateJournalAttachmentFile(
        file
      );

    if (!validation.isValid) {
      return {
        isValid: false,
        message:
          `${file.name || "File"}: ${validation.message}`,
        files: [],
        totalSizeBytes: 0
      };
    }

    totalSizeBytes +=
      Number(file.size) || 0;
  }

  if (
    remainingStorageBytes !==
      null &&
    remainingStorageBytes !==
      undefined
  ) {
    const remainingBytes =
      Math.max(
        Number(
          remainingStorageBytes
        ) || 0,
        0
      );

    if (
      totalSizeBytes >
      remainingBytes
    ) {
      return {
        isValid: false,
        message:
          `These files need ${formatJournalFileSize(
            totalSizeBytes
          )}, but only ${formatJournalFileSize(
            remainingBytes
          )} of Journal storage remains.`,
        files: [],
        totalSizeBytes
      };
    }
  }

  return {
    isValid: true,
    message: "",
    files: selectedFiles,
    totalSizeBytes
  };
}

export function validateJournalAttachmentMetadata({
  caption = "",
  altText = ""
} = {}) {
  if (
    String(caption).trim().length >
    JOURNAL_ATTACHMENT_LIMITS
      .MAX_CAPTION_LENGTH
  ) {
    return {
      isValid: false,
      message:
        "Caption cannot exceed 500 characters."
    };
  }

  if (
    String(altText).trim().length >
    JOURNAL_ATTACHMENT_LIMITS
      .MAX_ALT_TEXT_LENGTH
  ) {
    return {
      isValid: false,
      message:
        "Alternative text cannot exceed 500 characters."
    };
  }

  return {
    isValid: true,
    message: ""
  };
}

function createClientAttachmentId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return (
      globalThis.crypto
        .randomUUID()
    );
  }

  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2)
  ].join("-");
}

export function createPendingJournalAttachment(
  file,
  attachmentOrder = 0
) {
  const attachmentType =
    getJournalAttachmentType(
      file
    );

  return {
    clientId:
      createClientAttachmentId(),

    file,
    previewUrl:
      URL.createObjectURL(file),

    attachmentType,
    originalFileName:
      file.name,

    mimeType:
      file.type,

    fileSizeBytes:
      file.size,

    formattedFileSize:
      formatJournalFileSize(
        file.size
      ),

    attachmentOrder,
    caption: "",
    altText: "",
    isCover: false,
    uploadProgress: 0,
    status: "queued"
  };
}

export function revokeJournalAttachmentPreview(
  attachment
) {
  if (
    attachment?.previewUrl
  ) {
    URL.revokeObjectURL(
      attachment.previewUrl
    );
  }
}

export function sortJournalAttachments(
  attachments = []
) {
  return [...attachments].sort(
    (first, second) =>
      Number(
        first?.attachmentOrder ??
        first?.attachment_order ??
        0
      ) -
      Number(
        second?.attachmentOrder ??
        second?.attachment_order ??
        0
      )
  );
}

export function isJournalAttachmentPreviewable(
  attachment
) {
  const attachmentType =
    getJournalAttachmentType(
      attachment
    );

  return [
    JOURNAL_ATTACHMENT_TYPES.IMAGE,
    JOURNAL_ATTACHMENT_TYPES.VIDEO,
    JOURNAL_ATTACHMENT_TYPES.AUDIO
  ].includes(attachmentType);
}