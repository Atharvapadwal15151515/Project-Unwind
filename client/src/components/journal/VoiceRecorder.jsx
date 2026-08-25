import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  CircleStop,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles
} from "lucide-react";

import "./VoiceRecorder.css";

function formatDuration(
  seconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const remainingSeconds =
    totalSeconds % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(
    2,
    "0"
  )}`;
}

function getSupportedMimeType() {
  if (
    typeof MediaRecorder ===
    "undefined"
  ) {
    return "";
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4"
  ];

  for (
    const type of types
  ) {
    if (
      MediaRecorder.isTypeSupported(
        type
      )
    ) {
      return type;
    }
  }

  return "";
}

function VoiceRecorder({
  onRecordingChange,
  onTranscribe,
  transcribing = false,
  disabled = false
}) {
  const mediaRecorderRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const chunksRef =
    useRef([]);

  const timerRef =
    useRef(null);

  const audioRef =
    useRef(null);

  const durationRef =
    useRef(0);

  const [
    recording,
    setRecording
  ] = useState(false);

  const [
    paused,
    setPaused
  ] = useState(false);

  const [
    audioBlob,
    setAudioBlob
  ] = useState(null);

  const [
    audioUrl,
    setAudioUrl
  ] = useState("");

  const [
    duration,
    setDuration
  ] = useState(0);

  const [
    playing,
    setPlaying
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  function clearRecordingTimer() {
    if (
      timerRef.current
    ) {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }
  }

  function stopStream() {
    if (
      !streamRef.current
    ) {
      return;
    }

    streamRef.current
      .getTracks()
      .forEach((track) => {
        track.stop();
      });

    streamRef.current =
      null;
  }

  function createRecordingTimer() {
    clearRecordingTimer();

    timerRef.current =
      setInterval(() => {
        setDuration(
          (current) => {
            const next =
              current + 1;

            durationRef.current =
              next;

            return next;
          }
        );
      }, 1000);
  }

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopStream();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        audioUrl &&
        audioUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, [audioUrl]);

  async function startRecording() {
    try {
      setError("");

      if (
        disabled
      ) {
        return;
      }

      if (
        !navigator
          ?.mediaDevices
          ?.getUserMedia
      ) {
        throw new Error(
          "Your browser does not support microphone recording."
        );
      }

      if (
        typeof MediaRecorder ===
        "undefined"
      ) {
        throw new Error(
          "Voice recording is not supported in this browser."
        );
      }

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true
          });

      streamRef.current =
        stream;

      const mimeType =
        getSupportedMimeType();

      let recorder;

      if (mimeType) {
        recorder =
          new MediaRecorder(
            stream,
            {
              mimeType
            }
          );
      } else {
        recorder =
          new MediaRecorder(
            stream
          );
      }

      mediaRecorderRef.current =
        recorder;

      chunksRef.current =
        [];

      setDuration(0);

      durationRef.current =
        0;

      setAudioBlob(null);

      if (
        audioUrl &&
        audioUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      setAudioUrl("");

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            chunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onerror =
        (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          setError(
            "Something went wrong while recording."
          );
        };

      recorder.onstop =
        () => {
          try {
            const finalMimeType =
              recorder.mimeType ||
              mimeType ||
              "audio/webm";

            const blob =
              new Blob(
                chunksRef.current,
                {
                  type:
                    finalMimeType
                }
              );

            if (
              blob.size === 0
            ) {
              setError(
                "The recording was empty. Please record again."
              );

              return;
            }

            const url =
              URL.createObjectURL(
                blob
              );

            setAudioBlob(blob);
            setAudioUrl(url);

            onRecordingChange?.({
              blob,
              url,
              duration:
                durationRef.current,
              mimeType:
                finalMimeType
            });
          } catch (
            stopError
          ) {
            console.error(
              "Unable to prepare recorded audio:",
              stopError
            );

            setError(
              "The recording could not be prepared."
            );
          } finally {
            chunksRef.current =
              [];

            stopStream();
          }
        };

      recorder.start(250);

      setRecording(true);
      setPaused(false);

      createRecordingTimer();
    } catch (recordingError) {
      console.error(
        "Unable to start recording:",
        recordingError
      );

      stopStream();

      setError(
        recordingError
          ?.message ||
          "We could not access your microphone."
      );
    }
  }

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !==
        "inactive"
    ) {
      recorder.stop();
    }

    clearRecordingTimer();

    setRecording(false);
    setPaused(false);
  }

  function togglePause() {
    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    if (
      recorder.state ===
      "recording"
    ) {
      recorder.pause();

      clearRecordingTimer();

      setPaused(true);

      return;
    }

    if (
      recorder.state ===
      "paused"
    ) {
      recorder.resume();

      createRecordingTimer();

      setPaused(false);
    }
  }

  function resetRecording() {
    clearRecordingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !==
        "inactive"
    ) {
      recorder.stop();
    }

    stopStream();

    if (
      audioRef.current
    ) {
      audioRef.current.pause();
    }

    if (
      audioUrl &&
      audioUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    chunksRef.current =
      [];

    durationRef.current =
      0;

    setRecording(false);
    setPaused(false);

    setAudioBlob(null);
    setAudioUrl("");

    setDuration(0);
    setPlaying(false);
    setError("");

    onRecordingChange?.(
      null
    );
  }
  /*
 * Parent increments resetKey after a
 * successful speech-to-text conversion.
 *
 * This removes the old audio preview
 * because that audio no longer exists
 * as a saved journal attachment.
 */
useEffect(() => {
  if (!resetKey) {
    return;
  }

  resetRecording();
}, [resetKey]);

  async function togglePlayback() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (
      playbackError
    ) {
      console.error(
        "Unable to play audio:",
        playbackError
      );

      setError(
        "We could not play this recording."
      );
    }
  }

  async function handleTranscribe() {
    if (
      !audioBlob ||
      !onTranscribe ||
      transcribing
    ) {
      return;
    }

    try {
      setError("");

      await onTranscribe(
        audioBlob
      );
    } catch (
      transcriptionError
    ) {
      console.error(
        "Unable to transcribe recording:",
        transcriptionError
      );

      setError(
        transcriptionError
          ?.response?.data
          ?.message ||
          transcriptionError
            ?.message ||
          "We could not convert this recording to text."
      );
    }
  }

  return (
    <section className="voice-recorder">
      <header className="voice-recorder__header">
        <div className="voice-recorder__title-group">
          <span className="voice-recorder__icon">
            <Mic size={19} />
          </span>

          <div>
            <h3>
              Voice journal
            </h3>

            <p>
              Record what is on your
              mind and save it with
              your journal entry.
            </p>
          </div>
        </div>

        {(recording ||
          audioUrl) && (
          <span className="voice-recorder__duration">
            {formatDuration(
              duration
            )}
          </span>
        )}
      </header>

      {error && (
        <div
          className="voice-recorder__error"
          role="alert"
        >
          {error}
        </div>
      )}

      {!recording &&
        !audioUrl && (
          <button
            type="button"
            className="voice-recorder__start"
            onClick={
              startRecording
            }
            disabled={
              disabled
            }
          >
            <Mic size={18} />

            Start recording
          </button>
        )}

      {recording && (
        <div className="voice-recorder__recording">
          <div className="voice-recorder__status">
            <span
              className={
                paused
                  ? "voice-recorder__dot voice-recorder__dot--paused"
                  : "voice-recorder__dot"
              }
            />

            <span>
              {paused
                ? "Recording paused"
                : "Recording…"}
            </span>
          </div>

          <div className="voice-recorder__recording-controls">
            <button
              type="button"
              onClick={
                togglePause
              }
            >
              {paused ? (
                <>
                  <Mic
                    size={17}
                  />

                  Resume
                </>
              ) : (
                <>
                  <Pause
                    size={17}
                  />

                  Pause
                </>
              )}
            </button>

            <button
              type="button"
              className="voice-recorder__stop"
              onClick={
                stopRecording
              }
            >
              <CircleStop
                size={17}
              />

              Stop
            </button>
          </div>
        </div>
      )}

      {!recording &&
        audioUrl && (
          <div className="voice-recorder__preview">
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
              onPlay={() =>
                setPlaying(true)
              }
              onPause={() =>
                setPlaying(false)
              }
              onEnded={() =>
                setPlaying(false)
              }
            />

            <div className="voice-recorder__player">
              <button
                type="button"
                className="voice-recorder__play"
                onClick={
                  togglePlayback
                }
                aria-label={
                  playing
                    ? "Pause voice recording"
                    : "Play voice recording"
                }
              >
                {playing ? (
                  <Pause
                    size={20}
                  />
                ) : (
                  <Play
                    size={20}
                  />
                )}
              </button>

              <div className="voice-recorder__player-copy">
                <strong>
                  Your voice note
                </strong>

                <span>
                  {formatDuration(
                    duration
                  )}
                </span>
              </div>
            </div>

            <div className="voice-recorder__preview-actions">
              <button
                type="button"
                onClick={
                  resetRecording
                }
                disabled={
                  disabled ||
                  transcribing
                }
              >
                <RotateCcw
                  size={16}
                />

                Record again
              </button>

              {onTranscribe && (
                <button
                  type="button"
                  className="voice-recorder__transcribe"
                  onClick={
                    handleTranscribe
                  }
                  disabled={
                    disabled ||
                    transcribing
                  }
                >
                  {transcribing ? (
                    <LoaderCircle
                      className="voice-recorder__spin"
                      size={16}
                    />
                  ) : (
                    <Sparkles
                      size={16}
                    />
                  )}

                  {transcribing
                    ? "Converting…"
                    : "Convert to text"}
                </button>
              )}
            </div>
          </div>
        )}
    </section>
  );
}

export default VoiceRecorder;