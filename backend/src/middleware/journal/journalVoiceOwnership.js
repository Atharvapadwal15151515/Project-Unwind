import {
  getOwnedJournalVoiceTranscriptById
} from "../../models/journal/journalVoice.model.js";

import AppError from "../../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Helpers
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

function getVoiceTranscriptId(req) {
  return (
    req.params?.voiceTranscriptId ||
    null
  );
}

function attachVoiceTranscript(
  req,
  voiceTranscript
) {
  req.voiceTranscript =
    voiceTranscript;

  req.journalVoiceTranscript =
    voiceTranscript;
}

async function findOwnedVoiceTranscript({
  req,
  includeDeleted = false
}) {
  const userId =
    getAuthenticatedUserId(req);

  const voiceTranscriptId =
    getVoiceTranscriptId(req);

  if (!userId) {
    throw new AppError(
      "Authentication is required.",
      401
    );
  }

  if (!voiceTranscriptId) {
    throw new AppError(
      "Voice transcript ID is required.",
      400
    );
  }

  const voiceTranscript =
    await getOwnedJournalVoiceTranscriptById(
      voiceTranscriptId,
      userId,
      {
        includeDeleted
      }
    );

  if (!voiceTranscript) {
    throw new AppError(
      "Voice transcript was not found.",
      404
    );
  }

  return voiceTranscript;
}

/*
|--------------------------------------------------------------------------
| Active Voice Transcript Ownership
|--------------------------------------------------------------------------
|
| Used for normal operations where deleted transcripts are not allowed.
|
*/

export async function requireJournalVoiceOwnership(
  req,
  res,
  next
) {
  try {
    const voiceTranscript =
      await findOwnedVoiceTranscript({
        req,
        includeDeleted: false
      });

    attachVoiceTranscript(
      req,
      voiceTranscript
    );

    next();
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Route-Compatible Ownership Export
|--------------------------------------------------------------------------
|
| journalVoice.routes.js currently imports:
|
| requireVoiceTranscriptOwnership
|
| This function preserves that exact route name while using the main
| ownership middleware above.
|
*/

export async function requireVoiceTranscriptOwnership(
  req,
  res,
  next
) {
  return requireJournalVoiceOwnership(
    req,
    res,
    next
  );
}

/*
|--------------------------------------------------------------------------
| Deleted Voice Transcript Ownership
|--------------------------------------------------------------------------
|
| Used for restoring a soft-deleted transcript.
|
*/

export async function requireDeletedJournalVoiceOwnership(
  req,
  res,
  next
) {
  try {
    const voiceTranscript =
      await findOwnedVoiceTranscript({
        req,
        includeDeleted: true
      });

    if (
      voiceTranscript.is_deleted !==
      true
    ) {
      throw new AppError(
        "Voice transcript is not deleted.",
        409
      );
    }

    attachVoiceTranscript(
      req,
      voiceTranscript
    );

    next();
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Any Voice Transcript Ownership
|--------------------------------------------------------------------------
|
| Allows both active and soft-deleted transcripts.
| Used primarily for permanent deletion.
|
*/

export async function requireAnyJournalVoiceOwnership(
  req,
  res,
  next
) {
  try {
    const voiceTranscript =
      await findOwnedVoiceTranscript({
        req,
        includeDeleted: true
      });

    attachVoiceTranscript(
      req,
      voiceTranscript
    );

    next();
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Completed Voice Transcript
|--------------------------------------------------------------------------
|
| Used before operations that require completed transcript text:
|
| - editing transcript text
| - restoring the original AI transcript
|
*/

export async function requireCompletedJournalVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const voiceTranscript =
      await findOwnedVoiceTranscript({
        req,
        includeDeleted: false
      });

    if (
      voiceTranscript.transcript_status !==
      "completed"
    ) {
      throw new AppError(
        "Voice transcription must be completed before this operation.",
        409
      );
    }

    if (
      typeof voiceTranscript.transcript !==
        "string" ||
      !voiceTranscript.transcript.trim()
    ) {
      throw new AppError(
        "Completed transcript text is not available.",
        409
      );
    }

    attachVoiceTranscript(
      req,
      voiceTranscript
    );

    next();
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Failed Voice Transcript
|--------------------------------------------------------------------------
|
| Used before retrying transcription.
|
*/

export async function requireFailedJournalVoiceTranscript(
  req,
  res,
  next
) {
  try {
    const voiceTranscript =
      await findOwnedVoiceTranscript({
        req,
        includeDeleted: false
      });

    if (
      voiceTranscript.transcript_status !==
      "failed"
    ) {
      throw new AppError(
        "Only failed voice transcriptions can be retried.",
        409
      );
    }

    const retryCount =
      Number(
        voiceTranscript.retry_count ??
          0
      );

    if (retryCount >= 10) {
      throw new AppError(
        "Maximum transcription retry limit has been reached.",
        409
      );
    }

    attachVoiceTranscript(
      req,
      voiceTranscript
    );

    next();
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| Transcription Availability
|--------------------------------------------------------------------------
|
| Prevents duplicate processing while transcription is already running.
|
*/

export async function requireJournalVoiceTranscriptionAvailable(
  req,
  res,
  next
) {
  try {
    const voiceTranscript =
      await findOwnedVoiceTranscript({
        req,
        includeDeleted: false
      });

    if (
      voiceTranscript.transcript_status ===
      "processing"
    ) {
      throw new AppError(
        "Voice transcription is already being processed.",
        409
      );
    }

    attachVoiceTranscript(
      req,
      voiceTranscript
    );

    next();
  } catch (error) {
    next(error);
  }
}