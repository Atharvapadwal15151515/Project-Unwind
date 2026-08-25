/*
|--------------------------------------------------------------------------
| Voice Transcript Status
|--------------------------------------------------------------------------
*/

export const VOICE_TRANSCRIPT_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
});

export const VOICE_TRANSCRIPT_STATUS_VALUES =
  Object.freeze(
    Object.values(
      VOICE_TRANSCRIPT_STATUS
    )
  );

/*
|--------------------------------------------------------------------------
| Supported Audio MIME Types
|--------------------------------------------------------------------------
*/

export const SUPPORTED_VOICE_MIME_TYPES =
  Object.freeze([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/flac"
  ]);

/*
|--------------------------------------------------------------------------
| Supported Audio Extensions
|--------------------------------------------------------------------------
*/

export const SUPPORTED_VOICE_EXTENSIONS =
  Object.freeze([
    "mp3",
    "wav",
    "webm",
    "ogg",
    "m4a",
    "mp4",
    "aac",
    "flac"
  ]);

/*
|--------------------------------------------------------------------------
| File Limits
|--------------------------------------------------------------------------
*/

export const MAX_VOICE_FILE_SIZE_BYTES =
  25 * 1024 * 1024;

export const MAX_VOICE_FILE_SIZE_MB =
  25;

export const MIN_VOICE_DURATION_SECONDS =
  1;

export const MAX_VOICE_DURATION_SECONDS =
  60 * 60;

/*
|--------------------------------------------------------------------------
| Transcript Limits
|--------------------------------------------------------------------------
*/

export const MAX_TRANSCRIPT_LENGTH =
  200000;

export const MAX_TRANSCRIPT_SEARCH_LENGTH =
  200;

export const MAX_TRANSCRIPT_LANGUAGE_LENGTH =
  20;

export const MAX_TRANSCRIPTION_PROVIDER_LENGTH =
  50;

export const MAX_TRANSCRIPTION_MODEL_LENGTH =
  100;

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export const DEFAULT_VOICE_PAGE =
  1;

export const DEFAULT_VOICE_LIMIT =
  20;

export const MAX_VOICE_LIMIT =
  100;

/*
|--------------------------------------------------------------------------
| Retry Limits
|--------------------------------------------------------------------------
*/

export const MAX_TRANSCRIPTION_RETRIES =
  10;

/*
|--------------------------------------------------------------------------
| Default Transcription Configuration
|--------------------------------------------------------------------------
|
| These are fallback values only.
|
| The actual provider and model can be overridden through
| environment variables or request data.
|
*/

export const DEFAULT_TRANSCRIPTION_PROVIDER =
  process.env
    .VOICE_TRANSCRIPTION_PROVIDER ||
  "groq";

export const DEFAULT_TRANSCRIPTION_MODEL =
  process.env
    .VOICE_TRANSCRIPTION_MODEL ||
  "whisper-large-v3-turbo";

export const DEFAULT_TRANSCRIPTION_LANGUAGE =
  process.env
    .VOICE_TRANSCRIPTION_LANGUAGE ||
  null;

/*
|--------------------------------------------------------------------------
| Supported Providers
|--------------------------------------------------------------------------
*/

export const TRANSCRIPTION_PROVIDER =
  Object.freeze({
    GROQ: "groq",
    OPENAI: "openai",
    GOOGLE: "google",
    AZURE: "azure"
  });

export const TRANSCRIPTION_PROVIDER_VALUES =
  Object.freeze(
    Object.values(
      TRANSCRIPTION_PROVIDER
    )
  );

/*
|--------------------------------------------------------------------------
| Provider Models
|--------------------------------------------------------------------------
*/

export const TRANSCRIPTION_MODEL =
  Object.freeze({
    GROQ_WHISPER_LARGE_V3:
      "whisper-large-v3",

    GROQ_WHISPER_LARGE_V3_TURBO:
      "whisper-large-v3-turbo",

    OPENAI_WHISPER_1:
      "whisper-1",

    OPENAI_GPT_4O_TRANSCRIBE:
      "gpt-4o-transcribe",

    OPENAI_GPT_4O_MINI_TRANSCRIBE:
      "gpt-4o-mini-transcribe"
  });

/*
|--------------------------------------------------------------------------
| Attachment Type
|--------------------------------------------------------------------------
*/

export const VOICE_ATTACHMENT_TYPE =
  "audio";

/*
|--------------------------------------------------------------------------
| Cloudinary Configuration
|--------------------------------------------------------------------------
*/

export const VOICE_CLOUDINARY_FOLDER =
  process.env
    .VOICE_CLOUDINARY_FOLDER ||
  "unwind/journal/voice";

export const VOICE_CLOUDINARY_RESOURCE_TYPE =
  "video";

/*
|--------------------------------------------------------------------------
| Processing Messages
|--------------------------------------------------------------------------
*/

export const VOICE_PROCESSING_MESSAGE =
  Object.freeze({
    PENDING:
      "Voice transcription is waiting to be processed.",

    PROCESSING:
      "Voice transcription is currently being processed.",

    COMPLETED:
      "Voice transcription completed successfully.",

    FAILED:
      "Voice transcription failed."
  });

/*
|--------------------------------------------------------------------------
| Common Error Messages
|--------------------------------------------------------------------------
*/

export const VOICE_ERROR_MESSAGE =
  Object.freeze({
    FILE_REQUIRED:
      "Voice recording file is required.",

    INVALID_FILE_TYPE:
      "The uploaded file must be a supported audio file.",

    FILE_TOO_LARGE:
      `Voice recording cannot exceed ${MAX_VOICE_FILE_SIZE_MB} MB.`,

    DURATION_TOO_SHORT:
      `Voice recording must be at least ${MIN_VOICE_DURATION_SECONDS} second long.`,

    DURATION_TOO_LONG:
      `Voice recording cannot exceed ${MAX_VOICE_DURATION_SECONDS} seconds.`,

    TRANSCRIPT_NOT_FOUND:
      "Voice transcript was not found.",

    ATTACHMENT_NOT_FOUND:
      "Voice attachment was not found.",

    ENTRY_NOT_FOUND:
      "Journal entry was not found.",

    INVALID_ATTACHMENT_TYPE:
      "The selected journal attachment is not an audio attachment.",

    ATTACHMENT_ALREADY_LINKED:
      "This audio attachment already has a voice transcript.",

    TRANSCRIPTION_IN_PROGRESS:
      "Voice transcription is already being processed.",

    TRANSCRIPTION_NOT_COMPLETED:
      "Voice transcription has not been completed.",

    TRANSCRIPTION_NOT_FAILED:
      "Only failed voice transcriptions can be retried.",

    RETRY_LIMIT_REACHED:
      "Maximum transcription retry limit has been reached.",

    TRANSCRIPTION_PROVIDER_UNAVAILABLE:
      "The selected transcription provider is unavailable.",

    TRANSCRIPTION_FAILED:
      "Voice transcription failed.",

    ORIGINAL_TRANSCRIPT_NOT_AVAILABLE:
      "Original transcript is not available.",

    TRANSCRIPT_REQUIRED:
      "Transcript text is required.",

    UNAUTHORIZED:
      "You are not authorized to access this voice transcript."
  });

/*
|--------------------------------------------------------------------------
| File Extension Mapping
|--------------------------------------------------------------------------
*/

export const VOICE_MIME_EXTENSION_MAP =
  Object.freeze({
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "aac",
    "audio/flac": "flac"
  });

/*
|--------------------------------------------------------------------------
| Allowed Cloudinary Formats
|--------------------------------------------------------------------------
*/

export const VOICE_CLOUDINARY_FORMATS =
  Object.freeze([
    "mp3",
    "wav",
    "webm",
    "ogg",
    "m4a",
    "mp4",
    "aac",
    "flac"
  ]);

/*
|--------------------------------------------------------------------------
| Environment Variable Names
|--------------------------------------------------------------------------
*/

export const VOICE_ENVIRONMENT_VARIABLES =
  Object.freeze({
    PROVIDER:
      "VOICE_TRANSCRIPTION_PROVIDER",

    MODEL:
      "VOICE_TRANSCRIPTION_MODEL",

    LANGUAGE:
      "VOICE_TRANSCRIPTION_LANGUAGE",

    GROQ_API_KEY:
      "GROQ_API_KEY",

    OPENAI_API_KEY:
      "OPENAI_API_KEY",

    GOOGLE_API_KEY:
      "GOOGLE_API_KEY",

    AZURE_API_KEY:
      "AZURE_SPEECH_KEY",

    AZURE_REGION:
      "AZURE_SPEECH_REGION"
  });

/*
|--------------------------------------------------------------------------
| Utility Checks
|--------------------------------------------------------------------------
*/

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
      .replace(/^\./, "");

  return SUPPORTED_VOICE_EXTENSIONS.includes(
    normalizedExtension
  );
}

export function isValidVoiceTranscriptStatus(
  status
) {
  return VOICE_TRANSCRIPT_STATUS_VALUES.includes(
    status
  );
}

export function isSupportedTranscriptionProvider(
  provider
) {
  if (
    typeof provider !== "string"
  ) {
    return false;
  }

  return TRANSCRIPTION_PROVIDER_VALUES.includes(
    provider
      .trim()
      .toLowerCase()
  );
}

export function getVoiceExtensionFromMimeType(
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

export function getVoiceProcessingMessage(
  status
) {
  switch (status) {
    case VOICE_TRANSCRIPT_STATUS
      .PENDING:
      return VOICE_PROCESSING_MESSAGE
        .PENDING;

    case VOICE_TRANSCRIPT_STATUS
      .PROCESSING:
      return VOICE_PROCESSING_MESSAGE
        .PROCESSING;

    case VOICE_TRANSCRIPT_STATUS
      .COMPLETED:
      return VOICE_PROCESSING_MESSAGE
        .COMPLETED;

    case VOICE_TRANSCRIPT_STATUS
      .FAILED:
      return VOICE_PROCESSING_MESSAGE
        .FAILED;

    default:
      return null;
  }
}