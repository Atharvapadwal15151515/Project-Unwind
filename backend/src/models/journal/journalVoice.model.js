import pool from "../../config/database.js";

/*
  Use the supplied PostgreSQL transaction client when available.
  Otherwise, use the normal database connection pool.
*/
function getDatabase(client) {
  return client || pool;
}

/*
  Create a voice-transcript record for an existing
  audio attachment.

  The database trigger verifies that:
  - the attachment exists
  - the attachment belongs to the user
  - the attachment belongs to the entry
  - the attachment type is audio
  - the attachment is not deleted
*/
export async function createJournalVoiceTranscript(
  {
    userId,
    entryId,
    attachmentId,
    transcript = null,
    originalTranscript = null,
    transcriptStatus = "pending",
    transcriptLanguage = null,
    detectedLanguage = null,
    transcriptionProvider = null,
    transcriptionModel = null,
    transcriptionConfidence = null,
    transcriptionError = null,
    transcriptionStartedAt = null,
    transcriptionCompletedAt = null,
    isTranscriptEdited = false,
    transcriptEditedAt = null,
    transcriptWordCount = 0,
    retryCount = 0,
    lastRetryAt = null
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_voice_transcripts (
      user_id,
      entry_id,
      attachment_id,
      transcript,
      original_transcript,
      transcript_status,
      transcript_language,
      detected_language,
      transcription_provider,
      transcription_model,
      transcription_confidence,
      transcription_error,
      transcription_started_at,
      transcription_completed_at,
      is_transcript_edited,
      transcript_edited_at,
      transcript_word_count,
      retry_count,
      last_retry_at
    )
    VALUES (
      $1::uuid,
      $2::uuid,
      $3::uuid,
      $4::text,
      $5::text,
      $6::varchar,
      $7::varchar,
      $8::varchar,
      $9::varchar,
      $10::varchar,
      $11::numeric,
      $12::text,
      $13::timestamptz,
      $14::timestamptz,
      $15::boolean,
      $16::timestamptz,
      $17::integer,
      $18::integer,
      $19::timestamptz
    )
    RETURNING *;
  `;

  const values = [
    userId,
    entryId,
    attachmentId,
    transcript,
    originalTranscript,
    transcriptStatus,
    transcriptLanguage,
    detectedLanguage,
    transcriptionProvider,
    transcriptionModel,
    transcriptionConfidence,
    transcriptionError,
    transcriptionStartedAt,
    transcriptionCompletedAt,
    isTranscriptEdited,
    transcriptEditedAt,
    transcriptWordCount,
    retryCount,
    lastRetryAt
  ];

  const { rows } = await db.query(
    query,
    values
  );

  return rows[0];
}

/*
  Get a voice-transcript record by ID without
  applying ownership or deletion filters.

  This is primarily useful for ownership middleware.
*/
export async function getJournalVoiceTranscriptById(
  voiceTranscriptId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_voice_transcripts
    WHERE voice_transcript_id = $1::uuid
    LIMIT 1;
  `;

  const { rows } = await db.query(
    query,
    [voiceTranscriptId]
  );

  return rows[0] || null;
}

/*
  Get a voice-transcript record belonging to a user.

  By default, deleted records are excluded.
*/
export async function getOwnedJournalVoiceTranscriptById(
  voiceTranscriptId,
  userId,
  {
    includeDeleted = false
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jvt.voice_transcript_id = $1::uuid",
    "jvt.user_id = $2::uuid"
  ];

  if (!includeDeleted) {
    conditions.push(
      "jvt.is_deleted = FALSE"
    );
  }

  const query = `
    SELECT jvt.*
    FROM journal_voice_transcripts AS jvt
    WHERE ${conditions.join(" AND ")}
    LIMIT 1;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Get an active voice-transcript record with its
  related audio attachment metadata.
*/
export async function getJournalVoiceTranscriptDetails(
  voiceTranscriptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      jvt.*,

      jsonb_build_object(
        'attachment_id',
        ja.attachment_id,
        'entry_id',
        ja.entry_id,
        'attachment_type',
        ja.attachment_type,
        'original_file_name',
        ja.original_file_name,
        'stored_file_name',
        ja.stored_file_name,
        'file_url',
        ja.file_url,
        'file_public_id',
        ja.file_public_id,
        'file_format',
        ja.file_format,
        'mime_type',
        ja.mime_type,
        'file_size_bytes',
        ja.file_size_bytes,
        'file_extension',
        ja.file_extension,
        'duration_seconds',
        ja.duration_seconds,
        'caption',
        ja.caption,
        'processing_status',
        ja.processing_status,
        'is_processed',
        ja.is_processed,
        'created_at',
        ja.created_at,
        'updated_at',
        ja.updated_at
      ) AS attachment

    FROM journal_voice_transcripts AS jvt

    INNER JOIN journal_attachments AS ja
      ON ja.attachment_id =
         jvt.attachment_id

    WHERE
      jvt.voice_transcript_id =
        $1::uuid

      AND jvt.user_id =
        $2::uuid

      AND jvt.is_deleted =
        FALSE

      AND ja.is_deleted =
        FALSE

    LIMIT 1;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Get a voice-transcript record using its
  attachment ID.
*/
export async function getJournalVoiceTranscriptByAttachmentId(
  attachmentId,
  userId,
  {
    includeDeleted = false
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "attachment_id = $1::uuid",
    "user_id = $2::uuid"
  ];

  if (!includeDeleted) {
    conditions.push(
      "is_deleted = FALSE"
    );
  }

  const query = `
    SELECT *
    FROM journal_voice_transcripts
    WHERE ${conditions.join(" AND ")}
    LIMIT 1;
  `;

  const { rows } = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Get every active voice transcript belonging
  to one journal entry.
*/
export async function getJournalEntryVoiceTranscripts(
  entryId,
  userId,
  {
    transcriptStatus = null,
    includeDeleted = false
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const values = [
    entryId,
    userId
  ];

  const conditions = [
    "jvt.entry_id = $1::uuid",
    "jvt.user_id = $2::uuid"
  ];

  if (!includeDeleted) {
    conditions.push(
      "jvt.is_deleted = FALSE"
    );

    conditions.push(
      "ja.is_deleted = FALSE"
    );
  }

  if (transcriptStatus) {
    values.push(transcriptStatus);

    conditions.push(
      `jvt.transcript_status =
       $${values.length}::varchar`
    );
  }

  const query = `
    SELECT
      jvt.*,

      jsonb_build_object(
        'attachment_id',
        ja.attachment_id,
        'original_file_name',
        ja.original_file_name,
        'file_url',
        ja.file_url,
        'file_public_id',
        ja.file_public_id,
        'file_format',
        ja.file_format,
        'mime_type',
        ja.mime_type,
        'file_size_bytes',
        ja.file_size_bytes,
        'duration_seconds',
        ja.duration_seconds,
        'caption',
        ja.caption,
        'processing_status',
        ja.processing_status,
        'is_processed',
        ja.is_processed,
        'created_at',
        ja.created_at
      ) AS attachment

    FROM journal_voice_transcripts AS jvt

    INNER JOIN journal_attachments AS ja
      ON ja.attachment_id =
         jvt.attachment_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY
      ja.attachment_order ASC,
      jvt.created_at ASC;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows;
}

/*
  Get paginated voice-transcript records for a user.

  Supported filters:

  entryId
  attachmentId
  transcriptStatus
  transcriptLanguage
  transcriptionProvider
  isTranscriptEdited
  isDeleted
  dateFrom
  dateTo
  search
  limit
  offset
*/
export async function getUserJournalVoiceTranscripts(
  userId,
  {
    entryId = null,
    attachmentId = null,
    transcriptStatus = null,
    transcriptLanguage = null,
    transcriptionProvider = null,
    isTranscriptEdited = null,
    isDeleted = false,
    dateFrom = null,
    dateTo = null,
    search = null,
    limit = 20,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const values = [userId];

  const conditions = [
    "jvt.user_id = $1::uuid"
  ];

  function addValue(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (entryId) {
    const parameter =
      addValue(entryId);

    conditions.push(
      `jvt.entry_id =
       ${parameter}::uuid`
    );
  }

  if (attachmentId) {
    const parameter =
      addValue(attachmentId);

    conditions.push(
      `jvt.attachment_id =
       ${parameter}::uuid`
    );
  }

  if (transcriptStatus) {
    const parameter =
      addValue(transcriptStatus);

    conditions.push(
      `jvt.transcript_status =
       ${parameter}::varchar`
    );
  }

  if (transcriptLanguage) {
    const parameter =
      addValue(transcriptLanguage);

    conditions.push(
      `jvt.transcript_language =
       ${parameter}::varchar`
    );
  }

  if (transcriptionProvider) {
    const parameter =
      addValue(transcriptionProvider);

    conditions.push(
      `jvt.transcription_provider =
       ${parameter}::varchar`
    );
  }

  if (
    typeof isTranscriptEdited ===
    "boolean"
  ) {
    const parameter =
      addValue(isTranscriptEdited);

    conditions.push(
      `jvt.is_transcript_edited =
       ${parameter}::boolean`
    );
  }

  if (
    typeof isDeleted === "boolean"
  ) {
    const parameter =
      addValue(isDeleted);

    conditions.push(
      `jvt.is_deleted =
       ${parameter}::boolean`
    );
  } else {
    conditions.push(
      "jvt.is_deleted = FALSE"
    );
  }

  if (dateFrom) {
    const parameter =
      addValue(dateFrom);

    conditions.push(
      `jvt.created_at >=
       ${parameter}::timestamptz`
    );
  }

  if (dateTo) {
    const parameter =
      addValue(dateTo);

    conditions.push(
      `jvt.created_at <=
       ${parameter}::timestamptz`
    );
  }

  if (search) {
    const parameter =
      addValue(`%${search}%`);

    conditions.push(`
      (
        COALESCE(
          jvt.transcript,
          ''
        ) ILIKE ${parameter}

        OR COALESCE(
          jvt.original_transcript,
          ''
        ) ILIKE ${parameter}

        OR COALESCE(
          ja.original_file_name,
          ''
        ) ILIKE ${parameter}

        OR COALESCE(
          ja.caption,
          ''
        ) ILIKE ${parameter}
      )
    `);
  }

  const limitParameter =
    addValue(limit);

  const offsetParameter =
    addValue(offset);

  const query = `
    SELECT
      jvt.*,

      jsonb_build_object(
        'attachment_id',
        ja.attachment_id,
        'original_file_name',
        ja.original_file_name,
        'file_url',
        ja.file_url,
        'file_public_id',
        ja.file_public_id,
        'file_format',
        ja.file_format,
        'mime_type',
        ja.mime_type,
        'file_size_bytes',
        ja.file_size_bytes,
        'duration_seconds',
        ja.duration_seconds,
        'caption',
        ja.caption,
        'processing_status',
        ja.processing_status,
        'is_processed',
        ja.is_processed,
        'created_at',
        ja.created_at
      ) AS attachment

    FROM journal_voice_transcripts AS jvt

    INNER JOIN journal_attachments AS ja
      ON ja.attachment_id =
         jvt.attachment_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY
      jvt.created_at DESC

    LIMIT ${limitParameter}::integer
    OFFSET ${offsetParameter}::integer;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows;
}

/*
  Count voice-transcript records using the same
  filters as the paginated list.
*/
export async function countUserJournalVoiceTranscripts(
  userId,
  {
    entryId = null,
    attachmentId = null,
    transcriptStatus = null,
    transcriptLanguage = null,
    transcriptionProvider = null,
    isTranscriptEdited = null,
    isDeleted = false,
    dateFrom = null,
    dateTo = null,
    search = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const values = [userId];

  const conditions = [
    "jvt.user_id = $1::uuid"
  ];

  function addValue(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (entryId) {
    const parameter =
      addValue(entryId);

    conditions.push(
      `jvt.entry_id =
       ${parameter}::uuid`
    );
  }

  if (attachmentId) {
    const parameter =
      addValue(attachmentId);

    conditions.push(
      `jvt.attachment_id =
       ${parameter}::uuid`
    );
  }

  if (transcriptStatus) {
    const parameter =
      addValue(transcriptStatus);

    conditions.push(
      `jvt.transcript_status =
       ${parameter}::varchar`
    );
  }

  if (transcriptLanguage) {
    const parameter =
      addValue(transcriptLanguage);

    conditions.push(
      `jvt.transcript_language =
       ${parameter}::varchar`
    );
  }

  if (transcriptionProvider) {
    const parameter =
      addValue(transcriptionProvider);

    conditions.push(
      `jvt.transcription_provider =
       ${parameter}::varchar`
    );
  }

  if (
    typeof isTranscriptEdited ===
    "boolean"
  ) {
    const parameter =
      addValue(isTranscriptEdited);

    conditions.push(
      `jvt.is_transcript_edited =
       ${parameter}::boolean`
    );
  }

  if (
    typeof isDeleted === "boolean"
  ) {
    const parameter =
      addValue(isDeleted);

    conditions.push(
      `jvt.is_deleted =
       ${parameter}::boolean`
    );
  } else {
    conditions.push(
      "jvt.is_deleted = FALSE"
    );
  }

  if (dateFrom) {
    const parameter =
      addValue(dateFrom);

    conditions.push(
      `jvt.created_at >=
       ${parameter}::timestamptz`
    );
  }

  if (dateTo) {
    const parameter =
      addValue(dateTo);

    conditions.push(
      `jvt.created_at <=
       ${parameter}::timestamptz`
    );
  }

  if (search) {
    const parameter =
      addValue(`%${search}%`);

    conditions.push(`
      (
        COALESCE(
          jvt.transcript,
          ''
        ) ILIKE ${parameter}

        OR COALESCE(
          jvt.original_transcript,
          ''
        ) ILIKE ${parameter}

        OR COALESCE(
          ja.original_file_name,
          ''
        ) ILIKE ${parameter}

        OR COALESCE(
          ja.caption,
          ''
        ) ILIKE ${parameter}
      )
    `);
  }

  const query = `
    SELECT
      COUNT(*)::integer AS total

    FROM journal_voice_transcripts AS jvt

    INNER JOIN journal_attachments AS ja
      ON ja.attachment_id =
         jvt.attachment_id

    WHERE ${conditions.join(" AND ")};
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows[0]?.total || 0;
}

/*
  Mark a transcript as currently being processed.

  This clears previous errors and completion data.
*/
export async function markJournalVoiceTranscriptProcessing(
  voiceTranscriptId,
  userId,
  {
    transcriptionProvider = null,
    transcriptionModel = null,
    transcriptLanguage = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      transcript_status =
        'processing',

      transcription_provider =
        COALESCE(
          $3::varchar,
          transcription_provider
        ),

      transcription_model =
        COALESCE(
          $4::varchar,
          transcription_model
        ),

      transcript_language =
        COALESCE(
          $5::varchar,
          transcript_language
        ),

      transcription_error =
        NULL,

      transcription_started_at =
        NOW(),

      transcription_completed_at =
        NULL,

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId,
      transcriptionProvider,
      transcriptionModel,
      transcriptLanguage
    ]
  );

  return rows[0] || null;
}

/*
  Save a successful transcription result.

  The first generated transcript is preserved in
  original_transcript.

  If transcription is run again, original_transcript
  remains unchanged while transcript is replaced by
  the newest result.
*/
export async function completeJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  {
    transcript,
    transcriptWordCount = 0,
    transcriptLanguage = null,
    detectedLanguage = null,
    transcriptionProvider = null,
    transcriptionModel = null,
    transcriptionConfidence = null
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      transcript =
        $3::text,

      original_transcript =
        COALESCE(
          original_transcript,
          $3::text
        ),

      transcript_status =
        'completed',

      transcript_language =
        COALESCE(
          $4::varchar,
          transcript_language
        ),

      detected_language =
        $5::varchar,

      transcription_provider =
        COALESCE(
          $6::varchar,
          transcription_provider
        ),

      transcription_model =
        COALESCE(
          $7::varchar,
          transcription_model
        ),

      transcription_confidence =
        $8::numeric,

      transcription_error =
        NULL,

      transcription_started_at =
        COALESCE(
          transcription_started_at,
          NOW()
        ),

      transcription_completed_at =
        NOW(),

      is_transcript_edited =
        FALSE,

      transcript_edited_at =
        NULL,

      transcript_word_count =
        $9::integer,

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId,
      transcript,
      transcriptLanguage,
      detectedLanguage,
      transcriptionProvider,
      transcriptionModel,
      transcriptionConfidence,
      transcriptWordCount
    ]
  );

  return rows[0] || null;
}

/*
  Save a failed transcription attempt.
*/
export async function failJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  {
    transcriptionError,
    transcriptionProvider = null,
    transcriptionModel = null
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      transcript_status =
        'failed',

      transcription_provider =
        COALESCE(
          $3::varchar,
          transcription_provider
        ),

      transcription_model =
        COALESCE(
          $4::varchar,
          transcription_model
        ),

      transcription_error =
        $5::text,

      transcription_started_at =
        COALESCE(
          transcription_started_at,
          NOW()
        ),

      transcription_completed_at =
        NULL,

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId,
      transcriptionProvider,
      transcriptionModel,
      transcriptionError
    ]
  );

  return rows[0] || null;
}

/*
  Prepare a failed or completed transcript for
  another transcription attempt.

  The actual transcription process should begin
  after this function returns.
*/
export async function retryJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      transcript_status =
        'pending',

      transcription_error =
        NULL,

      transcription_started_at =
        NULL,

      transcription_completed_at =
        NULL,

      retry_count =
        retry_count + 1,

      last_retry_at =
        NOW(),

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

      AND retry_count <
        10

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Update the transcript manually.

  This marks the transcript as edited while keeping
  original_transcript unchanged.
*/
export async function updateJournalVoiceTranscriptText(
  voiceTranscriptId,
  userId,
  {
    transcript,
    transcriptWordCount = 0
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      transcript =
        $3::text,

      transcript_status =
        'completed',

      transcription_error =
        NULL,

      transcription_started_at =
        COALESCE(
          transcription_started_at,
          NOW()
        ),

      transcription_completed_at =
        COALESCE(
          transcription_completed_at,
          NOW()
        ),

      is_transcript_edited =
        TRUE,

      transcript_edited_at =
        NOW(),

      transcript_word_count =
        $4::integer,

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId,
      transcript,
      transcriptWordCount
    ]
  );

  return rows[0] || null;
}

/*
  Restore the current transcript text to the
  originally generated transcription.
*/
export async function restoreOriginalJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      transcript =
        original_transcript,

      transcript_status =
        'completed',

      transcription_error =
        NULL,

      transcription_started_at =
        COALESCE(
          transcription_started_at,
          NOW()
        ),

      transcription_completed_at =
        COALESCE(
          transcription_completed_at,
          NOW()
        ),

      is_transcript_edited =
        FALSE,

      transcript_edited_at =
        NULL,

      transcript_word_count =
        CASE
          WHEN original_transcript
               IS NULL
          THEN 0

          WHEN BTRIM(
            original_transcript
          ) = ''
          THEN 0

          ELSE CARDINALITY(
            REGEXP_SPLIT_TO_ARRAY(
              BTRIM(
                original_transcript
              ),
              '\\s+'
            )
          )
        END,

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

      AND original_transcript
        IS NOT NULL

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Update voice-transcript metadata without changing
  the transcript text or its processing status.
*/
export async function updateJournalVoiceTranscriptMetadata(
  voiceTranscriptId,
  userId,
  {
    transcriptLanguage,
    detectedLanguage,
    transcriptionProvider,
    transcriptionModel,
    transcriptionConfidence
  },
  client = null
) {
  const db = getDatabase(client);

  const updates = [];
  const values = [];

  function addUpdate(
    column,
    value,
    cast
  ) {
    values.push(value);

    updates.push(
      `${column} =
       $${values.length}::${cast}`
    );
  }

  if (
    transcriptLanguage !== undefined
  ) {
    addUpdate(
      "transcript_language",
      transcriptLanguage,
      "varchar"
    );
  }

  if (
    detectedLanguage !== undefined
  ) {
    addUpdate(
      "detected_language",
      detectedLanguage,
      "varchar"
    );
  }

  if (
    transcriptionProvider !==
    undefined
  ) {
    addUpdate(
      "transcription_provider",
      transcriptionProvider,
      "varchar"
    );
  }

  if (
    transcriptionModel !== undefined
  ) {
    addUpdate(
      "transcription_model",
      transcriptionModel,
      "varchar"
    );
  }

  if (
    transcriptionConfidence !==
    undefined
  ) {
    addUpdate(
      "transcription_confidence",
      transcriptionConfidence,
      "numeric"
    );
  }

  if (updates.length === 0) {
    return getOwnedJournalVoiceTranscriptById(
      voiceTranscriptId,
      userId,
      {
        includeDeleted: false
      },
      client
    );
  }

  values.push(voiceTranscriptId);

  const voiceTranscriptIdParameter =
    `$${values.length}`;

  values.push(userId);

  const userIdParameter =
    `$${values.length}`;

  const query = `
    UPDATE journal_voice_transcripts
    SET
      ${updates.join(", ")},
      updated_at = NOW()

    WHERE
      voice_transcript_id =
        ${voiceTranscriptIdParameter}::uuid

      AND user_id =
        ${userIdParameter}::uuid

      AND is_deleted =
        FALSE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows[0] || null;
}

/*
  Search completed transcripts using PostgreSQL
  full-text search.

  The SQL table contains a matching GIN index on:
  to_tsvector('simple', transcript)
*/
export async function searchJournalVoiceTranscripts(
  userId,
  searchQuery,
  {
    entryId = null,
    transcriptLanguage = null,
    limit = 20,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const values = [
    userId,
    searchQuery
  ];

  const conditions = [
    "jvt.user_id = $1::uuid",
    "jvt.is_deleted = FALSE",
    "ja.is_deleted = FALSE",
    "jvt.transcript_status = 'completed'",
    "jvt.transcript IS NOT NULL",
    `
      to_tsvector(
        'simple',
        COALESCE(
          jvt.transcript,
          ''
        )
      )
      @@
      websearch_to_tsquery(
        'simple',
        $2::text
      )
    `
  ];

  if (entryId) {
    values.push(entryId);

    conditions.push(
      `jvt.entry_id =
       $${values.length}::uuid`
    );
  }

  if (transcriptLanguage) {
    values.push(
      transcriptLanguage
    );

    conditions.push(
      `jvt.transcript_language =
       $${values.length}::varchar`
    );
  }

  values.push(limit);

  const limitParameter =
    `$${values.length}`;

  values.push(offset);

  const offsetParameter =
    `$${values.length}`;

  const query = `
    SELECT
      jvt.*,

      ts_rank(
        to_tsvector(
          'simple',
          COALESCE(
            jvt.transcript,
            ''
          )
        ),
        websearch_to_tsquery(
          'simple',
          $2::text
        )
      ) AS search_rank,

      ts_headline(
        'simple',
        jvt.transcript,
        websearch_to_tsquery(
          'simple',
          $2::text
        ),
        'MaxWords=30, MinWords=10'
      ) AS search_excerpt,

      jsonb_build_object(
        'attachment_id',
        ja.attachment_id,
        'original_file_name',
        ja.original_file_name,
        'file_url',
        ja.file_url,
        'file_public_id',
        ja.file_public_id,
        'file_format',
        ja.file_format,
        'mime_type',
        ja.mime_type,
        'file_size_bytes',
        ja.file_size_bytes,
        'duration_seconds',
        ja.duration_seconds,
        'caption',
        ja.caption,
        'created_at',
        ja.created_at
      ) AS attachment

    FROM journal_voice_transcripts AS jvt

    INNER JOIN journal_attachments AS ja
      ON ja.attachment_id =
         jvt.attachment_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY
      search_rank DESC,
      jvt.created_at DESC

    LIMIT ${limitParameter}::integer
    OFFSET ${offsetParameter}::integer;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows;
}

/*
  Soft-delete a voice-transcript record.

  The related journal attachment should be
  soft-deleted separately by the service layer,
  inside the same transaction.
*/
export async function softDeleteJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      is_deleted =
        TRUE,

      deleted_at =
        NOW(),

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        FALSE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Restore a soft-deleted voice-transcript record.

  The related journal attachment should be restored
  separately by the service layer, inside the same
  transaction.
*/
export async function restoreJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_voice_transcripts
    SET
      is_deleted =
        FALSE,

      deleted_at =
        NULL,

      updated_at =
        NOW()

    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

      AND is_deleted =
        TRUE

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Permanently delete a voice-transcript record.

  Deleting the related journal attachment will also
  remove this row automatically because the database
  foreign key uses ON DELETE CASCADE.

  This direct function is available when the service
  needs to delete only the transcript record.
*/
export async function permanentlyDeleteJournalVoiceTranscript(
  voiceTranscriptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_voice_transcripts
    WHERE
      voice_transcript_id =
        $1::uuid

      AND user_id =
        $2::uuid

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      voiceTranscriptId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
  Permanently delete a voice-transcript record using
  its attachment ID.

  This is useful when attachment deletion is the main
  operation.
*/
export async function permanentlyDeleteJournalVoiceTranscriptByAttachmentId(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_voice_transcripts
    WHERE
      attachment_id =
        $1::uuid

      AND user_id =
        $2::uuid

    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return rows[0] || null;
}