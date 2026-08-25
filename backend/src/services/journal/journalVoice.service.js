import pool from "../../config/database.js";

import AppError from "../../utils/AppError.js";

import {
  createJournalVoiceTranscript,
  getOwnedJournalVoiceTranscriptById,
  getJournalVoiceTranscriptDetails,
  getJournalVoiceTranscriptByAttachmentId,
  getJournalEntryVoiceTranscripts,
  getUserJournalVoiceTranscripts,
  countUserJournalVoiceTranscripts,
  markJournalVoiceTranscriptProcessing,
  completeJournalVoiceTranscript,
  failJournalVoiceTranscript,
  retryJournalVoiceTranscript,
  updateJournalVoiceTranscriptText,
  restoreOriginalJournalVoiceTranscript,
  updateJournalVoiceTranscriptMetadata,
  searchJournalVoiceTranscripts,
  softDeleteJournalVoiceTranscript,
  restoreJournalVoiceTranscript,
  permanentlyDeleteJournalVoiceTranscript
} from "../../models/journal/journalVoice.model.js";

import {
  getActiveJournalAttachmentById,
  getDeletedJournalAttachmentById,
  softDeleteJournalAttachment,
  restoreJournalAttachment,
  permanentlyDeleteJournalAttachment
} from "../../models/journal/journalAttachment.model.js";

import {
  getJournalEntryByIdAndUserId
} from "../../models/journal/journalEntry.model.js";

import {
  transcribeAudio,
  VoiceTranscriptionError,
  getVoiceTranscriptionConfiguration,
  isVoiceTranscriptionConfigured
} from "../../utils/journal/voiceTranscription.js";

import {
  calculateWordCount
} from "../../utils/journal/voiceFile.utils.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const MAX_TRANSCRIPT_LENGTH =
  100000;

const MAX_RETRY_COUNT = 10;

const ALLOWED_TRANSCRIPT_STATUSES =
  new Set([
    "pending",
    "processing",
    "completed",
    "failed"
  ]);

/*
|--------------------------------------------------------------------------
| General Helpers
|--------------------------------------------------------------------------
*/

function normalizeOptionalString(
  value
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized ||
    null;
}

function normalizeRequiredString(
  value,
  fieldName
) {
  const normalized =
    normalizeOptionalString(
      value
    );

  if (!normalized) {
    throw new AppError(
      `${fieldName} is required`,
      400
    );
  }

  return normalized;
}

function normalizeBoolean(
  value,
  defaultValue = null
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return defaultValue;
}

function normalizePositiveInteger(
  value,
  defaultValue
) {
  const normalized =
    Number(value);

  if (
    !Number.isInteger(
      normalized
    ) ||
    normalized <= 0
  ) {
    return defaultValue;
  }

  return normalized;
}

function normalizeNonNegativeInteger(
  value,
  defaultValue = 0
) {
  const normalized =
    Number(value);

  if (
    !Number.isInteger(
      normalized
    ) ||
    normalized < 0
  ) {
    return defaultValue;
  }

  return normalized;
}

/*
|--------------------------------------------------------------------------
| Pagination Helpers
|--------------------------------------------------------------------------
*/

function normalizePagination(
  filters = {}
) {
  const requestedPage =
    normalizePositiveInteger(
      filters.page,
      DEFAULT_PAGE
    );

  const requestedLimit =
    normalizePositiveInteger(
      filters.limit,
      DEFAULT_LIMIT
    );

  const page =
    Math.max(
      requestedPage,
      1
    );

  const limit =
    Math.min(
      Math.max(
        requestedLimit,
        1
      ),
      MAX_LIMIT
    );

  const offset =
    (page - 1) *
    limit;

  return {
    page,
    limit,
    offset
  };
}

function buildPagination({
  page,
  limit,
  total
}) {
  const normalizedTotal =
    Number(total) || 0;

  return {
    page,
    limit,

    total:
      normalizedTotal,

    totalPages:
      normalizedTotal === 0
        ? 0
        : Math.ceil(
            normalizedTotal /
              limit
          ),

    hasNextPage:
      page * limit <
      normalizedTotal,

    hasPreviousPage:
      page > 1
  };
}

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

function normalizeDate(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new AppError(
      `${fieldName} must be a valid date`,
      400
    );
  }

  return date;
}

function normalizeDateRange(
  filters = {}
) {
  const dateFrom =
    normalizeDate(
      filters.dateFrom,
      "dateFrom"
    );

  const dateTo =
    normalizeDate(
      filters.dateTo,
      "dateTo"
    );

  if (
    dateFrom &&
    dateTo &&
    dateFrom.getTime() >
      dateTo.getTime()
  ) {
    throw new AppError(
      "dateFrom cannot be later than dateTo",
      400
    );
  }

  return {
    dateFrom,
    dateTo
  };
}

/*
|--------------------------------------------------------------------------
| Status Helpers
|--------------------------------------------------------------------------
*/

function normalizeTranscriptStatus(
  transcriptStatus
) {
  const normalizedStatus =
    normalizeOptionalString(
      transcriptStatus
    )?.toLowerCase();

  if (!normalizedStatus) {
    return null;
  }

  if (
    !ALLOWED_TRANSCRIPT_STATUSES.has(
      normalizedStatus
    )
  ) {
    throw new AppError(
      "Invalid voice transcript status",
      400
    );
  }

  return normalizedStatus;
}

/*
|--------------------------------------------------------------------------
| Transcript Helpers
|--------------------------------------------------------------------------
*/

function normalizeTranscriptText(
  transcript
) {
  const normalizedTranscript =
    normalizeRequiredString(
      transcript,
      "Transcript"
    );

  if (
    normalizedTranscript.length >
    MAX_TRANSCRIPT_LENGTH
  ) {
    throw new AppError(
      `Transcript cannot exceed ${MAX_TRANSCRIPT_LENGTH} characters`,
      400
    );
  }

  return normalizedTranscript;
}

function getTranscriptWordCount(
  transcript
) {
  if (
    typeof calculateWordCount ===
    "function"
  ) {
    return calculateWordCount(
      transcript
    );
  }

  const normalizedTranscript =
    normalizeOptionalString(
      transcript
    );

  if (!normalizedTranscript) {
    return 0;
  }

  return normalizedTranscript
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

/*
|--------------------------------------------------------------------------
| Error Helpers
|--------------------------------------------------------------------------
*/

function getSafeErrorMessage(
  error
) {
  if (
    error instanceof
    VoiceTranscriptionError
  ) {
    return (
      error.message ||
      "Voice transcription failed"
    );
  }

  return (
    error?.message ||
    "Voice transcription failed"
  );
}

function getErrorStatusCode(
  error
) {
  const statusCode =
    Number(
      error?.statusCode ||
      error?.status
    );

  if (
    Number.isInteger(
      statusCode
    ) &&
    statusCode >= 400 &&
    statusCode <= 599
  ) {
    return statusCode;
  }

  return 500;
}

/*
|--------------------------------------------------------------------------
| Ownership Helpers
|--------------------------------------------------------------------------
*/

async function requireJournalEntry(
  userId,
  entryId,
  client = null
) {
  const entry =
    await getJournalEntryByIdAndUserId(
      entryId,
      userId,
      {
        includeDeleted: false
      },
      client
    );

  if (!entry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return entry;
}

async function requireActiveAttachment(
  userId,
  attachmentId,
  client = null
) {
  const attachment =
    await getActiveJournalAttachmentById(
      attachmentId,
      userId,
      client
    );

  if (!attachment) {
    throw new AppError(
      "Journal attachment not found",
      404
    );
  }

  return attachment;
}

async function requireDeletedAttachment(
  userId,
  attachmentId,
  client = null
) {
  const attachment =
    await getDeletedJournalAttachmentById(
      attachmentId,
      userId,
      client
    );

  if (!attachment) {
    throw new AppError(
      "Deleted journal attachment not found",
      404
    );
  }

  return attachment;
}

async function requireActiveVoiceTranscript(
  userId,
  voiceTranscriptId,
  client = null
) {
  const voiceTranscript =
    await getOwnedJournalVoiceTranscriptById(
      voiceTranscriptId,
      userId,
      {
        includeDeleted: false
      },
      client
    );

  if (!voiceTranscript) {
    throw new AppError(
      "Voice transcript not found",
      404
    );
  }

  return voiceTranscript;
}

async function requireDeletedVoiceTranscript(
  userId,
  voiceTranscriptId,
  client = null
) {
  const voiceTranscript =
    await getOwnedJournalVoiceTranscriptById(
      voiceTranscriptId,
      userId,
      {
        includeDeleted: true
      },
      client
    );

  if (
    !voiceTranscript ||
    voiceTranscript.is_deleted !==
      true
  ) {
    throw new AppError(
      "Deleted voice transcript not found",
      404
    );
  }

  return voiceTranscript;
}

/*
|--------------------------------------------------------------------------
| Attachment Validation
|--------------------------------------------------------------------------
*/

function ensureAudioAttachment(
  attachment
) {
  if (
    attachment.attachment_type !==
    "audio"
  ) {
    throw new AppError(
      "Voice transcription is only available for audio attachments",
      400
    );
  }

  if (
    attachment.processing_status ===
    "failed"
  ) {
    throw new AppError(
      "Failed audio attachments cannot be transcribed",
      400
    );
  }

  if (
    attachment.is_deleted ===
    true
  ) {
    throw new AppError(
      "Deleted audio attachments cannot be transcribed",
      400
    );
  }

  return attachment;
}

function ensureAttachmentBelongsToEntry(
  attachment,
  entryId
) {
  if (
    attachment.entry_id !==
    entryId
  ) {
    throw new AppError(
      "The audio attachment does not belong to this journal entry",
      400
    );
  }
}

/*
|--------------------------------------------------------------------------
| Read One Voice Transcript
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscript(
  userId,
  voiceTranscriptId
) {
  return requireActiveVoiceTranscript(
    userId,
    voiceTranscriptId
  );
}

/*
|--------------------------------------------------------------------------
| Read Voice Transcript Details
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptDetails(
  userId,
  voiceTranscriptId
) {
  const transcript =
    await getJournalVoiceTranscriptDetails(
      voiceTranscriptId,
      userId
    );

  if (!transcript) {
    throw new AppError(
      "Voice transcript not found",
      404
    );
  }

  return transcript;
}

/*
|--------------------------------------------------------------------------
| Read Transcript By Attachment
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptByAttachment(
  userId,
  attachmentId,
  options = {}
) {
  await requireActiveAttachment(
    userId,
    attachmentId
  );

  const transcript =
    await getJournalVoiceTranscriptByAttachmentId(
      attachmentId,
      userId,
      {
        includeDeleted:
          options.includeDeleted ===
          true
      }
    );

  if (!transcript) {
    throw new AppError(
      "No voice transcript exists for this attachment",
      404
    );
  }

  return transcript;
}

/*
|--------------------------------------------------------------------------
| Read Entry Voice Transcripts
|--------------------------------------------------------------------------
*/

export async function getEntryVoiceTranscripts(
  userId,
  entryId,
  filters = {}
) {
  await requireJournalEntry(
    userId,
    entryId
  );

  const transcriptStatus =
    normalizeTranscriptStatus(
      filters.transcriptStatus
    );

  return getJournalEntryVoiceTranscripts(
    entryId,
    userId,
    {
      transcriptStatus,

      includeDeleted:
        filters.includeDeleted ===
        true
    }
  );
}

/*
|--------------------------------------------------------------------------
| Read User Voice Transcripts
|--------------------------------------------------------------------------
*/

export async function getUserVoiceTranscripts(
  userId,
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(
    filters
  );

  const {
    dateFrom,
    dateTo
  } = normalizeDateRange(
    filters
  );

  const normalizedFilters = {
    entryId:
      normalizeOptionalString(
        filters.entryId
      ),

    attachmentId:
      normalizeOptionalString(
        filters.attachmentId
      ),

    transcriptStatus:
      normalizeTranscriptStatus(
        filters.transcriptStatus
      ),

    transcriptLanguage:
      normalizeOptionalString(
        filters.transcriptLanguage
      ),

    transcriptionProvider:
      normalizeOptionalString(
        filters.transcriptionProvider
      ),

    isTranscriptEdited:
      normalizeBoolean(
        filters.isTranscriptEdited,
        null
      ),

    isDeleted:
      normalizeBoolean(
        filters.isDeleted,
        false
      ),

    dateFrom,
    dateTo,

    search:
      normalizeOptionalString(
        filters.search
      ),

    limit,
    offset
  };

  const [
    transcripts,
    total
  ] = await Promise.all([
    getUserJournalVoiceTranscripts(
      userId,
      normalizedFilters
    ),

    countUserJournalVoiceTranscripts(
      userId,
      {
        entryId:
          normalizedFilters.entryId,

        attachmentId:
          normalizedFilters
            .attachmentId,

        transcriptStatus:
          normalizedFilters
            .transcriptStatus,

        transcriptLanguage:
          normalizedFilters
            .transcriptLanguage,

        transcriptionProvider:
          normalizedFilters
            .transcriptionProvider,

        isTranscriptEdited:
          normalizedFilters
            .isTranscriptEdited,

        isDeleted:
          normalizedFilters
            .isDeleted,

        dateFrom:
          normalizedFilters.dateFrom,

        dateTo:
          normalizedFilters.dateTo,

        search:
          normalizedFilters.search
      }
    )
  ]);

  return {
    transcripts,

    pagination:
      buildPagination({
        page,
        limit,
        total
      })
  };
}

/*
|--------------------------------------------------------------------------
| Search Completed Voice Transcripts
|--------------------------------------------------------------------------
*/

export async function searchVoiceTranscripts(
  userId,
  searchQuery,
  filters = {}
) {
  const normalizedSearchQuery =
    normalizeRequiredString(
      searchQuery,
      "Search query"
    );

  const {
    page,
    limit,
    offset
  } = normalizePagination(
    filters
  );

  const transcripts =
    await searchJournalVoiceTranscripts(
      userId,
      normalizedSearchQuery,
      {
        entryId:
          normalizeOptionalString(
            filters.entryId
          ),

        transcriptLanguage:
          normalizeOptionalString(
            filters.transcriptLanguage
          ),

        limit,
        offset
      }
    );

  return {
    transcripts,

    pagination: {
      page,
      limit,

      resultCount:
        transcripts.length,

      hasNextPage:
        transcripts.length ===
        limit,

      hasPreviousPage:
        page > 1
    },

    searchQuery:
      normalizedSearchQuery
  };
}

/*
|--------------------------------------------------------------------------
| Transcription Configuration
|--------------------------------------------------------------------------
*/

export function getTranscriptionConfiguration() {
  return getVoiceTranscriptionConfiguration();
}

export function getTranscriptionAvailability() {
  return {
    configured:
      isVoiceTranscriptionConfigured(),

    configuration:
      getVoiceTranscriptionConfiguration()
  };
}
/*
|--------------------------------------------------------------------------
| Remote Audio Download Helpers
|--------------------------------------------------------------------------
*/

function getAudioFileExtension(
  attachment
) {
  const fileExtension =
    normalizeOptionalString(
      attachment?.file_extension
    );

  if (fileExtension) {
    return fileExtension.startsWith(
      "."
    )
      ? fileExtension
      : `.${fileExtension}`;
  }

  const fileFormat =
    normalizeOptionalString(
      attachment?.file_format
    );

  if (fileFormat) {
    return fileFormat.startsWith(
      "."
    )
      ? fileFormat
      : `.${fileFormat}`;
  }

  const mimeType =
    normalizeOptionalString(
      attachment?.mime_type
    )?.toLowerCase();

  const extensionByMimeType = {
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/aac": ".aac",
    "audio/flac": ".flac"
  };

  return (
    extensionByMimeType[
      mimeType
    ] ||
    ".audio"
  );
}

function getAttachmentAudioUrl(
  attachment
) {
  const audioUrl =
    normalizeOptionalString(
      attachment?.file_url
    );

  if (!audioUrl) {
    throw new AppError(
      "The audio attachment does not contain a valid file URL",
      400
    );
  }

  try {
    const parsedUrl =
      new URL(audioUrl);

    if (
      parsedUrl.protocol !==
        "https:" &&
      parsedUrl.protocol !==
        "http:"
    ) {
      throw new Error(
        "Unsupported protocol"
      );
    }
  } catch {
    throw new AppError(
      "The audio attachment file URL is invalid",
      400
    );
  }

  return audioUrl;
}

async function downloadAudioToTemporaryFile(
  attachment
) {
  const audioUrl =
    getAttachmentAudioUrl(
      attachment
    );

  const [
    fs,
    os,
    path,
    crypto
  ] = await Promise.all([
    import(
      "node:fs/promises"
    ),
    import("node:os"),
    import("node:path"),
    import("node:crypto")
  ]);

  const extension =
    getAudioFileExtension(
      attachment
    );

  const temporaryFileName =
    `unwind-voice-${crypto.randomUUID()}${extension}`;

  const temporaryFilePath =
    path.join(
      os.tmpdir(),
      temporaryFileName
    );

  let response;

  try {
    response =
      await fetch(
        audioUrl
      );
  } catch (error) {
    throw new AppError(
      error?.message ||
        "Failed to download the audio attachment",
      502
    );
  }

  if (!response.ok) {
    throw new AppError(
      `Failed to download the audio attachment. Storage returned status ${response.status}`,
      502
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const audioBuffer =
    Buffer.from(
      arrayBuffer
    );

  if (
    audioBuffer.length === 0
  ) {
    throw new AppError(
      "The downloaded audio file is empty",
      400
    );
  }

  await fs.writeFile(
    temporaryFilePath,
    audioBuffer
  );

  return temporaryFilePath;
}

async function removeTemporaryAudioFile(
  temporaryFilePath
) {
  if (!temporaryFilePath) {
    return;
  }

  try {
    const fs =
      await import(
        "node:fs/promises"
      );

    await fs.unlink(
      temporaryFilePath
    );
  } catch {
    // Cleanup errors must not replace the
    // actual transcription result or error.
  }
}

/*
|--------------------------------------------------------------------------
| Transcription Options
|--------------------------------------------------------------------------
*/

function normalizeTranscriptionOptions(
  options = {}
) {
  const configuration =
    getVoiceTranscriptionConfiguration();

  const provider =
    normalizeOptionalString(
      options.provider
    ) ||
    configuration.provider;

  const model =
    normalizeOptionalString(
      options.model
    ) ||
    configuration.model;

  const language =
    normalizeOptionalString(
      options.language
    ) ||
    configuration.language ||
    null;

  const prompt =
    normalizeOptionalString(
      options.prompt
    );

  const temperatureValue =
    options.temperature ===
      undefined
      ? 0
      : Number(
          options.temperature
        );

  if (
    !Number.isFinite(
      temperatureValue
    ) ||
    temperatureValue < 0 ||
    temperatureValue > 1
  ) {
    throw new AppError(
      "Transcription temperature must be between 0 and 1",
      400
    );
  }

  const retries =
    normalizeNonNegativeInteger(
      options.retries,
      2
    );

  if (
    retries >
    MAX_RETRY_COUNT
  ) {
    throw new AppError(
      `Transcription retries cannot exceed ${MAX_RETRY_COUNT}`,
      400
    );
  }

  return {
    provider,
    model,
    language,
    prompt,

    temperature:
      temperatureValue,

    retries,

    includeWordTimestamps:
      normalizeBoolean(
        options.includeWordTimestamps,
        false
      )
  };
}

/*
|--------------------------------------------------------------------------
| Create Voice Transcript Record
|--------------------------------------------------------------------------
*/

export async function createVoiceTranscript(
  userId,
  entryId,
  attachmentId,
  options = {}
) {
  await requireJournalEntry(
    userId,
    entryId
  );

  const attachment =
    await requireActiveAttachment(
      userId,
      attachmentId
    );

  ensureAudioAttachment(
    attachment
  );

  ensureAttachmentBelongsToEntry(
    attachment,
    entryId
  );

  const existingTranscript =
    await getJournalVoiceTranscriptByAttachmentId(
      attachmentId,
      userId,
      {
        includeDeleted: true
      }
    );

  if (existingTranscript) {
    if (
      existingTranscript.is_deleted
    ) {
      throw new AppError(
        "A deleted voice transcript already exists for this audio attachment. Restore it instead of creating another one",
        409
      );
    }

    throw new AppError(
      "A voice transcript already exists for this audio attachment",
      409
    );
  }

  if (
    !isVoiceTranscriptionConfigured()
  ) {
    throw new AppError(
      "Voice transcription is not configured on the server",
      503
    );
  }

  const transcriptionOptions =
    normalizeTranscriptionOptions(
      options
    );

  const voiceTranscript =
    await createJournalVoiceTranscript({
      userId,
      entryId,
      attachmentId,

      transcript:
        null,

      originalTranscript:
        null,

      transcriptStatus:
        "pending",

      transcriptLanguage:
        transcriptionOptions
          .language,

      detectedLanguage:
        null,

      transcriptionProvider:
        transcriptionOptions
          .provider,

      transcriptionModel:
        transcriptionOptions
          .model,

      transcriptionConfidence:
        null,

      transcriptionError:
        null,

      transcriptionStartedAt:
        null,

      transcriptionCompletedAt:
        null,

      isTranscriptEdited:
        false,

      transcriptEditedAt:
        null,

      transcriptWordCount:
        0,

      retryCount:
        0,

      lastRetryAt:
        null
    });

  if (!voiceTranscript) {
    throw new AppError(
      "Failed to create the voice transcript record",
      500
    );
  }

  const shouldTranscribeImmediately =
    normalizeBoolean(
      options.transcribeImmediately,
      true
    );

  if (
    !shouldTranscribeImmediately
  ) {
    return voiceTranscript;
  }

  return processVoiceTranscription(
    userId,
    voiceTranscript
      .voice_transcript_id,
    transcriptionOptions
  );
}

/*
|--------------------------------------------------------------------------
| Process Voice Transcription
|--------------------------------------------------------------------------
*/

export async function processVoiceTranscription(
  userId,
  voiceTranscriptId,
  options = {}
) {
  const voiceTranscript =
    await requireActiveVoiceTranscript(
      userId,
      voiceTranscriptId
    );

  if (
    voiceTranscript.transcript_status ===
    "processing"
  ) {
    throw new AppError(
      "This voice transcript is already being processed",
      409
    );
  }

  const details =
    await getJournalVoiceTranscriptDetails(
      voiceTranscriptId,
      userId
    );

  if (
    !details ||
    !details.attachment
  ) {
    throw new AppError(
      "The audio attachment for this voice transcript was not found",
      404
    );
  }

  const attachment =
    details.attachment;

  ensureAudioAttachment(
    attachment
  );

  ensureAttachmentBelongsToEntry(
    attachment,
    voiceTranscript.entry_id
  );

  if (
    !isVoiceTranscriptionConfigured()
  ) {
    throw new AppError(
      "Voice transcription is not configured on the server",
      503
    );
  }

  const transcriptionOptions =
    normalizeTranscriptionOptions({
      provider:
        options.provider ||
        voiceTranscript
          .transcription_provider,

      model:
        options.model ||
        voiceTranscript
          .transcription_model,

      language:
        options.language ||
        voiceTranscript
          .transcript_language,

      prompt:
        options.prompt,

      temperature:
        options.temperature,

      retries:
        options.retries,

      includeWordTimestamps:
        options.includeWordTimestamps
    });

  const processingTranscript =
    await markJournalVoiceTranscriptProcessing(
      voiceTranscriptId,
      userId,
      {
        transcriptionProvider:
          transcriptionOptions
            .provider,

        transcriptionModel:
          transcriptionOptions
            .model,

        transcriptLanguage:
          transcriptionOptions
            .language
      }
    );

  if (!processingTranscript) {
    throw new AppError(
      "Failed to mark the voice transcript as processing",
      500
    );
  }

  let temporaryFilePath =
    null;

  try {
    temporaryFilePath =
      await downloadAudioToTemporaryFile(
        attachment
      );

    const transcriptionResult =
      await transcribeAudio({
        audioPath:
          temporaryFilePath,

        provider:
          transcriptionOptions
            .provider,

        model:
          transcriptionOptions
            .model,

        language:
          transcriptionOptions
            .language,

        prompt:
          transcriptionOptions
            .prompt,

        temperature:
          transcriptionOptions
            .temperature,

        includeWordTimestamps:
          transcriptionOptions
            .includeWordTimestamps,

        retries:
          transcriptionOptions
            .retries
      });

    const transcript =
      normalizeTranscriptText(
        transcriptionResult
          .transcript
      );

    const transcriptWordCount =
      getTranscriptWordCount(
        transcript
      );

    const completedTranscript =
      await completeJournalVoiceTranscript(
        voiceTranscriptId,
        userId,
        {
          transcript,

          transcriptWordCount,

          transcriptLanguage:
            transcriptionResult
              .requestedLanguage ||
            transcriptionOptions
              .language,

          detectedLanguage:
            transcriptionResult
              .language ||
            null,

          transcriptionProvider:
            transcriptionResult
              .provider ||
            transcriptionOptions
              .provider,

          transcriptionModel:
            transcriptionResult
              .model ||
            transcriptionOptions
              .model,

          transcriptionConfidence:
            transcriptionResult
              .confidence ??
            null
        }
      );

    if (!completedTranscript) {
      throw new AppError(
        "The transcript was generated but could not be saved",
        500
      );
    }

    return {
      transcript:
        completedTranscript,

      transcription: {
        provider:
          transcriptionResult
            .provider,

        model:
          transcriptionResult
            .model,

        language:
          transcriptionResult
            .language,

        requestedLanguage:
          transcriptionResult
            .requestedLanguage,

        durationSeconds:
          transcriptionResult
            .durationSeconds,

        confidence:
          transcriptionResult
            .confidence,

        attemptCount:
          transcriptionResult
            .attemptCount,

        requestId:
          transcriptionResult
            .requestId,

        segments:
          transcriptionResult
            .segments,

        words:
          transcriptionResult
            .words,

        transcribedAt:
          transcriptionResult
            .transcribedAt
      }
    };
  } catch (error) {
    const transcriptionError =
      getSafeErrorMessage(
        error
      );

    await failJournalVoiceTranscript(
      voiceTranscriptId,
      userId,
      {
        transcriptionError,

        transcriptionProvider:
          transcriptionOptions
            .provider,

        transcriptionModel:
          transcriptionOptions
            .model
      }
    );

    if (
      error instanceof
      AppError
    ) {
      throw error;
    }

    throw new AppError(
      transcriptionError,
      getErrorStatusCode(
        error
      )
    );
  } finally {
    await removeTemporaryAudioFile(
      temporaryFilePath
    );
  }
}

/*
|--------------------------------------------------------------------------
| Create Transcript Without Immediate Processing
|--------------------------------------------------------------------------
*/

export async function createPendingVoiceTranscript(
  userId,
  entryId,
  attachmentId,
  options = {}
) {
  return createVoiceTranscript(
    userId,
    entryId,
    attachmentId,
    {
      ...options,

      transcribeImmediately:
        false
    }
  );
}

/*
|--------------------------------------------------------------------------
| Create And Immediately Transcribe
|--------------------------------------------------------------------------
*/

export async function createAndTranscribeVoiceJournal(
  userId,
  entryId,
  attachmentId,
  options = {}
) {
  return createVoiceTranscript(
    userId,
    entryId,
    attachmentId,
    {
      ...options,

      transcribeImmediately:
        true
    }
  );
}
/*
|--------------------------------------------------------------------------
| Retry Validation
|--------------------------------------------------------------------------
*/

function ensureTranscriptCanBeRetried(
  voiceTranscript
) {
  if (
    voiceTranscript.transcript_status ===
    "processing"
  ) {
    throw new AppError(
      "A transcription process is already running",
      409
    );
  }

  if (
    voiceTranscript.transcript_status !==
      "failed" &&
    voiceTranscript.transcript_status !==
      "completed"
  ) {
    throw new AppError(
      "Only failed or completed transcripts can be retried",
      400
    );
  }

  const retryCount =
    normalizeNonNegativeInteger(
      voiceTranscript.retry_count,
      0
    );

  if (
    retryCount >=
    MAX_RETRY_COUNT
  ) {
    throw new AppError(
      "Maximum transcription retry limit has been reached",
      429
    );
  }
}

/*
|--------------------------------------------------------------------------
| Retry Voice Transcription
|--------------------------------------------------------------------------
*/

export async function retryVoiceTranscription(
  userId,
  voiceTranscriptId,
  options = {}
) {
  const voiceTranscript =
    await requireActiveVoiceTranscript(
      userId,
      voiceTranscriptId
    );

  ensureTranscriptCanBeRetried(
    voiceTranscript
  );

  const preparedTranscript =
    await retryJournalVoiceTranscript(
      voiceTranscriptId,
      userId
    );

  if (!preparedTranscript) {
    throw new AppError(
      "Unable to retry this voice transcript",
      409
    );
  }

  return processVoiceTranscription(
    userId,
    voiceTranscriptId,
    {
      provider:
        options.provider ||
        preparedTranscript
          .transcription_provider,

      model:
        options.model ||
        preparedTranscript
          .transcription_model,

      language:
        options.language ||
        preparedTranscript
          .transcript_language,

      prompt:
        options.prompt,

      temperature:
        options.temperature,

      retries:
        options.retries,

      includeWordTimestamps:
        options.includeWordTimestamps
    }
  );
}

/*
|--------------------------------------------------------------------------
| Transcript Edit Validation
|--------------------------------------------------------------------------
*/

function ensureTranscriptCanBeEdited(
  voiceTranscript
) {
  if (
    voiceTranscript.transcript_status ===
    "processing"
  ) {
    throw new AppError(
      "A transcript cannot be edited while transcription is processing",
      409
    );
  }

  if (
    voiceTranscript.transcript_status !==
    "completed"
  ) {
    throw new AppError(
      "Only completed transcripts can be edited",
      400
    );
  }
}

/*
|--------------------------------------------------------------------------
| Update Transcript Text
|--------------------------------------------------------------------------
*/

export async function updateVoiceTranscriptText(
  userId,
  voiceTranscriptId,
  transcript
) {
  const voiceTranscript =
    await requireActiveVoiceTranscript(
      userId,
      voiceTranscriptId
    );

  ensureTranscriptCanBeEdited(
    voiceTranscript
  );

  const normalizedTranscript =
    normalizeTranscriptText(
      transcript
    );

  const transcriptWordCount =
    getTranscriptWordCount(
      normalizedTranscript
    );

  const updatedTranscript =
    await updateJournalVoiceTranscriptText(
      voiceTranscriptId,
      userId,
      {
        transcript:
          normalizedTranscript,

        transcriptWordCount
      }
    );

  if (!updatedTranscript) {
    throw new AppError(
      "Failed to update the voice transcript",
      500
    );
  }

  return updatedTranscript;
}

/*
|--------------------------------------------------------------------------
| Restore Original Transcript Validation
|--------------------------------------------------------------------------
*/

function ensureOriginalTranscriptExists(
  voiceTranscript
) {
  const originalTranscript =
    normalizeOptionalString(
      voiceTranscript
        .original_transcript
    );

  if (!originalTranscript) {
    throw new AppError(
      "The original generated transcript is not available",
      400
    );
  }

  return originalTranscript;
}

/*
|--------------------------------------------------------------------------
| Restore Original Transcript
|--------------------------------------------------------------------------
*/

export async function restoreOriginalVoiceTranscript(
  userId,
  voiceTranscriptId
) {
  const voiceTranscript =
    await requireActiveVoiceTranscript(
      userId,
      voiceTranscriptId
    );

  if (
    voiceTranscript.transcript_status ===
    "processing"
  ) {
    throw new AppError(
      "The original transcript cannot be restored while transcription is processing",
      409
    );
  }

  ensureOriginalTranscriptExists(
    voiceTranscript
  );

  const restoredTranscript =
    await restoreOriginalJournalVoiceTranscript(
      voiceTranscriptId,
      userId
    );

  if (!restoredTranscript) {
    throw new AppError(
      "Failed to restore the original voice transcript",
      500
    );
  }

  return restoredTranscript;
}

/*
|--------------------------------------------------------------------------
| Confidence Validation
|--------------------------------------------------------------------------
*/

function normalizeTranscriptionConfidence(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value === null ||
    value === ""
  ) {
    return null;
  }

  const confidence =
    Number(value);

  if (
    !Number.isFinite(
      confidence
    ) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new AppError(
      "Transcription confidence must be between 0 and 1",
      400
    );
  }

  return confidence;
}

/*
|--------------------------------------------------------------------------
| Metadata Normalization
|--------------------------------------------------------------------------
*/

function normalizeVoiceTranscriptMetadata(
  metadata = {}
) {
  const normalizedMetadata = {};

  if (
    metadata.transcriptLanguage !==
    undefined
  ) {
    normalizedMetadata
      .transcriptLanguage =
        normalizeOptionalString(
          metadata
            .transcriptLanguage
        );
  }

  if (
    metadata.detectedLanguage !==
    undefined
  ) {
    normalizedMetadata
      .detectedLanguage =
        normalizeOptionalString(
          metadata
            .detectedLanguage
        );
  }

  if (
    metadata.transcriptionProvider !==
    undefined
  ) {
    normalizedMetadata
      .transcriptionProvider =
        normalizeOptionalString(
          metadata
            .transcriptionProvider
        );
  }

  if (
    metadata.transcriptionModel !==
    undefined
  ) {
    normalizedMetadata
      .transcriptionModel =
        normalizeOptionalString(
          metadata
            .transcriptionModel
        );
  }

  if (
    metadata.transcriptionConfidence !==
    undefined
  ) {
    normalizedMetadata
      .transcriptionConfidence =
        normalizeTranscriptionConfidence(
          metadata
            .transcriptionConfidence
        );
  }

  return normalizedMetadata;
}

/*
|--------------------------------------------------------------------------
| Update Transcript Metadata
|--------------------------------------------------------------------------
*/

export async function updateVoiceTranscriptMetadata(
  userId,
  voiceTranscriptId,
  metadata = {}
) {
  const voiceTranscript =
    await requireActiveVoiceTranscript(
      userId,
      voiceTranscriptId
    );

  if (
    voiceTranscript.transcript_status ===
    "processing"
  ) {
    throw new AppError(
      "Transcript metadata cannot be updated while transcription is processing",
      409
    );
  }

  const normalizedMetadata =
    normalizeVoiceTranscriptMetadata(
      metadata
    );

  const hasMetadataUpdate =
    Object.keys(
      normalizedMetadata
    ).length > 0;

  if (!hasMetadataUpdate) {
    throw new AppError(
      "At least one transcript metadata field is required",
      400
    );
  }

  const updatedTranscript =
    await updateJournalVoiceTranscriptMetadata(
      voiceTranscriptId,
      userId,
      normalizedMetadata
    );

  if (!updatedTranscript) {
    throw new AppError(
      "Failed to update voice transcript metadata",
      500
    );
  }

  return updatedTranscript;
}

/*
|--------------------------------------------------------------------------
| Transcript Processing Status
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptStatus(
  userId,
  voiceTranscriptId
) {
  const voiceTranscript =
    await requireActiveVoiceTranscript(
      userId,
      voiceTranscriptId
    );

  return {
    voiceTranscriptId:
      voiceTranscript
        .voice_transcript_id,

    entryId:
      voiceTranscript
        .entry_id,

    attachmentId:
      voiceTranscript
        .attachment_id,

    transcriptStatus:
      voiceTranscript
        .transcript_status,

    transcriptionError:
      voiceTranscript
        .transcription_error,

    transcriptionProvider:
      voiceTranscript
        .transcription_provider,

    transcriptionModel:
      voiceTranscript
        .transcription_model,

    transcriptLanguage:
      voiceTranscript
        .transcript_language,

    detectedLanguage:
      voiceTranscript
        .detected_language,

    transcriptionConfidence:
      voiceTranscript
        .transcription_confidence,

    retryCount:
      voiceTranscript
        .retry_count,

    transcriptionStartedAt:
      voiceTranscript
        .transcription_started_at,

    transcriptionCompletedAt:
      voiceTranscript
        .transcription_completed_at,

    lastRetryAt:
      voiceTranscript
        .last_retry_at,

    isProcessing:
      voiceTranscript
        .transcript_status ===
      "processing",

    isCompleted:
      voiceTranscript
        .transcript_status ===
      "completed",

    hasFailed:
      voiceTranscript
        .transcript_status ===
      "failed",

    canRetry:
      (
        voiceTranscript
          .transcript_status ===
          "failed" ||
        voiceTranscript
          .transcript_status ===
          "completed"
      ) &&
      normalizeNonNegativeInteger(
        voiceTranscript
          .retry_count,
        0
      ) <
        MAX_RETRY_COUNT,

    canEdit:
      voiceTranscript
        .transcript_status ===
      "completed",

    isTranscriptEdited:
      voiceTranscript
        .is_transcript_edited,

    transcriptEditedAt:
      voiceTranscript
        .transcript_edited_at,

    updatedAt:
      voiceTranscript
        .updated_at
  };
}
/*
|--------------------------------------------------------------------------
| Database Transaction Helper
|--------------------------------------------------------------------------
*/

async function executeTransaction(
  operation
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const result =
      await operation(
        client
      );

    await client.query(
      "COMMIT"
    );

    return result;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Soft Delete Voice Transcript
|--------------------------------------------------------------------------
*/

export async function deleteVoiceTranscript(
  userId,
  voiceTranscriptId,
  options = {}
) {
  const deleteAttachment =
    normalizeBoolean(
      options.deleteAttachment,
      false
    );

  return executeTransaction(
    async (client) => {
      const voiceTranscript =
        await requireActiveVoiceTranscript(
          userId,
          voiceTranscriptId,
          client
        );

      if (
        voiceTranscript
          .transcript_status ===
        "processing"
      ) {
        throw new AppError(
          "A processing voice transcript cannot be deleted",
          409
        );
      }

      const deletedTranscript =
        await softDeleteJournalVoiceTranscript(
          voiceTranscriptId,
          userId,
          client
        );

      if (!deletedTranscript) {
        throw new AppError(
          "Failed to delete the voice transcript",
          500
        );
      }

      let deletedAttachment =
        null;

      if (deleteAttachment) {
        const attachment =
          await requireActiveAttachment(
            userId,
            voiceTranscript
              .attachment_id,
            client
          );

        deletedAttachment =
          await softDeleteJournalAttachment(
            attachment.attachment_id,
            userId,
            client
          );

        if (!deletedAttachment) {
          throw new AppError(
            "Failed to delete the related audio attachment",
            500
          );
        }
      }

      return {
        transcript:
          deletedTranscript,

        attachment:
          deletedAttachment
      };
    }
  );
}

/*
|--------------------------------------------------------------------------
| Soft Delete Transcript And Audio Attachment
|--------------------------------------------------------------------------
*/

export async function deleteVoiceJournalAudio(
  userId,
  voiceTranscriptId
) {
  return deleteVoiceTranscript(
    userId,
    voiceTranscriptId,
    {
      deleteAttachment:
        true
    }
  );
}

/*
|--------------------------------------------------------------------------
| Restore Voice Transcript
|--------------------------------------------------------------------------
*/

export async function restoreVoiceTranscript(
  userId,
  voiceTranscriptId,
  options = {}
) {
  const restoreAttachment =
    normalizeBoolean(
      options.restoreAttachment,
      false
    );

  return executeTransaction(
    async (client) => {
      const voiceTranscript =
        await requireDeletedVoiceTranscript(
          userId,
          voiceTranscriptId,
          client
        );

      let restoredAttachment =
        null;

      if (restoreAttachment) {
        const deletedAttachment =
          await requireDeletedAttachment(
            userId,
            voiceTranscript
              .attachment_id,
            client
          );

        restoredAttachment =
          await restoreJournalAttachment(
            deletedAttachment
              .attachment_id,
            userId,
            client
          );

        if (!restoredAttachment) {
          throw new AppError(
            "Failed to restore the related audio attachment",
            500
          );
        }
      } else {
        const activeAttachment =
          await requireActiveAttachment(
            userId,
            voiceTranscript
              .attachment_id,
            client
          );

        ensureAudioAttachment(
          activeAttachment
        );
      }

      const restoredTranscript =
        await restoreJournalVoiceTranscript(
          voiceTranscriptId,
          userId,
          client
        );

      if (!restoredTranscript) {
        throw new AppError(
          "Failed to restore the voice transcript",
          500
        );
      }

      return {
        transcript:
          restoredTranscript,

        attachment:
          restoredAttachment
      };
    }
  );
}

/*
|--------------------------------------------------------------------------
| Restore Transcript And Audio Attachment
|--------------------------------------------------------------------------
*/

export async function restoreVoiceJournalAudio(
  userId,
  voiceTranscriptId
) {
  return restoreVoiceTranscript(
    userId,
    voiceTranscriptId,
    {
      restoreAttachment:
        true
    }
  );
}

/*
|--------------------------------------------------------------------------
| Permanent Delete Validation
|--------------------------------------------------------------------------
*/

function ensureTranscriptCanBePermanentlyDeleted(
  voiceTranscript
) {
  if (
    voiceTranscript
      .transcript_status ===
    "processing"
  ) {
    throw new AppError(
      "A processing voice transcript cannot be permanently deleted",
      409
    );
  }
}

/*
|--------------------------------------------------------------------------
| Permanently Delete Transcript Only
|--------------------------------------------------------------------------
*/

export async function permanentlyDeleteVoiceTranscript(
  userId,
  voiceTranscriptId
) {
  return executeTransaction(
    async (client) => {
      const voiceTranscript =
        await getOwnedJournalVoiceTranscriptById(
          voiceTranscriptId,
          userId,
          {
            includeDeleted:
              true
          },
          client
        );

      if (!voiceTranscript) {
        throw new AppError(
          "Voice transcript not found",
          404
        );
      }

      ensureTranscriptCanBePermanentlyDeleted(
        voiceTranscript
      );

      const deletedTranscript =
        await permanentlyDeleteJournalVoiceTranscript(
          voiceTranscriptId,
          userId,
          client
        );

      if (!deletedTranscript) {
        throw new AppError(
          "Failed to permanently delete the voice transcript",
          500
        );
      }

      return deletedTranscript;
    }
  );
}

/*
|--------------------------------------------------------------------------
| Permanently Delete Transcript And Audio Attachment
|--------------------------------------------------------------------------
*/

export async function permanentlyDeleteVoiceJournalAudio(
  userId,
  voiceTranscriptId
) {
  return executeTransaction(
    async (client) => {
      const voiceTranscript =
        await getOwnedJournalVoiceTranscriptById(
          voiceTranscriptId,
          userId,
          {
            includeDeleted:
              true
          },
          client
        );

      if (!voiceTranscript) {
        throw new AppError(
          "Voice transcript not found",
          404
        );
      }

      ensureTranscriptCanBePermanentlyDeleted(
        voiceTranscript
      );

      const attachmentId =
        voiceTranscript
          .attachment_id;

      /*
        The transcript row uses an attachment
        foreign key with ON DELETE CASCADE.

        Therefore, permanently deleting the
        attachment should automatically remove
        the transcript row.
      */
      const deletedAttachment =
        await permanentlyDeleteJournalAttachment(
          attachmentId,
          userId,
          client
        );

      if (!deletedAttachment) {
        throw new AppError(
          "Failed to permanently delete the related audio attachment",
          500
        );
      }

      return {
        voiceTranscriptId,

        attachmentId,

        transcriptDeleted:
          true,

        attachment:
          deletedAttachment
      };
    }
  );
}

/*
|--------------------------------------------------------------------------
| Delete Transcript By Attachment
|--------------------------------------------------------------------------
*/

export async function deleteVoiceTranscriptByAttachment(
  userId,
  attachmentId
) {
  const voiceTranscript =
    await getJournalVoiceTranscriptByAttachmentId(
      attachmentId,
      userId,
      {
        includeDeleted:
          true
      }
    );

  if (!voiceTranscript) {
    throw new AppError(
      "No voice transcript exists for this attachment",
      404
    );
  }

  if (
    voiceTranscript.is_deleted
  ) {
    throw new AppError(
      "The voice transcript is already deleted",
      409
    );
  }

  return deleteVoiceTranscript(
    userId,
    voiceTranscript
      .voice_transcript_id
  );
}

/*
|--------------------------------------------------------------------------
| Restore Transcript By Attachment
|--------------------------------------------------------------------------
*/

export async function restoreVoiceTranscriptByAttachment(
  userId,
  attachmentId
) {
  const voiceTranscript =
    await getJournalVoiceTranscriptByAttachmentId(
      attachmentId,
      userId,
      {
        includeDeleted:
          true
      }
    );

  if (!voiceTranscript) {
    throw new AppError(
      "No voice transcript exists for this attachment",
      404
    );
  }

  if (
    !voiceTranscript.is_deleted
  ) {
    throw new AppError(
      "The voice transcript is not deleted",
      409
    );
  }

  return restoreVoiceTranscript(
    userId,
    voiceTranscript
      .voice_transcript_id
  );
}

/*
|--------------------------------------------------------------------------
| Voice Transcript Summary
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptSummary(
  userId,
  voiceTranscriptId
) {
  const transcript =
    await getVoiceTranscriptDetails(
      userId,
      voiceTranscriptId
    );

  return {
    voiceTranscriptId:
      transcript
        .voice_transcript_id,

    entryId:
      transcript.entry_id,

    attachmentId:
      transcript
        .attachment_id,

    transcriptStatus:
      transcript
        .transcript_status,

    transcript:
      transcript.transcript,

    originalTranscript:
      transcript
        .original_transcript,

    transcriptWordCount:
      transcript
        .transcript_word_count,

    transcriptLanguage:
      transcript
        .transcript_language,

    detectedLanguage:
      transcript
        .detected_language,

    transcriptionProvider:
      transcript
        .transcription_provider,

    transcriptionModel:
      transcript
        .transcription_model,

    transcriptionConfidence:
      transcript
        .transcription_confidence,

    transcriptionError:
      transcript
        .transcription_error,

    isTranscriptEdited:
      transcript
        .is_transcript_edited,

    transcriptEditedAt:
      transcript
        .transcript_edited_at,

    retryCount:
      transcript.retry_count,

    lastRetryAt:
      transcript.last_retry_at,

    transcriptionStartedAt:
      transcript
        .transcription_started_at,

    transcriptionCompletedAt:
      transcript
        .transcription_completed_at,

    attachment:
      transcript.attachment,

    createdAt:
      transcript.created_at,

    updatedAt:
      transcript.updated_at
  };
}