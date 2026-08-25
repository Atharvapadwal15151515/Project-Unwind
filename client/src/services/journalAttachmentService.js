import api from "./api";


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


function resolveAttachmentId(
  attachmentOrId
) {
  if (
    typeof attachmentOrId ===
    "string"
  ) {
    return attachmentOrId;
  }


  return (
    attachmentOrId
      ?.attachmentId ||
    attachmentOrId
      ?.attachment_id ||
    attachmentOrId?.id ||
    null
  );
}


function requireIdentifier(
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


function entryAttachmentPath(
  entryOrId,
  suffix = ""
) {
  const entryId =
    requireIdentifier(
      resolveEntryId(
        entryOrId
      ),
      "Journal entry ID"
    );


  return (
    `/journal/attachments/entries/${entryId}${suffix}`
  );
}


function attachmentPath(
  attachmentOrId,
  suffix = ""
) {
  const attachmentId =
    requireIdentifier(
      resolveAttachmentId(
        attachmentOrId
      ),
      "Journal attachment ID"
    );


  return (
    `/journal/attachments/${attachmentId}${suffix}`
  );
}


function getUploadConfig(
  onUploadProgress
) {
  if (
    typeof onUploadProgress !==
    "function"
  ) {
    return undefined;
  }


  return {
    onUploadProgress(
      event
    ) {
      if (!event.total) {
        return;
      }


      const progress =
        Math.min(
          100,
          Math.round(
            (
              event.loaded /
              event.total
            ) * 100
          )
        );


      onUploadProgress(
        progress
      );
    }
  };
}


/*
|--------------------------------------------------------------------------
| Get Attachments
|--------------------------------------------------------------------------
*/


export async function getJournalAttachments(
  filtersOrEntry = {}
) {
  if (
    typeof filtersOrEntry ===
      "string" ||
    resolveEntryId(
      filtersOrEntry
    )
  ) {
    return (
      getJournalEntryAttachments(
        filtersOrEntry
      )
    );
  }


  const response =
    await api.get(
      "/journal/attachments",
      {
        params:
          filtersOrEntry
      }
    );


  return {
    attachments:
      response.data?.data
        ?.attachments ||
      [],

    pagination:
      response.data?.data
        ?.pagination ||
      null
  };
}


/*
|--------------------------------------------------------------------------
| Get Attachments For One Entry
|--------------------------------------------------------------------------
*/


export async function getJournalEntryAttachments(
  entryOrId,
  filters = {}
) {
  const response =
    await api.get(
      entryAttachmentPath(
        entryOrId
      ),
      {
        params: filters
      }
    );


  const attachments =
    response.data?.data
      ?.attachments ||
    [];


  return {
    attachments,

    count:
      response.data?.data
        ?.count ??
      attachments.length
  };
}


/*
|--------------------------------------------------------------------------
| Upload Single Attachment
|--------------------------------------------------------------------------
|
| Used by Voice Journaling.
|
| The important part is that the REAL File object is sent
| using FormData.
|--------------------------------------------------------------------------
*/


export async function uploadJournalAttachment(
  entryOrId,
  file,
  metadata = {}
) {
  const entryId =
    requireIdentifier(
      resolveEntryId(
        entryOrId
      ),
      "Journal entry ID"
    );


  if (!file) {
    throw new Error(
      "Attachment file is required."
    );
  }


  const formData =
    new FormData();


  /*
   * IMPORTANT:
   *
   * Backend Multer expects:
   *
   * journalMulter.single(
   *   "attachment"
   * )
   *
   * Therefore the field name MUST
   * be "attachment".
   */
  formData.append(
    "attachment",
    file
  );


  if (
    metadata.caption
  ) {
    formData.append(
      "caption",
      metadata.caption
    );
  }


  if (
    metadata.altText
  ) {
    formData.append(
      "altText",
      metadata.altText
    );
  }


  if (
    metadata.isCover !==
      undefined &&
    metadata.isCover !==
      null
  ) {
    formData.append(
      "isCover",
      String(
        Boolean(
          metadata.isCover
        )
      )
    );
  }


  if (
    metadata.attachmentOrder !==
      undefined &&
    metadata.attachmentOrder !==
      null
  ) {
    formData.append(
      "attachmentOrder",
      String(
        metadata
          .attachmentOrder
      )
    );
  }


  /*
   * Do NOT manually set
   * Content-Type.
   *
   * Axios/browser adds:
   *
   * multipart/form-data;
   * boundary=...
   *
   * automatically.
   */
  const response =
    await api.post(
      `/journal/attachments/entries/${entryId}`,
      formData
    );


  return (
    response.data?.data
      ?.attachment ||
    response.data?.attachment ||
    response.data?.data ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Upload Multiple Attachments
|--------------------------------------------------------------------------
*/


export async function uploadJournalAttachments(
  entryOrId,
  files,
  metadataList = [],
  onUploadProgress
) {
  const normalizedFiles =
    Array.from(
      files || []
    );


  if (
    normalizedFiles.length ===
    0
  ) {
    throw new Error(
      "Choose at least one file to upload."
    );
  }


  const formData =
    new FormData();


  normalizedFiles.forEach(
    (file) => {
      formData.append(
        "attachments",
        file
      );
    }
  );


  const captions =
    normalizedFiles.map(
      (_, index) =>
        metadataList[index]
          ?.caption ||
        null
    );


  const altTexts =
    normalizedFiles.map(
      (_, index) =>
        metadataList[index]
          ?.altText ||
        null
    );


  formData.append(
    "captions",
    JSON.stringify(
      captions
    )
  );


  formData.append(
    "altTexts",
    JSON.stringify(
      altTexts
    )
  );


  const coverIndex =
    metadataList.findIndex(
      (metadata) =>
        metadata?.isCover ===
        true
    );


  if (
    coverIndex >= 0
  ) {
    formData.append(
      "coverIndex",
      String(
        coverIndex
      )
    );
  }


  const response =
    await api.post(
      entryAttachmentPath(
        entryOrId,
        "/multiple"
      ),
      formData,
      getUploadConfig(
        onUploadProgress
      )
    );


  return (
    response.data?.data
      ?.attachments ||
    []
  );
}


/*
|--------------------------------------------------------------------------
| Update Attachment
|--------------------------------------------------------------------------
*/


export async function updateJournalAttachment(
  attachmentOrId,
  payload
) {
  const response =
    await api.patch(
      attachmentPath(
        attachmentOrId
      ),
      payload
    );


  return (
    response.data?.data
      ?.attachment ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Set Attachment As Cover
|--------------------------------------------------------------------------
*/


export async function setJournalAttachmentCover(
  attachmentOrId
) {
  const response =
    await api.patch(
      attachmentPath(
        attachmentOrId,
        "/cover"
      ),
      {}
    );


  return (
    response.data?.data
      ?.attachment ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Remove Attachment Cover
|--------------------------------------------------------------------------
*/


export async function removeJournalAttachmentCover(
  attachmentOrId
) {
  const response =
    await api.delete(
      attachmentPath(
        attachmentOrId,
        "/cover"
      )
    );


  return (
    response.data?.data
      ?.attachment ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Delete Attachment
|--------------------------------------------------------------------------
*/


export async function deleteJournalAttachment(
  attachmentOrId
) {
  const response =
    await api.delete(
      attachmentPath(
        attachmentOrId
      )
    );


  return (
    response.data?.data
      ?.attachment ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Permanently Delete Attachment
|--------------------------------------------------------------------------
|
| Used by speech-to-text after transcription has completed.
|
| The temporary audio is:
|
| 1. soft-deleted first
| 2. permanently deleted afterwards
|
| The backend also removes the Cloudinary resource.
|--------------------------------------------------------------------------
*/

export async function permanentlyDeleteJournalAttachment(
  attachmentOrId
) {
  const response =
    await api.delete(
      attachmentPath(
        attachmentOrId,
        "/permanent"
      )
    );


  return (
    response.data?.data
      ?.attachment ||
    response.data?.data ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Reorder Attachments
|--------------------------------------------------------------------------
*/


export async function reorderJournalAttachments(
  entryOrId,
  attachments
) {
  const normalizedAttachments =
    Array.isArray(
      attachments
    )
      ? attachments
      : [];


  const response =
    await api.patch(
      entryAttachmentPath(
        entryOrId,
        "/reorder"
      ),
      {
        attachments:
          normalizedAttachments.map(
            (
              attachment,
              index
            ) => ({
              attachmentId:
                requireIdentifier(
                  resolveAttachmentId(
                    attachment
                  ),
                  "Journal attachment ID"
                ),

              attachmentOrder:
                index
            })
          )
      }
    );


  return (
    response.data?.data
      ?.attachments ||
    []
  );
}


/*
|--------------------------------------------------------------------------
| Attachment Error
|--------------------------------------------------------------------------
*/


export function getJournalAttachmentError(
  error,
  fallback =
    "The attachment could not be processed."
) {
  if (
    error?.response
      ?.status === 413
  ) {
    return (
      "The selected file is too large."
    );
  }


  if (
    error?.response
      ?.status === 415
  ) {
    return (
      "This file type is not supported."
    );
  }


  if (
    error?.response
      ?.status === 404
  ) {
    return (
      error?.response?.data
        ?.message ||
      error?.response?.data
        ?.error ||
      "The journal attachment route was not found."
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