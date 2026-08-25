import {
  useEffect,
  useState
} from "react";

import {
  Check,
  Edit3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X
} from "lucide-react";

import {
  getJournalVoiceError,
  restoreOriginalVoiceTranscript,
  retryVoiceTranscription,
  updateVoiceTranscript
} from "../../services/journalVoiceService";

function getVoiceTranscriptId(
  transcript
) {
  return (
    transcript
      ?.voiceTranscriptId ||
    transcript
      ?.voice_transcript_id
  );
}

function getTranscriptText(
  transcript
) {
  return (
    transcript?.transcript ||
    ""
  );
}

function getTranscriptStatus(
  transcript
) {
  return (
    transcript
      ?.transcriptStatus ||
    transcript
      ?.transcript_status ||
    "pending"
  );
}

function JournalVoiceTranscript({
  transcript,
  onUpdated
}) {
  const [
    editing,
    setEditing
  ] = useState(false);

  const [
    text,
    setText
  ] = useState("");

  const [
    busy,
    setBusy
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  useEffect(() => {
    setText(
      getTranscriptText(
        transcript
      )
    );
  }, [transcript]);

  if (!transcript) {
    return null;
  }

  const status =
    getTranscriptStatus(
      transcript
    );

  async function saveTranscript() {
    setBusy(true);
    setError("");

    try {
      const updated =
        await updateVoiceTranscript(
          transcript,
          text.trim()
        );

      setEditing(false);

      onUpdated?.(
        updated
      );
    } catch (saveError) {
      setError(
        getJournalVoiceError(
          saveError,
          "Transcript could not be updated."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry() {
    setBusy(true);
    setError("");

    try {
      const updated =
        await retryVoiceTranscription(
          transcript
        );

      onUpdated?.(
        updated
      );
    } catch (retryError) {
      setError(
        getJournalVoiceError(
          retryError
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    setError("");

    try {
      const updated =
        await restoreOriginalVoiceTranscript(
          transcript
        );

      onUpdated?.(
        updated
      );
    } catch (restoreError) {
      setError(
        getJournalVoiceError(
          restoreError
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="journal-voice-transcript">
      <header>
        <div>
          <span>
            <Sparkles
              size={16}
            />
            Voice transcript
          </span>

          <small
            className={
              `journal-voice-status is-${status}`
            }
          >
            {status}
          </small>
        </div>
      </header>

      {error ? (
        <div className="journal-voice-transcript__error">
          {error}
        </div>
      ) : null}

      {status ===
      "processing" ? (
        <div className="journal-voice-transcript__processing">
          <LoaderCircle
            className="journal-spin"
            size={18}
          />

          Transcribing your
          voice note...
        </div>
      ) : null}

      {status === "failed" ? (
        <div className="journal-voice-transcript__failed">
          <p>
            Transcription failed.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={
              handleRetry
            }
          >
            <RefreshCw
              size={15}
            />
            Retry
          </button>
        </div>
      ) : null}

      {status ===
        "completed" &&
      !editing ? (
        <>
          <p className="journal-voice-transcript__text">
            {getTranscriptText(
              transcript
            )}
          </p>

          <div className="journal-voice-transcript__actions">
            <button
              type="button"
              onClick={() =>
                setEditing(
                  true
                )
              }
            >
              <Edit3
                size={15}
              />
              Edit transcript
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={
                handleRestore
              }
            >
              <RotateCcw
                size={15}
              />
              Restore original
            </button>
          </div>
        </>
      ) : null}

      {status ===
        "completed" &&
      editing ? (
        <>
          <textarea
            rows={8}
            value={text}
            onChange={(
              event
            ) =>
              setText(
                event.target
                  .value
              )
            }
          />

          <div className="journal-voice-transcript__actions">
            <button
              type="button"
              disabled={busy}
              onClick={
                saveTranscript
              }
            >
              <Check
                size={15}
              />
              Save
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setText(
                  getTranscriptText(
                    transcript
                  )
                );

                setEditing(
                  false
                );
              }}
            >
              <X size={15} />
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default JournalVoiceTranscript;