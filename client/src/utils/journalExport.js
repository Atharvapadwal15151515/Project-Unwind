import {
  jsPDF
} from "jspdf";

/*
|--------------------------------------------------------------------------
| Generic Helpers
|--------------------------------------------------------------------------
*/

function readField(
  object,
  ...keys
) {
  if (
    !object ||
    typeof object !== "object"
  ) {
    return undefined;
  }

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null
    ) {
      return object[key];
    }
  }

  return undefined;
}

function readArray(
  object,
  ...keys
) {
  const value =
    readField(
      object,
      ...keys
    );

  return Array.isArray(value)
    ? value
    : [];
}

function hasValue(
  value
) {
  return (
    value !== undefined &&
    value !== null &&
    value !== ""
  );
}

function booleanLabel(
  value
) {
  return value
    ? "Yes"
    : "No";
}

/*
|--------------------------------------------------------------------------
| File Names
|--------------------------------------------------------------------------
*/

function sanitizeFileName(
  value = "journal"
) {
  return (
    String(value)
      .trim()
      .replace(
        /[<>:"/\\|?*]+/g,
        "-"
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      )
      .slice(
        0,
        100
      ) ||
    "journal"
  );
}

function getTodayFileDate() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

function formatExportDate(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle:
        "long",

      timeStyle:
        "short"
    }
  );
}

/*
|--------------------------------------------------------------------------
| Tag Normalisation
|--------------------------------------------------------------------------
*/

function normalizeTags(
  entry
) {
  const tags =
    readArray(
      entry,
      "tags",
      "journalTags",
      "journal_tags",
      "entryTags",
      "entry_tags"
    );

  return tags
    .map((tag) => {
      if (
        typeof tag ===
        "string"
      ) {
        return tag;
      }

      return (
        readField(
          tag,
          "tagName",
          "tag_name",
          "name",
          "label"
        ) || ""
      );
    })
    .map((tag) =>
      String(tag).trim()
    )
    .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| Mood Normalisation
|--------------------------------------------------------------------------
*/

function normalizeMood(
  entry
) {
  let label =
    readField(
      entry,
      "moodLabel",
      "mood_label"
    );

  let score =
    readField(
      entry,
      "moodScore",
      "mood_score"
    );

  const mood =
    readField(
      entry,
      "mood",
      "journalMood",
      "journal_mood",
      "moodData",
      "mood_data"
    );

  if (
    mood &&
    typeof mood === "object"
  ) {
    label =
      label ??
      readField(
        mood,
        "moodLabel",
        "mood_label",
        "label",
        "name"
      );

    score =
      score ??
      readField(
        mood,
        "moodScore",
        "mood_score",
        "score"
      );
  }

  return {
    label:
      hasValue(label)
        ? String(label)
        : "",

    score:
      hasValue(score)
        ? score
        : ""
  };
}

/*
|--------------------------------------------------------------------------
| Prompt Normalisation
|--------------------------------------------------------------------------
*/

function normalizePrompt(
  entry
) {
  const promptObject =
    readField(
      entry,
      "prompt",
      "journalPrompt",
      "journal_prompt",
      "promptData",
      "prompt_data"
    );

  const directText =
    readField(
      entry,
      "promptText",
      "prompt_text"
    );

  let text =
    directText || "";

  let promptId =
    readField(
      entry,
      "promptId",
      "prompt_id"
    );

  let category =
    "";

  if (
    promptObject &&
    typeof promptObject ===
      "object"
  ) {
    text =
      text ||
      readField(
        promptObject,
        "promptText",
        "prompt_text",
        "text",
        "content",
        "title"
      ) ||
      "";

    promptId =
      promptId ||
      readField(
        promptObject,
        "promptId",
        "prompt_id",
        "id"
      );

    category =
      readField(
        promptObject,
        "categoryName",
        "category_name",
        "category"
      ) || "";
  } else if (
    typeof promptObject ===
    "string"
  ) {
    text =
      text ||
      promptObject;
  }

  return {
    id:
      promptId || null,

    text:
      String(
        text || ""
      ),

    category:
      String(
        category || ""
      )
  };
}

/*
|--------------------------------------------------------------------------
| Emotions
|--------------------------------------------------------------------------
*/

function normalizeEmotions(
  entry
) {
  const emotions =
    readArray(
      entry,
      "emotions",
      "journalEmotions",
      "journal_emotions",
      "entryEmotions",
      "entry_emotions"
    );

  return emotions
    .map((emotion) => {
      if (
        typeof emotion ===
        "string"
      ) {
        return {
          name:
            emotion,

          intensity:
            null
        };
      }

      return {
        name:
          readField(
            emotion,
            "emotionName",
            "emotion_name",
            "name",
            "label"
          ) || "",

        intensity:
          readField(
            emotion,
            "intensity",
            "emotionIntensity",
            "emotion_intensity"
          )
      };
    })
    .filter(
      (emotion) =>
        emotion.name
    );
}

/*
|--------------------------------------------------------------------------
| Activities
|--------------------------------------------------------------------------
*/

function normalizeActivities(
  entry
) {
  const activities =
    readArray(
      entry,
      "activities",
      "journalActivities",
      "journal_activities",
      "entryActivities",
      "entry_activities"
    );

  return activities
    .map((activity) => {
      if (
        typeof activity ===
        "string"
      ) {
        return activity;
      }

      return (
        readField(
          activity,
          "activityName",
          "activity_name",
          "name",
          "label"
        ) || ""
      );
    })
    .map((activity) =>
      String(activity).trim()
    )
    .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| Attachment Normalisation
|--------------------------------------------------------------------------
*/

function normalizeAttachments(
  entry
) {
  const attachments =
    readArray(
      entry,
      "attachments",
      "journalAttachments",
      "journal_attachments",
      "media"
    );

  return attachments.map(
    (
      attachment,
      index
    ) => ({
      id:
        readField(
          attachment,
          "attachmentId",
          "attachment_id",
          "id"
        ) || null,

      fileName:
        readField(
          attachment,
          "originalFilename",
          "original_filename",
          "fileName",
          "file_name",
          "filename",
          "name"
        ) ||
        `Attachment ${index + 1}`,

      type:
        readField(
          attachment,
          "attachmentType",
          "attachment_type",
          "fileType",
          "file_type",
          "type",
          "resourceType",
          "resource_type"
        ) || "",

      mimeType:
        readField(
          attachment,
          "mimeType",
          "mime_type"
        ) || "",

      size:
        readField(
          attachment,
          "fileSize",
          "file_size",
          "sizeBytes",
          "size_bytes",
          "bytes"
        ),

      duration:
        readField(
          attachment,
          "duration",
          "durationSeconds",
          "duration_seconds"
        ),

      width:
        readField(
          attachment,
          "width"
        ),

      height:
        readField(
          attachment,
          "height"
        ),

      isCover:
        Boolean(
          readField(
            attachment,
            "isCover",
            "is_cover",
            "cover"
          )
        ),

      order:
        readField(
          attachment,
          "attachmentOrder",
          "attachment_order",
          "order"
        ),

      url:
        readField(
          attachment,
          "secureUrl",
          "secure_url",
          "url",
          "fileUrl",
          "file_url"
        ) || "",

      processingStatus:
        readField(
          attachment,
          "processingStatus",
          "processing_status",
          "status"
        ) || ""
    })
  );
}

/*
|--------------------------------------------------------------------------
| Voice Transcript Normalisation
|--------------------------------------------------------------------------
*/

function normalizeVoiceTranscripts(
  entry
) {
  let transcripts =
    readArray(
      entry,
      "voiceTranscripts",
      "voice_transcripts",
      "transcripts",
      "journalVoiceTranscripts",
      "journal_voice_transcripts"
    );

  const singleTranscript =
    readField(
      entry,
      "voiceTranscript",
      "voice_transcript",
      "transcript"
    );

  if (
    transcripts.length === 0 &&
    singleTranscript
  ) {
    transcripts = [
      singleTranscript
    ];
  }

  return transcripts
    .map(
      (
        transcript,
        index
      ) => {
        if (
          typeof transcript ===
          "string"
        ) {
          return {
            id: null,

            text:
              transcript,

            status:
              "",

            language:
              "",

            provider:
              "",

            model:
              "",

            createdAt:
              null,

            label:
              `Transcript ${
                index + 1
              }`
          };
        }

        return {
          id:
            readField(
              transcript,
              "voiceTranscriptId",
              "voice_transcript_id",
              "transcriptId",
              "transcript_id",
              "id"
            ) || null,

          text:
            readField(
              transcript,
              "transcriptText",
              "transcript_text",
              "text",
              "content"
            ) || "",

          status:
            readField(
              transcript,
              "status",
              "transcriptionStatus",
              "transcription_status"
            ) || "",

          language:
            readField(
              transcript,
              "language",
              "languageCode",
              "language_code"
            ) || "",

          provider:
            readField(
              transcript,
              "provider",
              "transcriptionProvider",
              "transcription_provider"
            ) || "",

          model:
            readField(
              transcript,
              "model",
              "transcriptionModel",
              "transcription_model"
            ) || "",

          createdAt:
            readField(
              transcript,
              "createdAt",
              "created_at"
            ) || null,

          label:
            `Transcript ${
              index + 1
            }`
        };
      }
    )
    .filter(
      (transcript) =>
        transcript.text ||
        transcript.status
    );
}

/*
|--------------------------------------------------------------------------
| File Size
|--------------------------------------------------------------------------
*/

function formatFileSize(
  bytes
) {
  const size =
    Number(bytes);

  if (
    !Number.isFinite(size) ||
    size < 0
  ) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  if (
    size <
    1024 *
      1024 *
      1024
  ) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    size /
    (
      1024 *
      1024 *
      1024
    )
  ).toFixed(1)} GB`;
}

/*
|--------------------------------------------------------------------------
| Main Entry Normalisation
|--------------------------------------------------------------------------
*/

export function normalizeJournalEntryForExport(
  entry
) {
  const mood =
    normalizeMood(
      entry
    );

  const prompt =
    normalizePrompt(
      entry
    );

  return {
    id:
      readField(
        entry,
        "entryId",
        "entry_id",
        "id"
      ) || null,

    title:
      String(
        readField(
          entry,
          "title",
          "entryTitle",
          "entry_title"
        ) ||
        "Untitled reflection"
      ),

    content:
      String(
        readField(
          entry,
          "content",
          "body",
          "text"
        ) || ""
      ),

    entryDate:
      readField(
        entry,
        "entryDate",
        "entry_date"
      ) ||
      readField(
        entry,
        "createdAt",
        "created_at"
      ) ||
      null,

    entryType:
      String(
        readField(
          entry,
          "entryType",
          "entry_type",
          "type"
        ) || ""
      ),

    status:
      String(
        readField(
          entry,
          "status",
          "entryStatus",
          "entry_status"
        ) || ""
      ),

    mood,

    prompt,

    tags:
      normalizeTags(
        entry
      ),

    emotions:
      normalizeEmotions(
        entry
      ),

    activities:
      normalizeActivities(
        entry
      ),

    attachments:
      normalizeAttachments(
        entry
      ),

    voiceTranscripts:
      normalizeVoiceTranscripts(
        entry
      ),

    favourite:
      Boolean(
        readField(
          entry,
          "isFavourite",
          "is_favourite",
          "isFavorite",
          "is_favorite",
          "favourite",
          "favorite"
        )
      ),

    previewHidden:
      Boolean(
        readField(
          entry,
          "hidePreview",
          "hide_preview",
          "isPreviewHidden",
          "is_preview_hidden",
          "previewHidden",
          "preview_hidden"
        )
      ),

    createdAt:
      readField(
        entry,
        "createdAt",
        "created_at"
      ) || null,

    updatedAt:
      readField(
        entry,
        "updatedAt",
        "updated_at"
      ) || null,

    completedAt:
      readField(
        entry,
        "completedAt",
        "completed_at"
      ) || null,

    archivedAt:
      readField(
        entry,
        "archivedAt",
        "archived_at"
      ) || null,

    deletedAt:
      readField(
        entry,
        "deletedAt",
        "deleted_at"
      ) || null
  };
}

/*
|--------------------------------------------------------------------------
| Browser Download
|--------------------------------------------------------------------------
*/

function downloadBlob(
  content,
  mimeType,
  filename
) {
  const blob =
    new Blob(
      [content],
      {
        type:
          mimeType
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  window.setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    100
  );
}

/*
|--------------------------------------------------------------------------
| Human Readable TXT
|--------------------------------------------------------------------------
*/

function buildEntryText(
  entry
) {
  const lines = [];

  lines.push(
    entry.title
  );

  lines.push(
    "=".repeat(
      Math.min(
        Math.max(
          entry.title.length,
          15
        ),
        80
      )
    )
  );

  lines.push("");

  if (entry.id) {
    lines.push(
      `Entry ID: ${entry.id}`
    );
  }

  if (entry.entryDate) {
    lines.push(
      `Journal Date: ${formatExportDate(
        entry.entryDate
      )}`
    );
  }

  if (entry.entryType) {
    lines.push(
      `Entry Type: ${entry.entryType}`
    );
  }

  if (entry.status) {
    lines.push(
      `Status: ${entry.status}`
    );
  }

  lines.push(
    `Favourite: ${booleanLabel(
      entry.favourite
    )}`
  );

  lines.push(
    `Preview Hidden: ${booleanLabel(
      entry.previewHidden
    )}`
  );

  if (
    entry.mood.label ||
    hasValue(
      entry.mood.score
    )
  ) {
    const parts = [];

    if (
      entry.mood.label
    ) {
      parts.push(
        entry.mood.label
      );
    }

    if (
      hasValue(
        entry.mood.score
      )
    ) {
      parts.push(
        `Score ${entry.mood.score}`
      );
    }

    lines.push(
      `Mood: ${parts.join(
        " • "
      )}`
    );
  }

  if (
    entry.tags.length
  ) {
    lines.push(
      `Tags: ${entry.tags.join(
        ", "
      )}`
    );
  }

  if (
    entry.emotions.length
  ) {
    lines.push(
      `Emotions: ${entry.emotions
        .map(
          (
            emotion
          ) =>
            hasValue(
              emotion.intensity
            )
              ? `${emotion.name} (${emotion.intensity})`
              : emotion.name
        )
        .join(", ")}`
    );
  }

  if (
    entry.activities.length
  ) {
    lines.push(
      `Activities: ${entry.activities.join(
        ", "
      )}`
    );
  }

  if (
    entry.prompt.text
  ) {
    lines.push("");
    lines.push(
      "Journal Prompt"
    );
    lines.push(
      "--------------"
    );

    if (
      entry.prompt.category
    ) {
      lines.push(
        `Category: ${entry.prompt.category}`
      );
    }

    lines.push(
      entry.prompt.text
    );
  }

  lines.push("");
  lines.push(
    "Reflection"
  );
  lines.push(
    "----------"
  );

  lines.push(
    entry.content ||
      "No written content."
  );

  if (
    entry.voiceTranscripts.length
  ) {
    lines.push("");
    lines.push(
      "Voice Transcript"
    );
    lines.push(
      "----------------"
    );

    entry.voiceTranscripts.forEach(
      (
        transcript,
        index
      ) => {
        lines.push(
          `Transcript ${index + 1}`
        );

        if (
          transcript.status
        ) {
          lines.push(
            `Status: ${transcript.status}`
          );
        }

        if (
          transcript.language
        ) {
          lines.push(
            `Language: ${transcript.language}`
          );
        }

        lines.push(
          transcript.text ||
            "No transcript text."
        );

        lines.push("");
      }
    );
  }

  if (
    entry.attachments.length
  ) {
    lines.push("");
    lines.push(
      "Attachments"
    );
    lines.push(
      "-----------"
    );

    entry.attachments.forEach(
      (
        attachment,
        index
      ) => {
        lines.push(
          `${index + 1}. ${attachment.fileName}`
        );

        if (
          attachment.type
        ) {
          lines.push(
            `   Type: ${attachment.type}`
          );
        }

        if (
          attachment.mimeType
        ) {
          lines.push(
            `   MIME: ${attachment.mimeType}`
          );
        }

        if (
          hasValue(
            attachment.size
          )
        ) {
          lines.push(
            `   Size: ${formatFileSize(
              attachment.size
            )}`
          );
        }

        lines.push(
          `   Cover: ${booleanLabel(
            attachment.isCover
          )}`
        );

        if (
          attachment.processingStatus
        ) {
          lines.push(
            `   Processing: ${attachment.processingStatus}`
          );
        }

        if (
          attachment.url
        ) {
          lines.push(
            `   URL: ${attachment.url}`
          );
        }
      }
    );
  }

  lines.push("");
  lines.push(
    "Entry History"
  );

  lines.push(
    "-------------"
  );

  if (
    entry.createdAt
  ) {
    lines.push(
      `Created: ${formatExportDate(
        entry.createdAt
      )}`
    );
  }

  if (
    entry.updatedAt
  ) {
    lines.push(
      `Updated: ${formatExportDate(
        entry.updatedAt
      )}`
    );
  }

  if (
    entry.completedAt
  ) {
    lines.push(
      `Completed: ${formatExportDate(
        entry.completedAt
      )}`
    );
  }

  if (
    entry.archivedAt
  ) {
    lines.push(
      `Archived: ${formatExportDate(
        entry.archivedAt
      )}`
    );
  }

  if (
    entry.deletedAt
  ) {
    lines.push(
      `Deleted: ${formatExportDate(
        entry.deletedAt
      )}`
    );
  }

  return lines.join(
    "\n"
  );
}

/*
|--------------------------------------------------------------------------
| PDF Writer
|--------------------------------------------------------------------------
*/

function addPdfFooter(
  doc,
  pageNumber
) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    8
  );

  doc.setTextColor(
    120
  );

  doc.text(
    "UNWIND • Private Journal Export",
    18,
    pageHeight - 10
  );

  doc.text(
    `Page ${pageNumber}`,
    pageWidth - 18,
    pageHeight - 10,
    {
      align:
        "right"
    }
  );

  doc.setTextColor(
    0
  );
}

function createPdfWriter(
  doc
) {
  const margin = 18;

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const availableWidth =
    pageWidth -
    margin * 2;

  const bottomLimit =
    pageHeight - 22;

  let y = 20;
  let pageNumber = 1;

  function addPage() {
    addPdfFooter(
      doc,
      pageNumber
    );

    doc.addPage();

    pageNumber += 1;

    y = 20;
  }

  function ensureSpace(
    requiredHeight = 10
  ) {
    if (
      y + requiredHeight >
      bottomLimit
    ) {
      addPage();
    }
  }

  function writeText(
    text,
    {
      fontSize = 10,
      fontStyle =
        "normal",
      spacingAfter = 3,
      lineHeight = 5
    } = {}
  ) {
    if (
      !hasValue(text)
    ) {
      return;
    }

    doc.setFont(
      "helvetica",
      fontStyle
    );

    doc.setFontSize(
      fontSize
    );

    const lines =
      doc.splitTextToSize(
        String(text),
        availableWidth
      );

    lines.forEach(
      (line) => {
        ensureSpace(
          lineHeight + 1
        );

        doc.text(
          line,
          margin,
          y
        );

        y += lineHeight;
      }
    );

    y += spacingAfter;
  }

  function metadata(
    label,
    value
  ) {
    if (
      !hasValue(value)
    ) {
      return;
    }

    writeText(
      `${label}: ${value}`,
      {
        fontSize: 9,
        spacingAfter: 1,
        lineHeight: 4.5
      }
    );
  }

  function section(
    title
  ) {
    ensureSpace(
      14
    );

    y += 3;

    writeText(
      title,
      {
        fontSize: 11,
        fontStyle:
          "bold",
        spacingAfter: 4
      }
    );
  }

  function divider() {
    ensureSpace(
      10
    );

    doc.setDrawColor(
      215
    );

    doc.line(
      margin,
      y,
      pageWidth -
        margin,
      y
    );

    y += 8;
  }

  function finish() {
    addPdfFooter(
      doc,
      pageNumber
    );
  }

  return {
    writeText,
    metadata,
    section,
    divider,
    finish,

    getY:
      () => y,

    setY:
      (value) => {
        y = value;
      }
  };
}

/*
|--------------------------------------------------------------------------
| Render Complete Backend Entry
|--------------------------------------------------------------------------
*/

function writeEntryToPdf(
  doc,
  writer,
  entry,
  {
    includeDivider =
      false
  } = {}
) {
  if (
    includeDivider
  ) {
    writer.divider();
  }

  /*
  |--------------------------------------------------------------------------
  | Heading
  |--------------------------------------------------------------------------
  */

  writer.writeText(
    entry.title,
    {
      fontSize: 18,
      fontStyle:
        "bold",
      spacingAfter: 6,
      lineHeight: 7
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Core Backend Metadata
  |--------------------------------------------------------------------------
  */

  if (entry.id) {
    writer.metadata(
      "Entry ID",
      entry.id
    );
  }

  writer.metadata(
    "Journal Date",
    formatExportDate(
      entry.entryDate
    )
  );

  writer.metadata(
    "Entry Type",
    entry.entryType
  );

  writer.metadata(
    "Status",
    entry.status
  );

  writer.metadata(
    "Favourite",
    booleanLabel(
      entry.favourite
    )
  );

  writer.metadata(
    "Preview Hidden",
    booleanLabel(
      entry.previewHidden
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Mood
  |--------------------------------------------------------------------------
  */

  if (
    entry.mood.label ||
    hasValue(
      entry.mood.score
    )
  ) {
    let moodText =
      entry.mood.label ||
      "";

    if (
      hasValue(
        entry.mood.score
      )
    ) {
      moodText +=
        moodText
          ? ` • Score: ${entry.mood.score}`
          : `Score: ${entry.mood.score}`;
    }

    writer.metadata(
      "Mood",
      moodText
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Tags
  |--------------------------------------------------------------------------
  */

  if (
    entry.tags.length
  ) {
    writer.metadata(
      "Tags",
      entry.tags.join(
        ", "
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Emotions
  |--------------------------------------------------------------------------
  */

  if (
    entry.emotions.length
  ) {
    writer.metadata(
      "Emotions",
      entry.emotions
        .map(
          (
            emotion
          ) => {
            if (
              hasValue(
                emotion.intensity
              )
            ) {
              return `${emotion.name} (${emotion.intensity})`;
            }

            return emotion.name;
          }
        )
        .join(", ")
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Activities
  |--------------------------------------------------------------------------
  */

  if (
    entry.activities.length
  ) {
    writer.metadata(
      "Activities",
      entry.activities.join(
        ", "
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Prompt
  |--------------------------------------------------------------------------
  */

  if (
    entry.prompt.text
  ) {
    writer.section(
      "Journal Prompt"
    );

    if (
      entry.prompt.category
    ) {
      writer.metadata(
        "Category",
        entry.prompt.category
      );
    }

    writer.writeText(
      entry.prompt.text,
      {
        fontSize: 10,
        spacingAfter: 5
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Reflection
  |--------------------------------------------------------------------------
  */

  writer.section(
    "Reflection"
  );

  writer.writeText(
    entry.content ||
      "No written content.",
    {
      fontSize: 11,
      spacingAfter: 6,
      lineHeight: 5.5
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Voice Transcript
  |--------------------------------------------------------------------------
  */

  if (
    entry.voiceTranscripts.length
  ) {
    writer.section(
      entry.voiceTranscripts
        .length === 1
        ? "Voice Transcript"
        : "Voice Transcripts"
    );

    entry.voiceTranscripts.forEach(
      (
        transcript,
        index
      ) => {
        if (
          entry.voiceTranscripts
            .length > 1
        ) {
          writer.writeText(
            `Transcript ${index + 1}`,
            {
              fontSize: 10,
              fontStyle:
                "bold",
              spacingAfter: 2
            }
          );
        }

        writer.metadata(
          "Status",
          transcript.status
        );

        writer.metadata(
          "Language",
          transcript.language
        );

        /*
         * Provider/model are backend processing metadata.
         * They are preserved because this is intended to be
         * a complete journal export.
         */

        writer.metadata(
          "Transcription Provider",
          transcript.provider
        );

        writer.metadata(
          "Transcription Model",
          transcript.model
        );

        writer.writeText(
          transcript.text ||
            "No transcript text stored.",
          {
            fontSize: 10,
            spacingAfter: 5
          }
        );
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Attachments
  |--------------------------------------------------------------------------
  */

  if (
    entry.attachments.length
  ) {
    writer.section(
      entry.attachments
        .length === 1
        ? "Attachment"
        : `Attachments (${entry.attachments.length})`
    );

    entry.attachments.forEach(
      (
        attachment,
        index
      ) => {
        writer.writeText(
          `${index + 1}. ${attachment.fileName}`,
          {
            fontSize: 10,
            fontStyle:
              "bold",
            spacingAfter: 2
          }
        );

        writer.metadata(
          "Media Type",
          attachment.type
        );

        writer.metadata(
          "MIME Type",
          attachment.mimeType
        );

        if (
          hasValue(
            attachment.size
          )
        ) {
          writer.metadata(
            "File Size",
            formatFileSize(
              attachment.size
            )
          );
        }

        if (
          hasValue(
            attachment.duration
          )
        ) {
          writer.metadata(
            "Duration",
            `${attachment.duration} seconds`
          );
        }

        if (
          hasValue(
            attachment.width
          ) &&
          hasValue(
            attachment.height
          )
        ) {
          writer.metadata(
            "Dimensions",
            `${attachment.width} × ${attachment.height}`
          );
        }

        writer.metadata(
          "Cover Attachment",
          booleanLabel(
            attachment.isCover
          )
        );

        writer.metadata(
          "Processing Status",
          attachment.processingStatus
        );

        if (
          attachment.url
        ) {
          writer.metadata(
            "Media URL",
            attachment.url
          );
        }

        if (
          index <
          entry.attachments.length -
            1
        ) {
          writer.setY(
            writer.getY() +
              3
          );
        }
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Entry History
  |--------------------------------------------------------------------------
  */

  writer.section(
    "Entry History"
  );

  writer.metadata(
    "Created",
    formatExportDate(
      entry.createdAt
    )
  );

  writer.metadata(
    "Last Updated",
    formatExportDate(
      entry.updatedAt
    )
  );

  writer.metadata(
    "Completed",
    formatExportDate(
      entry.completedAt
    )
  );

  writer.metadata(
    "Archived",
    formatExportDate(
      entry.archivedAt
    )
  );

  writer.metadata(
    "Deleted",
    formatExportDate(
      entry.deletedAt
    )
  );
}

/*
|--------------------------------------------------------------------------
| Single PDF
|--------------------------------------------------------------------------
*/

export function exportJournalEntryToPdf(
  rawEntry
) {
  const entry =
    normalizeJournalEntryForExport(
      rawEntry
    );

  const doc =
    new jsPDF({
      orientation:
        "portrait",

      unit:
        "mm",

      format:
        "a4"
    });

  const writer =
    createPdfWriter(
      doc
    );

  writer.writeText(
    "UNWIND",
    {
      fontSize: 11,
      fontStyle:
        "bold",
      spacingAfter: 1
    }
  );

  writer.writeText(
    "Private Journal",
    {
      fontSize: 9,
      spacingAfter: 10
    }
  );

  writeEntryToPdf(
    doc,
    writer,
    entry
  );

  writer.finish();

  doc.save(
    `${sanitizeFileName(
      entry.title
    )}-${getTodayFileDate()}.pdf`
  );
}

/*
|--------------------------------------------------------------------------
| Single TXT
|--------------------------------------------------------------------------
*/

export function exportJournalEntryToTxt(
  rawEntry
) {
  const entry =
    normalizeJournalEntryForExport(
      rawEntry
    );

  downloadBlob(
    buildEntryText(
      entry
    ),
    "text/plain;charset=utf-8",
    `${sanitizeFileName(
      entry.title
    )}-${getTodayFileDate()}.txt`
  );
}

/*
|--------------------------------------------------------------------------
| Single JSON
|--------------------------------------------------------------------------
*/

export function exportJournalEntryToJson(
  rawEntry
) {
  const entry =
    normalizeJournalEntryForExport(
      rawEntry
    );

  downloadBlob(
    JSON.stringify(
      {
        application:
          "UNWIND",

        exportVersion:
          2,

        exportType:
          "journal-entry",

        exportedAt:
          new Date()
            .toISOString(),

        entry
      },
      null,
      2
    ),
    "application/json;charset=utf-8",
    `${sanitizeFileName(
      entry.title
    )}-${getTodayFileDate()}.json`
  );
}

/*
|--------------------------------------------------------------------------
| Complete Journal PDF
|--------------------------------------------------------------------------
*/

export function exportJournalToPdf(
  rawEntries = []
) {
  const entries =
    rawEntries.map(
      normalizeJournalEntryForExport
    );

  if (
    entries.length === 0
  ) {
    throw new Error(
      "There are no journal entries to export."
    );
  }

  const doc =
    new jsPDF({
      orientation:
        "portrait",

      unit:
        "mm",

      format:
        "a4"
    });

  const writer =
    createPdfWriter(
      doc
    );

  writer.writeText(
    "UNWIND",
    {
      fontSize: 13,
      fontStyle:
        "bold",
      spacingAfter: 2
    }
  );

  writer.writeText(
    "Private Journal Export",
    {
      fontSize: 21,
      fontStyle:
        "bold",
      spacingAfter: 6
    }
  );

  writer.metadata(
    "Exported",
    formatExportDate(
      new Date()
    )
  );

  writer.metadata(
    "Total Entries",
    entries.length
  );

  writer.setY(
    writer.getY() + 6
  );

  entries.forEach(
    (
      entry,
      index
    ) => {
      writeEntryToPdf(
        doc,
        writer,
        entry,
        {
          includeDivider:
            index > 0
        }
      );
    }
  );

  writer.finish();

  doc.save(
    `unwind-journal-${getTodayFileDate()}.pdf`
  );
}

/*
|--------------------------------------------------------------------------
| Complete Journal TXT
|--------------------------------------------------------------------------
*/

export function exportJournalToTxt(
  rawEntries = []
) {
  const entries =
    rawEntries.map(
      normalizeJournalEntryForExport
    );

  if (
    entries.length === 0
  ) {
    throw new Error(
      "There are no journal entries to export."
    );
  }

  const header = [
    "UNWIND",
    "PRIVATE JOURNAL EXPORT",
    "",
    `Exported: ${formatExportDate(
      new Date()
    )}`,
    `Entries: ${entries.length}`,
    "",
    "#".repeat(72),
    ""
  ].join(
    "\n"
  );

  const body =
    entries
      .map(
        buildEntryText
      )
      .join(
        `\n\n${"#".repeat(
          72
        )}\n\n`
      );

  downloadBlob(
    header + body,
    "text/plain;charset=utf-8",
    `unwind-journal-${getTodayFileDate()}.txt`
  );
}

/*
|--------------------------------------------------------------------------
| Complete Journal JSON
|--------------------------------------------------------------------------
*/

export function exportJournalToJson(
  rawEntries = []
) {
  const entries =
    rawEntries.map(
      normalizeJournalEntryForExport
    );

  if (
    entries.length === 0
  ) {
    throw new Error(
      "There are no journal entries to export."
    );
  }

  downloadBlob(
    JSON.stringify(
      {
        application:
          "UNWIND",

        exportVersion:
          2,

        exportType:
          "journal",

        exportedAt:
          new Date()
            .toISOString(),

        entryCount:
          entries.length,

        entries
      },
      null,
      2
    ),
    "application/json;charset=utf-8",
    `unwind-journal-${getTodayFileDate()}.json`
  );
}

/*
|--------------------------------------------------------------------------
| Generic Single Entry Export
|--------------------------------------------------------------------------
*/

export function exportJournalEntry(
  entry,
  format = "pdf"
) {
  switch (
    String(format)
      .toLowerCase()
  ) {
    case "pdf":
      return exportJournalEntryToPdf(
        entry
      );

    case "txt":
      return exportJournalEntryToTxt(
        entry
      );

    case "json":
      return exportJournalEntryToJson(
        entry
      );

    default:
      throw new Error(
        `Unsupported export format: ${format}`
      );
  }
}

/*
|--------------------------------------------------------------------------
| Generic Journal Export
|--------------------------------------------------------------------------
*/

export function exportJournal(
  entries,
  format = "pdf"
) {
  switch (
    String(format)
      .toLowerCase()
  ) {
    case "pdf":
      return exportJournalToPdf(
        entries
      );

    case "txt":
      return exportJournalToTxt(
        entries
      );

    case "json":
      return exportJournalToJson(
        entries
      );

    default:
      throw new Error(
        `Unsupported export format: ${format}`
      );
  }
}