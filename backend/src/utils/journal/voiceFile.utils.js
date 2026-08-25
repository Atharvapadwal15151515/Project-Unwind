import path from "path";

import {
  SUPPORTED_VOICE_MIME_TYPES,
  SUPPORTED_VOICE_EXTENSIONS,
  MAX_VOICE_FILE_SIZE_BYTES,
  MIN_VOICE_DURATION_SECONDS,
  MAX_VOICE_DURATION_SECONDS,
  VOICE_MIME_EXTENSION_MAP
} from "./voice.constants.js";

/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

export function isValidVoiceFile(file) {
  return (
    !!file &&
    typeof file === "object"
  );
}

export function isSupportedVoiceMimeType(
  mimeType
) {
  if (
    typeof mimeType !== "string"
  ) {
    return false;
  }

  return SUPPORTED_VOICE_MIME_TYPES.includes(
    mimeType
      .trim()
      .toLowerCase()
  );
}

export function isSupportedVoiceExtension(
  extension
) {
  if (
    typeof extension !== "string"
  ) {
    return false;
  }

  const normalizedExtension =
    extension
      .trim()
      .toLowerCase()
      .replace(".", "");

  return SUPPORTED_VOICE_EXTENSIONS.includes(
    normalizedExtension
  );
}

export function isValidVoiceFileSize(
  size
) {
  if (
    typeof size !== "number"
  ) {
    return false;
  }

  return (
    size > 0 &&
    size <=
      MAX_VOICE_FILE_SIZE_BYTES
  );
}

export function isValidVoiceDuration(
  durationSeconds
) {
  if (
    typeof durationSeconds !==
    "number"
  ) {
    return false;
  }

  return (
    durationSeconds >=
      MIN_VOICE_DURATION_SECONDS &&
    durationSeconds <=
      MAX_VOICE_DURATION_SECONDS
  );
}

/*
|--------------------------------------------------------------------------
| Extension Helpers
|--------------------------------------------------------------------------
*/

export function getVoiceExtension(
  filename
) {
  if (
    typeof filename !== "string"
  ) {
    return null;
  }

  return path
    .extname(filename)
    .replace(".", "")
    .toLowerCase();
}

export function getExtensionFromMimeType(
  mimeType
) {
  if (
    typeof mimeType !== "string"
  ) {
    return null;
  }

  return (
    VOICE_MIME_EXTENSION_MAP[
      mimeType
        .trim()
        .toLowerCase()
    ] || null
  );
}

/*
|--------------------------------------------------------------------------
| File Name Helpers
|--------------------------------------------------------------------------
*/

export function getBaseFileName(
  filename
) {
  if (
    typeof filename !== "string"
  ) {
    return "";
  }

  return path.basename(
    filename,
    path.extname(filename)
  );
}

export function createSafeVoiceFileName(
  filename
) {
  const baseName =
    getBaseFileName(filename);

  return baseName
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/gi,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    );
}

/*
|--------------------------------------------------------------------------
| Duration Helpers
|--------------------------------------------------------------------------
*/

export function normalizeDuration(
  duration
) {
  if (
    duration === null ||
    duration === undefined
  ) {
    return 0;
  }

  const value =
    Number(duration);

  if (
    Number.isNaN(value)
  ) {
    return 0;
  }

  return Math.round(value);
}

export function formatDuration(
  durationSeconds
) {
  const seconds =
    normalizeDuration(
      durationSeconds
    );

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  }

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(
    2,
    "0"
  )}`;
}

/*
|--------------------------------------------------------------------------
| Size Helpers
|--------------------------------------------------------------------------
*/

export function bytesToMB(
  bytes
) {
  if (
    typeof bytes !== "number"
  ) {
    return 0;
  }

  return Number(
    (
      bytes /
      1024 /
      1024
    ).toFixed(2)
  );
}

/*
|--------------------------------------------------------------------------
| Transcript Helpers
|--------------------------------------------------------------------------
*/

export function calculateWordCount(
  text
) {
  if (
    typeof text !== "string"
  ) {
    return 0;
  }

  const trimmed =
    text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/)
    .length;
}

export function normalizeTranscript(
  transcript
) {
  if (
    typeof transcript !==
    "string"
  ) {
    return "";
  }

  return transcript
    .replace(/\r/g, "")
    .replace(/\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| Cloudinary Helpers
|--------------------------------------------------------------------------
*/

export function normalizeCloudinaryAudio(
  uploadResult = {}
) {
  return {
    publicId:
      uploadResult.public_id ??
      null,

    secureUrl:
      uploadResult.secure_url ??
      null,

    originalFilename:
      uploadResult.original_filename ??
      null,

    format:
      uploadResult.format ??
      null,

    bytes:
      uploadResult.bytes ?? 0,

    duration:
      normalizeDuration(
        uploadResult.duration
      ),

    resourceType:
      uploadResult.resource_type ??
      null
  };
}

/*
|--------------------------------------------------------------------------
| Complete Validation
|--------------------------------------------------------------------------
*/

export function validateVoiceFile(
  file
) {
  if (
    !isValidVoiceFile(file)
  ) {
    return {
      valid: false,
      message:
        "Voice file is required."
    };
  }

  if (
    !isSupportedVoiceMimeType(
      file.mimetype
    )
  ) {
    return {
      valid: false,
      message:
        "Unsupported audio file type."
    };
  }

  if (
    !isValidVoiceFileSize(
      file.size
    )
  ) {
    return {
      valid: false,
      message:
        "Voice recording exceeds the maximum allowed size."
    };
  }

  return {
    valid: true,
    message: null
  };
}

/*
|--------------------------------------------------------------------------
| Metadata Builder
|--------------------------------------------------------------------------
*/

export function buildVoiceMetadata(
  file
) {
  return {
    originalFileName:
      file.originalname,

    extension:
      getVoiceExtension(
        file.originalname
      ),

    mimeType:
      file.mimetype,

    sizeBytes:
      file.size,

    sizeMB:
      bytesToMB(
        file.size
      )
  };
}