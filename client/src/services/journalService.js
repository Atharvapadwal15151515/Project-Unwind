import api from "./api";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function resolveEntryId(entryOrId) {
  if (typeof entryOrId === "string") {
    return entryOrId;
  }

  return (
    entryOrId?.entryId ||
    entryOrId?.entry_id ||
    entryOrId?.id ||
    null
  );
}

function entryPath(entryOrId, action = "") {
  const id = resolveEntryId(entryOrId);

  if (!id) {
    throw new Error(
      "Journal entry ID is missing."
    );
  }

  return `/journal/entries/${id}${action}`;
}

function getAudioExtension(mimeType = "") {
  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (
    mimeType.includes("mp4") ||
    mimeType.includes("m4a")
  ) {
    return "m4a";
  }

  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  if (mimeType.includes("wav")) {
    return "wav";
  }

  return "webm";
}

/*
|--------------------------------------------------------------------------
| Journal Entries
|--------------------------------------------------------------------------
*/

export async function getJournalEntries(
  filters = {}
) {
  const response = await api.get(
    "/journal/entries",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      entries: [],
      pagination: null
    }
  );
}

/*
|--------------------------------------------------------------------------
| Get Single Journal Entry
|--------------------------------------------------------------------------
|
| This is intentionally used by features that require the COMPLETE journal
| entry rather than the lightweight journal-library/list representation.
|
| Examples:
| - Export
| - Full entry viewer
|
*/

export async function getJournalEntry(
  entryOrId
) {
  const response = await api.get(
    entryPath(entryOrId)
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function createJournalEntry(
  payload
) {
  const response = await api.post(
    "/journal/entries",
    payload
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function updateJournalEntry(
  entryOrId,
  payload
) {
  const response = await api.patch(
    entryPath(entryOrId),
    payload
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Auto-save Journal Entry
|--------------------------------------------------------------------------
|
| Used while the Journal editor is open.
|
| This deliberately uses the backend's dedicated /auto-save endpoint
| rather than the normal update endpoint.
|
| The backend:
| - updates last_auto_saved_at
| - does NOT mark the entry as manually edited
| - preserves draft behaviour
|--------------------------------------------------------------------------
*/

export async function autoSaveJournalEntry(
  entryOrId,
  payload
) {
  const response =
    await api.patch(
      entryPath(
        entryOrId,
        "/auto-save"
      ),
      payload
    );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function completeJournalEntry(
  entryOrId
) {
  const response = await api.patch(
    entryPath(
      entryOrId,
      "/complete"
    ),
    {}
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function toggleJournalFavourite(
  entryOrId
) {
  const response = await api.patch(
    entryPath(
      entryOrId,
      "/favourite"
    ),
    {}
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function archiveJournalEntry(
  entryOrId
) {
  const response = await api.patch(
    entryPath(
      entryOrId,
      "/archive"
    ),
    {}
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function unarchiveJournalEntry(
  entryOrId
) {
  const response = await api.patch(
    entryPath(
      entryOrId,
      "/unarchive"
    ),
    {}
  );

  return (
    response.data?.data?.entry ||
    response.data?.entry ||
    response.data?.data ||
    null
  );
}

export async function deleteJournalEntry(
  entryOrId
) {
  await api.delete(
    entryPath(entryOrId)
  );
}

/*
|--------------------------------------------------------------------------
| Journal Attachments
|--------------------------------------------------------------------------
*/

export async function getJournalAttachments(
  entryOrId
) {
  const entryId =
    resolveEntryId(entryOrId);

  if (!entryId) {
    throw new Error(
      "Journal entry ID is missing."
    );
  }

  const response = await api.get(
    `/journal/entries/${entryId}/attachments`
  );

  const data =
    response.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.attachments
    )
  ) {
    return data.attachments;
  }

  if (
    Array.isArray(
      response.data?.attachments
    )
  ) {
    return response.data.attachments;
  }

  return [];
}

export async function uploadJournalAttachment(
  entryOrId,
  file,
  {
    attachmentType = null,
    caption = null,
    duration = null
  } = {}
) {
  const entryId =
    resolveEntryId(entryOrId);

  if (!entryId) {
    throw new Error(
      "The journal entry must be saved before uploading an attachment."
    );
  }

  if (!file) {
    throw new Error(
      "No attachment was selected."
    );
  }

  const formData =
    new FormData();

  /*
   * IMPORTANT:
   * We upload the actual File,
   * not a blob URL.
   */
  formData.append(
    "file",
    file
  );

  if (attachmentType) {
    formData.append(
      "attachmentType",
      attachmentType
    );
  }

  if (caption) {
    formData.append(
      "caption",
      caption
    );
  }

  if (
    duration !== null &&
    duration !== undefined
  ) {
    formData.append(
      "duration",
      String(duration)
    );
  }

  /*
   * Do NOT manually set:
   *
   * Content-Type:
   * multipart/form-data
   *
   * Axios/browser will add the
   * correct multipart boundary.
   */
  const response = await api.post(
    `/journal/entries/${entryId}/attachments`,
    formData
  );

  return (
    response.data?.data?.attachment ||
    response.data?.attachment ||
    response.data?.data ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Voice Journal Upload
|--------------------------------------------------------------------------
*/

export async function uploadJournalVoice(
  entryOrId,
  audioBlob,
  {
    duration = null,
    filename = null
  } = {}
) {
  if (!audioBlob) {
    throw new Error(
      "No voice recording is available."
    );
  }

  const mimeType =
    audioBlob.type ||
    "audio/webm";

  const extension =
    getAudioExtension(
      mimeType
    );

  const audioFile =
    new File(
      [audioBlob],
      filename ||
        `voice-note-${Date.now()}.${extension}`,
      {
        type: mimeType
      }
    );

  return uploadJournalAttachment(
    entryOrId,
    audioFile,
    {
      attachmentType: "audio",
      duration
    }
  );
}

/*
|--------------------------------------------------------------------------
| Speech To Text
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is an API request.
|
| It is NOT a React Router route.
|--------------------------------------------------------------------------
*/

export async function transcribeJournalVoice(
  audioBlob
) {
  if (!audioBlob) {
    throw new Error(
      "Record a voice note before converting it to text."
    );
  }

  const mimeType =
    audioBlob.type ||
    "audio/webm";

  const extension =
    getAudioExtension(
      mimeType
    );

  const audioFile =
    new File(
      [audioBlob],
      `voice-transcription-${Date.now()}.${extension}`,
      {
        type: mimeType
      }
    );

  const formData =
    new FormData();

  formData.append(
    "file",
    audioFile
  );

  const response = await api.post(
    "/journal/speech-to-text",
    formData
  );

  return (
    response.data?.data
      ?.transcription ||
    response.data?.data?.text ||
    response.data
      ?.transcription ||
    response.data?.text ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| Daily Prompt
|--------------------------------------------------------------------------
*/

export async function getDailyJournalPrompt() {
  const response = await api.get(
    "/journal/prompts/daily"
  );

  return (
    response.data?.data?.prompt ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Errors
|--------------------------------------------------------------------------
*/

export function getJournalError(
  error,
  fallbackMessage =
    "We could not load your journal right now."
) {
  if (
    error?.response?.status ===
    423
  ) {
    return (
      "Your private journal is locked. " +
      "Unlock it before opening your entries."
    );
  }

  return (
    error?.response?.data
      ?.message ||
    error?.response?.data
      ?.error ||
    error?.message ||
    fallbackMessage
  );
}