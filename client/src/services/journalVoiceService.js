import api from "./api";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/


function resolveEntryId(
  entryOrId
) {
  if (
    typeof entryOrId ===
    "string"
  ) {
    return entryOrId;
  }


  return (
    entryOrId?.entryId ||
    entryOrId?.entry_id ||
    entryOrId?.id ||
    null
  );
}


function resolveTranscriptId(
  transcriptOrId
) {
  if (
    typeof transcriptOrId ===
    "string"
  ) {
    return transcriptOrId;
  }


  return (
    transcriptOrId
      ?.voiceTranscriptId ||
    transcriptOrId
      ?.voice_transcript_id ||
    transcriptOrId?.id ||
    null
  );
}


function requireId(
  value,
  label
) {
  if (!value) {
    throw new Error(
      `${label} is missing.`
    );
  }


  return value;
}


function transcriptPath(
  transcriptOrId,
  suffix = ""
) {
  const id =
    requireId(
      resolveTranscriptId(
        transcriptOrId
      ),
      "Voice transcript ID"
    );


  return (
    `/journal/voice/${id}${suffix}`
  );
}


/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/


export async function getVoiceConfiguration() {
  const response =
    await api.get(
      "/journal/voice/configuration"
    );


  return (
    response.data?.data ||
    null
  );
}


export async function getVoiceAvailability() {
  const response =
    await api.get(
      "/journal/voice/availability"
    );


  return (
    response.data?.data ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Create + Transcribe Voice Journal
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function is now called ONLY when the user clicks:
|
| "Convert to text"
|
| Clicking "Use voice note" no longer calls this API.
|--------------------------------------------------------------------------
*/


export async function createAndTranscribeVoiceJournal(
  entryOrId,
  attachmentId,
  options = {}
) {
  const entryId =
    requireId(
      resolveEntryId(
        entryOrId
      ),
      "Journal entry ID"
    );


  const validAttachmentId =
    requireId(
      attachmentId,
      "Voice attachment ID"
    );


  const payload = {
    attachmentId:
      validAttachmentId,

    transcriptLanguage:
      options
        .transcriptLanguage ??
      null,

    transcriptionProvider:
      options
        .transcriptionProvider ??
      null,

    transcriptionModel:
      options
        .transcriptionModel ??
      null,

    /*
     * The backend should immediately
     * begin speech-to-text processing.
     */
    autoTranscribe: true
  };


  const response =
    await api.post(
      `/journal/voice/entry/${entryId}/transcribe`,
      payload
    );


  return (
    response.data?.data
      ?.voiceTranscript ||
    response.data?.data
      ?.transcript ||
    response.data?.data ||
    response.data
      ?.voiceTranscript ||
    response.data
      ?.transcript ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Get Voice Transcripts For An Entry
|--------------------------------------------------------------------------
*/


export async function getEntryVoiceTranscripts(
  entryOrId
) {
  const entryId =
    requireId(
      resolveEntryId(
        entryOrId
      ),
      "Journal entry ID"
    );


  const response =
    await api.get(
      `/journal/voice/entry/${entryId}`
    );


  const data =
    response.data?.data;


  if (
    Array.isArray(
      data?.voiceTranscripts
    )
  ) {
    return data.voiceTranscripts;
  }


  if (
    Array.isArray(
      data?.transcripts
    )
  ) {
    return data.transcripts;
  }


  if (
    Array.isArray(data)
  ) {
    return data;
  }


  if (
    Array.isArray(
      response.data
        ?.voiceTranscripts
    )
  ) {
    return (
      response.data
        .voiceTranscripts
    );
  }


  if (
    Array.isArray(
      response.data
        ?.transcripts
    )
  ) {
    return (
      response.data
        .transcripts
    );
  }


  return [];
}


/*
|--------------------------------------------------------------------------
| Retry Failed Transcription
|--------------------------------------------------------------------------
*/


export async function retryVoiceTranscription(
  transcriptOrId
) {
  const response =
    await api.post(
      transcriptPath(
        transcriptOrId,
        "/retry"
      ),
      {}
    );


  return (
    response.data?.data
      ?.voiceTranscript ||
    response.data?.data
      ?.transcript ||
    response.data?.data ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Update Transcript
|--------------------------------------------------------------------------
*/


export async function updateVoiceTranscript(
  transcriptOrId,
  transcript
) {
  const id =
    requireId(
      resolveTranscriptId(
        transcriptOrId
      ),
      "Voice transcript ID"
    );


  if (
    typeof transcript !==
    "string"
  ) {
    throw new Error(
      "Transcript text is required."
    );
  }


  const response =
    await api.patch(
      `/journal/voice/${id}/transcript`,
      {
        transcript:
          transcript
      }
    );


  return (
    response.data?.data
      ?.voiceTranscript ||
    response.data?.data
      ?.transcript ||
    response.data?.data ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Restore Original Transcript
|--------------------------------------------------------------------------
*/


export async function restoreOriginalVoiceTranscript(
  transcriptOrId
) {
  const response =
    await api.patch(
      transcriptPath(
        transcriptOrId,
        "/restore-original"
      ),
      {}
    );


  return (
    response.data?.data
      ?.voiceTranscript ||
    response.data?.data
      ?.transcript ||
    response.data?.data ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/


export function getJournalVoiceError(
  error,
  fallback =
    "Voice journal could not be processed."
) {
  /*
   * Backend specifically returned
   * an Express/HTTP 404.
   */
  if (
    error?.response?.status ===
    404
  ) {
    return (
      error?.response?.data
        ?.message ||
      error?.response?.data
        ?.error ||
      "The voice journal API route was not found."
    );
  }


  /*
   * Journal locked.
   */
  if (
    error?.response?.status ===
    423
  ) {
    return (
      "Your private journal is locked. " +
      "Unlock it before using voice journaling."
    );
  }


  /*
   * File too large.
   */
  if (
    error?.response?.status ===
    413
  ) {
    return (
      "The voice recording is too large to process."
    );
  }


  /*
   * Unsupported audio.
   */
  if (
    error?.response?.status ===
    415
  ) {
    return (
      "This audio format is not supported."
    );
  }


  return (
    error?.response?.data
      ?.message ||
    error?.response?.data
      ?.error ||
    error?.message ||
    fallback
  );
}