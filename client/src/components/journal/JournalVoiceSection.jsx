import {
  useEffect,
  useState
} from "react";


import JournalVoiceRecorder
  from "./JournalVoiceRecorder";


import JournalVoiceTranscript
  from "./JournalVoiceTranscript";


import {
  getJournalEntryId
} from "../../utils/journalUtils";


import {
  deleteJournalAttachment,
  permanentlyDeleteJournalAttachment,
  uploadJournalAttachment
} from "../../services/journalAttachmentService";


import {
  createAndTranscribeVoiceJournal,
  getEntryVoiceTranscripts,
  getJournalVoiceError
} from "../../services/journalVoiceService";


function getAttachmentId(
  attachment
) {
  return (
    attachment
      ?.attachmentId ||
    attachment
      ?.attachment_id ||
    attachment?.id ||
    null
  );
}


function getTranscriptId(
  transcript
) {
  return (
    transcript
      ?.voiceTranscriptId ||
    transcript
      ?.voice_transcript_id ||
    transcript?.id ||
    null
  );
}


function getTranscriptText(
  transcript
) {
  return (
    transcript?.transcript ||
    transcript
      ?.transcriptText ||
    transcript
      ?.transcript_text ||
    ""
  );
}


function JournalVoiceSection({
  entry,
  disabled = false,
  onRequireEntry,
  onVoiceCreated
}) {
  const [
    transcripts,
    setTranscripts
  ] = useState([]);


  const [
    processing,
    setProcessing
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  /*
   * Actual recording selected in
   * JournalVoiceRecorder.
   */
  const [
    pendingAudioFile,
    setPendingAudioFile
  ] = useState(null);


  /*
   * Attachment created when the user
   * chooses "Use voice note".
   *
   * For speech-to-text this attachment
   * is only temporary.
   */
  const [
    uploadedAttachment,
    setUploadedAttachment
  ] = useState(null);


  /*
   * Newly created draft entry.
   */
  const [
    resolvedEntry,
    setResolvedEntry
  ] = useState(null);


  /*
   * Increment this whenever the recorder
   * should clear its current recording.
   */
  const [
    recorderResetKey,
    setRecorderResetKey
  ] = useState(0);


  const entryId =
    getJournalEntryId(
      entry
    );


  useEffect(() => {
    if (entryId) {
      setResolvedEntry(
        entry
      );
    }
  }, [
    entry,
    entryId
  ]);


  /*
   * Existing transcripts are still
   * supported for older voice entries.
   *
   * New speech-to-text conversions are
   * converted into normal journal text
   * and therefore will not remain here.
   */
  useEffect(() => {
    if (!entryId) {
      setTranscripts([]);
      return;
    }


    loadTranscripts(
      entryId
    );
  }, [entryId]);


  async function loadTranscripts(
    targetEntryId = entryId
  ) {
    if (!targetEntryId) {
      setTranscripts([]);
      return;
    }


    try {
      const result =
        await getEntryVoiceTranscripts(
          targetEntryId
        );


      setTranscripts(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (
      loadError
    ) {
      console.error(
        "Unable to load voice transcripts:",
        loadError
      );


      setTranscripts([]);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Recorder File
  |--------------------------------------------------------------------------
  */

  function handleAudioReady(
    file
  ) {
    setPendingAudioFile(
      file || null
    );


    /*
     * A new recording cannot reuse
     * the previous attachment.
     */
    setUploadedAttachment(
      null
    );


    setError("");
  }


  /*
  |--------------------------------------------------------------------------
  | Ensure Journal Exists
  |--------------------------------------------------------------------------
  */

  async function ensureJournalEntry() {
    if (
      getJournalEntryId(
        entry
      )
    ) {
      setResolvedEntry(
        entry
      );


      return entry;
    }


    if (
      getJournalEntryId(
        resolvedEntry
      )
    ) {
      return resolvedEntry;
    }


    if (
      typeof onRequireEntry !==
      "function"
    ) {
      throw new Error(
        "Save the journal entry before adding a voice note."
      );
    }


    const createdEntry =
      await onRequireEntry();


    if (
      !getJournalEntryId(
        createdEntry
      )
    ) {
      throw new Error(
        "The journal entry could not be created before adding the voice note."
      );
    }


    setResolvedEntry(
      createdEntry
    );


    return createdEntry;
  }


  /*
  |--------------------------------------------------------------------------
  | Upload Audio
  |--------------------------------------------------------------------------
  */

  async function ensureAudioUploaded(
    file
  ) {
    if (!file) {
      throw new Error(
        "Record or upload a voice note first."
      );
    }


    if (
      uploadedAttachment &&
      getAttachmentId(
        uploadedAttachment
      )
    ) {
      const currentEntry =
        await ensureJournalEntry();


      return {
        entry:
          currentEntry,

        attachment:
          uploadedAttachment
      };
    }


    const currentEntry =
      await ensureJournalEntry();


    const currentEntryId =
      getJournalEntryId(
        currentEntry
      );


    if (!currentEntryId) {
      throw new Error(
        "The journal entry does not have a valid ID."
      );
    }


    const attachment =
      await uploadJournalAttachment(
        currentEntryId,
        file,
        {
          caption:
            "Voice journal recording"
        }
      );


    const attachmentId =
      getAttachmentId(
        attachment
      );


    if (!attachmentId) {
      throw new Error(
        "The uploaded voice attachment did not return an ID."
      );
    }


    setUploadedAttachment(
      attachment
    );


    return {
      entry:
        currentEntry,

      attachment
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Permanently Remove Temporary Transcription Audio
  |--------------------------------------------------------------------------
  |
  | Speech-to-text requires an attachment temporarily.
  |
  | Once we have received the transcript:
  |
  | 1. soft-delete attachment
  | 2. permanently delete attachment
  |
  | Because voice_transcripts has an attachment foreign
  | key with ON DELETE CASCADE, permanently deleting the
  | attachment also removes the temporary transcript row.
  |--------------------------------------------------------------------------
  */

  async function removeTemporaryTranscriptionAudio(
    attachment
  ) {
    const attachmentId =
      getAttachmentId(
        attachment
      );


    if (!attachmentId) {
      throw new Error(
        "Temporary audio attachment ID is missing."
      );
    }


    /*
     * First move attachment into
     * deleted state.
     */
    await deleteJournalAttachment(
      attachmentId
    );


    /*
     * Then permanently remove it.
     *
     * Your backend attachment service
     * also removes the Cloudinary file.
     */
    await permanentlyDeleteJournalAttachment(
      attachmentId
    );


    setUploadedAttachment(
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Use Voice Note
  |--------------------------------------------------------------------------
  |
  | This path intentionally KEEPS the audio.
  |--------------------------------------------------------------------------
  */

  async function handleUseVoiceNote(
    file
  ) {
    const audioFile =
      file ||
      pendingAudioFile;


    if (!audioFile) {
      setError(
        "Record or upload a voice note first."
      );


      return;
    }


    setProcessing(true);
    setError("");


    try {
      const {
        entry:
          currentEntry,
        attachment
      } =
        await ensureAudioUploaded(
          audioFile
        );


      /*
       * No transcript means this is a
       * genuine voice journal.
       *
       * Parent will mark entryType as voice.
       */
      onVoiceCreated?.(
        currentEntry,
        attachment,
        null
      );
    } catch (
      voiceError
    ) {
      console.error(
        "Unable to attach voice note:",
        voiceError
      );


      setError(
        getJournalVoiceError(
          voiceError,
          "The voice note could not be saved."
        )
      );


      throw voiceError;
    } finally {
      setProcessing(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Speech To Text
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | The audio attachment is TEMPORARY on this path.
  |
  | Flow:
  |
  | temporary upload
  | -> transcription
  | -> copy transcript into editor
  | -> permanently delete audio
  | -> transcript DB row cascades away
  |
  | Only normal journal text remains.
  |--------------------------------------------------------------------------
  */

  async function handleTranscribe(
    file
  ) {
    const audioFile =
      file ||
      pendingAudioFile;


    if (!audioFile) {
      setError(
        "Record or upload a voice note first."
      );


      return;
    }


    setProcessing(true);
    setError("");


    let attachment =
      null;


    try {
      const uploadResult =
        await ensureAudioUploaded(
          audioFile
        );


      const currentEntry =
        uploadResult.entry;


      attachment =
        uploadResult.attachment;


      const currentEntryId =
        getJournalEntryId(
          currentEntry
        );


      const attachmentId =
        getAttachmentId(
          attachment
        );


      if (!currentEntryId) {
        throw new Error(
          "The journal entry does not have a valid ID."
        );
      }


      if (!attachmentId) {
        throw new Error(
          "The voice attachment does not have a valid ID."
        );
      }


      /*
       * Ask backend/Groq to transcribe
       * the temporary audio attachment.
       */
      const transcript =
        await createAndTranscribeVoiceJournal(
          currentEntryId,
          attachmentId
        );


      if (!transcript) {
        throw new Error(
          "The transcription service did not return a transcript."
        );
      }


      const transcriptText =
        getTranscriptText(
          transcript
        ).trim();


      if (!transcriptText) {
        throw new Error(
          "The transcription service returned empty text."
        );
      }


      /*
       * FIRST copy the transcript into
       * the main journal editor.
       *
       * The parent now treats this as a
       * text journal, NOT an audio journal.
       */
      onVoiceCreated?.(
        currentEntry,
        attachment,
        transcript
      );


      /*
       * Now that the text has been safely
       * copied into editor state, remove the
       * temporary audio and transcript record.
       */
      await removeTemporaryTranscriptionAudio(
        attachment
      );


      /*
       * New speech-to-text entries should
       * not remain in the transcript list
       * because the transcript is now stored
       * as normal journal content.
       */
      const transcriptId =
        getTranscriptId(
          transcript
        );


      if (transcriptId) {
        setTranscripts(
          (current) =>
            current.filter(
              (item) =>
                getTranscriptId(
                  item
                ) !==
                transcriptId
            )
        );
      }


      /*
       * Remove recorder's local File.
       */
      setPendingAudioFile(
        null
      );


      /*
       * Reset recorder preview.
       */
      setRecorderResetKey(
        (current) =>
          current + 1
      );


      return transcript;
    } catch (
      voiceError
    ) {
      console.error(
        "Unable to transcribe voice note:",
        voiceError
      );


      setError(
        getJournalVoiceError(
          voiceError,
          "The voice note could not be converted to text."
        )
      );


      throw voiceError;
    } finally {
      setProcessing(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Existing Transcript Update
  |--------------------------------------------------------------------------
  */

  function handleTranscriptUpdated(
    updated
  ) {
    const updatedId =
      getTranscriptId(
        updated
      );


    if (!updatedId) {
      return;
    }


    setTranscripts(
      (current) =>
        current.map(
          (item) => {
            const id =
              getTranscriptId(
                item
              );


            return (
              id ===
              updatedId
                ? updated
                : item
            );
          }
        )
    );
  }


  return (
    <section className="journal-voice-section">
      <JournalVoiceRecorder
        disabled={
          disabled
        }

        processing={
          processing
        }

        resetKey={
          recorderResetKey
        }

        onAudioReady={
          handleAudioReady
        }

        onUseVoiceNote={
          handleUseVoiceNote
        }

        onTranscribe={
          handleTranscribe
        }
      />


      {error ? (
        <div
          className="journal-voice-section__error"
          role="alert"
        >
          {error}
        </div>
      ) : null}


      {transcripts.length ? (
        <div className="journal-voice-section__transcripts">
          {transcripts.map(
            (
              transcript,
              index
            ) => {
              const id =
                getTranscriptId(
                  transcript
                );


              return (
                <JournalVoiceTranscript
                  key={
                    id ||
                    `voice-transcript-${index}`
                  }

                  transcript={
                    transcript
                  }

                  onUpdated={
                    handleTranscriptUpdated
                  }
                />
              );
            }
          )}
        </div>
      ) : null}
    </section>
  );
}


export default JournalVoiceSection;