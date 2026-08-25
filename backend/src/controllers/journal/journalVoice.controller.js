import {
  createVoiceTranscript as createVoiceTranscriptService,
  createPendingVoiceTranscript as createPendingVoiceTranscriptService,
  createAndTranscribeVoiceJournal as createAndTranscribeVoiceJournalService,
  processVoiceTranscription as processVoiceTranscriptionService,
  getTranscriptionAvailability as getTranscriptionAvailabilityService,
  getTranscriptionConfiguration as getTranscriptionConfigurationService,
  getVoiceTranscript as getVoiceTranscriptService,
  getVoiceTranscriptDetails as getVoiceTranscriptDetailsService,
  getVoiceTranscriptByAttachment as getVoiceTranscriptByAttachmentService,
  getEntryVoiceTranscripts as getEntryVoiceTranscriptsService,
  getUserVoiceTranscripts as getUserVoiceTranscriptsService,
  searchVoiceTranscripts as searchVoiceTranscriptsService,
  getVoiceTranscriptSummary as getVoiceTranscriptSummaryService,
  retryVoiceTranscription as retryVoiceTranscriptionService,
updateVoiceTranscriptText as updateVoiceTranscriptTextService,
restoreOriginalVoiceTranscript as restoreOriginalVoiceTranscriptService,
updateVoiceTranscriptMetadata as updateVoiceTranscriptMetadataService,
getVoiceTranscriptStatus as getVoiceTranscriptStatusService,
deleteVoiceTranscript as deleteVoiceTranscriptService,
deleteVoiceJournalAudio as deleteVoiceJournalAudioService,
restoreVoiceTranscript as restoreVoiceTranscriptService,
restoreVoiceJournalAudio as restoreVoiceJournalAudioService,
permanentlyDeleteVoiceTranscript as permanentlyDeleteVoiceTranscriptService,
permanentlyDeleteVoiceJournalAudio as permanentlyDeleteVoiceJournalAudioService,
deleteVoiceTranscriptByAttachment as deleteVoiceTranscriptByAttachmentService,
restoreVoiceTranscriptByAttachment as restoreVoiceTranscriptByAttachmentService
} from "../../services/journal/journalVoice.service.js";

/*
|--------------------------------------------------------------------------
| Controller Helpers
|--------------------------------------------------------------------------
*/

function getAuthenticatedUserId(req) {
  return (
    req.user?.user_id ||
    req.user?.userId ||
    req.user?.id ||
    null
  );
}

function getEntryId(req) {
  return (
    req.params?.entryId ||
    req.body?.entryId ||
    req.body?.entry_id ||
    null
  );
}

function getAttachmentId(req) {
  return (
    req.params?.attachmentId ||
    req.body?.attachmentId ||
    req.body?.attachment_id ||
    null
  );
}

function getVoiceTranscriptId(req) {
  return (
    req.params?.voiceTranscriptId ||
    req.params?.voice_transcript_id ||
    req.body?.voiceTranscriptId ||
    req.body?.voice_transcript_id ||
    null
  );
}

function getTranscriptionOptions(body = {}) {
  return {
    provider:
      body.provider ??
      body.transcriptionProvider ??
      body.transcription_provider,

    model:
      body.model ??
      body.transcriptionModel ??
      body.transcription_model,

    language:
      body.language ??
      body.transcriptLanguage ??
      body.transcript_language,

    prompt:
      body.prompt,

    temperature:
      body.temperature,

    retries:
      body.retries,

    includeWordTimestamps:
      body.includeWordTimestamps ??
      body.include_word_timestamps,

    transcribeImmediately:
      body.transcribeImmediately ??
      body.transcribe_immediately
  };
}

function sendSuccess(
  res,
  {
    statusCode = 200,
    message,
    data = null
  }
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/*
|--------------------------------------------------------------------------
| Create Voice Transcript
|--------------------------------------------------------------------------
|
| Creates the database transcript record.
|
| By default, the service immediately starts transcription unless
| transcribeImmediately is explicitly set to false.
|
| Expected:
| - req.user.user_id
| - req.params.entryId or req.body.entryId
| - req.body.attachmentId
|--------------------------------------------------------------------------
*/

export async function createVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const entryId =
      getEntryId(req);

    const attachmentId =
      getAttachmentId(req);

    const options =
      getTranscriptionOptions(
        req.body
      );

    const result =
      await createVoiceTranscriptService(
        userId,
        entryId,
        attachmentId,
        options
      );

    const isPending =
      result?.transcript_status ===
        "pending" ||
      result?.transcript
        ?.transcript_status ===
        "pending";

    return sendSuccess(res, {
      statusCode: 201,

      message: isPending
        ? "Voice transcript created successfully"
        : "Voice transcript created and processed successfully",

      data: {
        voiceTranscript:
          result
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Create Pending Voice Transcript
|--------------------------------------------------------------------------
|
| Creates only the pending database record.
| It does not immediately send the audio for transcription.
|--------------------------------------------------------------------------
*/

export async function createPendingVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const entryId =
      getEntryId(req);

    const attachmentId =
      getAttachmentId(req);

    const options =
      getTranscriptionOptions(
        req.body
      );

    const voiceTranscript =
      await createPendingVoiceTranscriptService(
        userId,
        entryId,
        attachmentId,
        options
      );

    return sendSuccess(res, {
      statusCode: 201,

      message:
        "Pending voice transcript created successfully",

      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Create And Transcribe Voice Journal
|--------------------------------------------------------------------------
|
| Creates the transcript record and immediately processes the
| associated audio attachment.
|--------------------------------------------------------------------------
*/

export async function createAndTranscribeVoiceJournal(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const entryId =
      getEntryId(req);

    const attachmentId =
      getAttachmentId(req);

    const options =
      getTranscriptionOptions(
        req.body
      );

    const result =
      await createAndTranscribeVoiceJournalService(
        userId,
        entryId,
        attachmentId,
        options
      );

    return sendSuccess(res, {
      statusCode: 201,

      message:
        "Voice journal transcribed successfully",

      data: {
        voiceTranscript:
          result?.transcript ||
          result,

        transcription:
          result?.transcription ||
          null
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Process Existing Voice Transcript
|--------------------------------------------------------------------------
|
| Processes an existing pending or failed transcript record.
|
| Expected:
| - req.params.voiceTranscriptId
|--------------------------------------------------------------------------
*/

export async function processVoiceTranscription(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const options =
      getTranscriptionOptions(
        req.body
      );

    const result =
      await processVoiceTranscriptionService(
        userId,
        voiceTranscriptId,
        options
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcription completed successfully",

      data: {
        voiceTranscript:
          result?.transcript ||
          result,

        transcription:
          result?.transcription ||
          null
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get Transcription Availability
|--------------------------------------------------------------------------
|
| Returns whether the configured speech-to-text provider is available.
| Do not return API keys or other secrets from the utility layer.
|--------------------------------------------------------------------------
*/

export async function getTranscriptionAvailability(
  req,
  res,
  next
) {
  try {
    const availability =
      getTranscriptionAvailabilityService();

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcription availability retrieved successfully",

      data: {
        availability
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get Transcription Configuration
|--------------------------------------------------------------------------
|
| Returns safe provider configuration such as provider and model.
|--------------------------------------------------------------------------
*/

export async function getTranscriptionConfiguration(
  req,
  res,
  next
) {
  try {
    const configuration =
      getTranscriptionConfigurationService();

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcription configuration retrieved successfully",

      data: {
        configuration
      }
    });
  } catch (error) {
    next(error);
  }
}
/*
|--------------------------------------------------------------------------
| Query Helpers
|--------------------------------------------------------------------------
*/

function getBooleanQueryValue(
  value
) {
  if (
    value === true ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return undefined;
}

function getPaginationFilters(
  query = {}
) {
  return {
    page:
      query.page,

    limit:
      query.limit
  };
}

function getTranscriptListFilters(
  query = {}
) {
  return {
    ...getPaginationFilters(
      query
    ),

    entryId:
      query.entryId ??
      query.entry_id,

    attachmentId:
      query.attachmentId ??
      query.attachment_id,

    transcriptStatus:
      query.transcriptStatus ??
      query.transcript_status,

    transcriptLanguage:
      query.transcriptLanguage ??
      query.transcript_language,

    transcriptionProvider:
      query.transcriptionProvider ??
      query.transcription_provider,

    isTranscriptEdited:
      getBooleanQueryValue(
        query.isTranscriptEdited ??
        query.is_transcript_edited
      ),

    isDeleted:
      getBooleanQueryValue(
        query.isDeleted ??
        query.is_deleted
      ),

    dateFrom:
      query.dateFrom ??
      query.date_from,

    dateTo:
      query.dateTo ??
      query.date_to,

    search:
      query.search
  };
}

/*
|--------------------------------------------------------------------------
| Get Voice Transcript
|--------------------------------------------------------------------------
|
| Returns one active voice transcript owned by the
| authenticated user.
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const voiceTranscript =
      await getVoiceTranscriptService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcript retrieved successfully",

      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get Voice Transcript Details
|--------------------------------------------------------------------------
|
| Returns the transcript together with its related
| audio attachment metadata.
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptDetails(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const voiceTranscript =
      await getVoiceTranscriptDetailsService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcript details retrieved successfully",

      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get Transcript By Attachment
|--------------------------------------------------------------------------
|
| Expected:
| - req.params.attachmentId
|
| Optional query:
| - includeDeleted=true
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptByAttachment(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const attachmentId =
      getAttachmentId(req);

    const includeDeleted =
      getBooleanQueryValue(
        req.query
          ?.includeDeleted ??
        req.query
          ?.include_deleted
      ) === true;

    const voiceTranscript =
      await getVoiceTranscriptByAttachmentService(
        userId,
        attachmentId,
        {
          includeDeleted
        }
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcript retrieved successfully",

      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get Entry Voice Transcripts
|--------------------------------------------------------------------------
|
| Returns all voice transcripts belonging to one
| journal entry.
|
| Optional query:
| - transcriptStatus
| - includeDeleted
|--------------------------------------------------------------------------
*/

export async function getEntryVoiceTranscripts(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const entryId =
      getEntryId(req);

    const filters = {
      transcriptStatus:
        req.query
          ?.transcriptStatus ??
        req.query
          ?.transcript_status,

      includeDeleted:
        getBooleanQueryValue(
          req.query
            ?.includeDeleted ??
          req.query
            ?.include_deleted
        ) === true
    };

    const voiceTranscripts =
      await getEntryVoiceTranscriptsService(
        userId,
        entryId,
        filters
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Journal entry voice transcripts retrieved successfully",

      data: {
        voiceTranscripts,

        count:
          voiceTranscripts.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get User Voice Transcripts
|--------------------------------------------------------------------------
|
| Supports:
| - page
| - limit
| - entryId
| - attachmentId
| - transcriptStatus
| - transcriptLanguage
| - transcriptionProvider
| - isTranscriptEdited
| - isDeleted
| - dateFrom
| - dateTo
| - search
|--------------------------------------------------------------------------
*/

export async function getUserVoiceTranscripts(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const filters =
      getTranscriptListFilters(
        req.query
      );

    const result =
      await getUserVoiceTranscriptsService(
        userId,
        filters
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcripts retrieved successfully",

      data: {
        voiceTranscripts:
          result.transcripts,

        pagination:
          result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Search Voice Transcripts
|--------------------------------------------------------------------------
|
| Search query can be supplied as:
| - req.query.q
| - req.query.search
| - req.query.searchQuery
|
| Optional:
| - entryId
| - transcriptLanguage
| - page
| - limit
|--------------------------------------------------------------------------
*/

export async function searchVoiceTranscripts(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const searchQuery =
      req.query?.q ??
      req.query?.search ??
      req.query?.searchQuery ??
      req.query?.search_query;

    const filters = {
      ...getPaginationFilters(
        req.query
      ),

      entryId:
        req.query
          ?.entryId ??
        req.query
          ?.entry_id,

      transcriptLanguage:
        req.query
          ?.transcriptLanguage ??
        req.query
          ?.transcript_language
    };

    const result =
      await searchVoiceTranscriptsService(
        userId,
        searchQuery,
        filters
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcript search completed successfully",

      data: {
        voiceTranscripts:
          result.transcripts,

        pagination:
          result.pagination,

        searchQuery:
          result.searchQuery
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Get Voice Transcript Summary
|--------------------------------------------------------------------------
|
| Returns a simplified transcript response containing
| transcript state, metadata, audio details and dates.
|--------------------------------------------------------------------------
*/

export async function getVoiceTranscriptSummary(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const summary =
      await getVoiceTranscriptSummaryService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcript summary retrieved successfully",

      data: {
        summary
      }
    });
  } catch (error) {
    next(error);
  }
}
/*
|--------------------------------------------------------------------------
| Retry Voice Transcription
|--------------------------------------------------------------------------
|
| Retries transcription for an existing failed or retryable
| voice transcript.
|
| Expected:
| - req.params.voiceTranscriptId
|
| Optional body:
| - provider
| - model
| - language
| - prompt
| - temperature
| - retries
| - includeWordTimestamps
|--------------------------------------------------------------------------
*/

export async function retryVoiceTranscription(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const options =
      getTranscriptionOptions(
        req.body
      );

    const result =
      await retryVoiceTranscriptionService(
        userId,
        voiceTranscriptId,
        options
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcription retried successfully",

      data: {
        voiceTranscript:
          result?.transcript ||
          result,

        transcription:
          result?.transcription ||
          null
      }
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Update Voice Transcript Text
|--------------------------------------------------------------------------
|
| Allows the authenticated user to manually edit the generated
| transcript text.
|
| Expected:
| - req.params.voiceTranscriptId
| - req.body.transcript
|
| Also accepts:
| - req.body.transcriptText
| - req.body.transcript_text
|--------------------------------------------------------------------------
*/

export async function updateVoiceTranscriptText(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const transcript =
      req.body?.transcript ??
      req.body?.transcriptText ??
      req.body?.transcript_text;

    const updatedVoiceTranscript =
      await updateVoiceTranscriptTextService(
        userId,
        voiceTranscriptId,
        transcript
      );

    return sendSuccess(res, {
      statusCode: 200,

      message:
        "Voice transcript text updated successfully",

      data: {
        voiceTranscript:
          updatedVoiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}
export async function restoreOriginalVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const voiceTranscript =
      await restoreOriginalVoiceTranscriptService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Original transcript restored successfully",
      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVoiceTranscriptMetadata(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const metadata = {
      language:
        req.body.language,
      transcriptLanguage:
        req.body
          .transcriptLanguage,
      detectedLanguage:
        req.body
          .detectedLanguage,
      transcriptionProvider:
        req.body
          .transcriptionProvider,
      transcriptionModel:
        req.body
          .transcriptionModel,
      transcriptionConfidence:
        req.body
          .transcriptionConfidence,
      metadata:
        req.body.metadata
    };

    const voiceTranscript =
      await updateVoiceTranscriptMetadataService(
        userId,
        voiceTranscriptId,
        metadata
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript metadata updated successfully",
      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getVoiceTranscriptStatus(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const status =
      await getVoiceTranscriptStatusService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript status retrieved successfully",
      data: {
        status
      }
    });
  } catch (error) {
    next(error);
  }
}
export async function deleteVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const deleteAttachment =
      getBooleanQueryValue(
        req.body?.deleteAttachment ??
        req.body?.delete_attachment
      ) ?? false;

    const result =
      await deleteVoiceTranscriptService(
        userId,
        voiceTranscriptId,
        {
          deleteAttachment
        }
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVoiceJournalAudio(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const result =
      await deleteVoiceJournalAudioService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript and audio attachment deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const restoreAttachment =
      getBooleanQueryValue(
        req.body?.restoreAttachment ??
        req.body?.restore_attachment
      ) ?? false;

    const result =
      await restoreVoiceTranscriptService(
        userId,
        voiceTranscriptId,
        {
          restoreAttachment
        }
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript restored successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreVoiceJournalAudio(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const result =
      await restoreVoiceJournalAudioService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript and audio attachment restored successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function permanentlyDeleteVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const voiceTranscript =
      await permanentlyDeleteVoiceTranscriptService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript permanently deleted successfully",
      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function permanentlyDeleteVoiceJournalAudio(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const voiceTranscriptId =
      getVoiceTranscriptId(req);

    const result =
      await permanentlyDeleteVoiceJournalAudioService(
        userId,
        voiceTranscriptId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript and audio attachment permanently deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVoiceTranscriptByAttachment(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const attachmentId =
      getAttachmentId(req);

    const voiceTranscript =
      await deleteVoiceTranscriptByAttachmentService(
        userId,
        attachmentId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript deleted successfully",
      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreVoiceTranscriptByAttachment(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const attachmentId =
      getAttachmentId(req);

    const voiceTranscript =
      await restoreVoiceTranscriptByAttachmentService(
        userId,
        attachmentId
      );

    return sendSuccess(res, {
      statusCode: 200,
      message:
        "Voice transcript restored successfully",
      data: {
        voiceTranscript
      }
    });
  } catch (error) {
    next(error);
  }
}
