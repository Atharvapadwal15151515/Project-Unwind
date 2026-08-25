import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Check,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Upload
} from "lucide-react";


function formatDuration(
  seconds
) {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );

  const mins =
    Math.floor(
      safeSeconds / 60
    );

  const secs =
    safeSeconds % 60;

  return (
    `${String(mins).padStart(
      2,
      "0"
    )}:` +
    `${String(secs).padStart(
      2,
      "0"
    )}`
  );
}


function getSupportedMimeType() {
  if (
    typeof MediaRecorder ===
    "undefined"
  ) {
    return "";
  }

  const supportedTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4"
  ];

  for (
    const type of
      supportedTypes
  ) {
    if (
      MediaRecorder
        .isTypeSupported(type)
    ) {
      return type;
    }
  }

  return "";
}


function getFileExtension(
  mimeType = ""
) {
  if (
    mimeType.includes("ogg")
  ) {
    return "ogg";
  }

  if (
    mimeType.includes("mp4")
  ) {
    return "m4a";
  }

  if (
    mimeType.includes("mpeg")
  ) {
    return "mp3";
  }

  if (
    mimeType.includes("wav")
  ) {
    return "wav";
  }

  return "webm";
}


function JournalVoiceRecorder({
  disabled = false,
  processing = false,
  resetKey = 0,
  onAudioReady,
  onUseVoiceNote,
  onTranscribe
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

  const secondsRef =
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
    seconds,
    setSeconds
  ] = useState(0);


  const [
    audioFile,
    setAudioFile
  ] = useState(null);


  const [
    previewUrl,
    setPreviewUrl
  ] = useState("");


  const [
    error,
    setError
  ] = useState("");


  const [
    selected,
    setSelected
  ] = useState(false);


  const [
    playing,
    setPlaying
  ] = useState(false);


  function stopTimer() {
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


  function startTimer() {
    stopTimer();

    timerRef.current =
      setInterval(() => {
        setSeconds(
          (current) => {
            const next =
              current + 1;

            secondsRef.current =
              next;

            return next;
          }
        );
      }, 1000);
  }


  function stopStream() {
    if (
      !streamRef.current
    ) {
      return;
    }

    streamRef.current
      .getTracks()
      .forEach(
        (track) => {
          track.stop();
        }
      );

    streamRef.current =
      null;
  }


  function removePreviewUrl() {
    if (
      previewUrl &&
      previewUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }
  }


  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);


  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);


  function notifyAudioReady(
    file
  ) {
    if (
      typeof onAudioReady ===
      "function"
    ) {
      onAudioReady(file);
    }
  }


  async function startRecording() {
    setError("");
    setSelected(false);

    if (
      disabled
    ) {
      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices
        .getUserMedia
    ) {
      setError(
        "Audio recording is not supported in this browser."
      );

      return;
    }

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      setError(
        "Voice recording is not supported in this browser."
      );

      return;
    }

    try {
      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true
          });

      streamRef.current =
        stream;

      const preferredMimeType =
        getSupportedMimeType();

      let recorder;

      if (
        preferredMimeType
      ) {
        recorder =
          new MediaRecorder(
            stream,
            {
              mimeType:
                preferredMimeType
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
            const mimeType =
              recorder.mimeType ||
              preferredMimeType ||
              "audio/webm";

            const blob =
              new Blob(
                chunksRef.current,
                {
                  type:
                    mimeType
                }
              );

            if (
              blob.size === 0
            ) {
              setError(
                "The recording was empty. Please record again."
              );

              stopStream();

              return;
            }

            const extension =
              getFileExtension(
                mimeType
              );

            const file =
              new File(
                [blob],
                `voice-journal-${Date.now()}.${extension}`,
                {
                  type:
                    mimeType
                }
              );

            removePreviewUrl();

            const url =
              URL.createObjectURL(
                blob
              );

            setAudioFile(
              file
            );

            setPreviewUrl(
              url
            );

            /*
             * IMPORTANT FIX:
             *
             * Send the actual File
             * to the parent immediately.
             *
             * Parent can now keep the
             * audio file until Save Entry
             * is clicked.
             */
            notifyAudioReady(
              file
            );

            setError("");
          } catch (
            recordingError
          ) {
            console.error(
              "Unable to prepare recording:",
              recordingError
            );

            setError(
              "The voice recording could not be prepared."
            );
          } finally {
            chunksRef.current =
              [];

            stopStream();
          }
        };


      recorder.start(250);

      secondsRef.current =
        0;

      setSeconds(0);

      setRecording(true);
      setPaused(false);

      startTimer();
    } catch (
      recordingError
    ) {
      console.error(
        "Microphone error:",
        recordingError
      );

      stopStream();

      setError(
        "Microphone access was denied or unavailable."
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

    stopTimer();

    setRecording(false);
    setPaused(false);
  }


  function togglePauseRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder
    ) {
      return;
    }

    if (
      recorder.state ===
      "recording"
    ) {
      recorder.pause();

      stopTimer();

      setPaused(true);

      return;
    }

    if (
      recorder.state ===
      "paused"
    ) {
      recorder.resume();

      setPaused(false);

      startTimer();
    }
  }


  function resetRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !==
        "inactive"
    ) {
      recorder.stop();
    }

    stopTimer();
    stopStream();

    if (
      audioRef.current
    ) {
      audioRef.current.pause();
    }

    removePreviewUrl();

    chunksRef.current =
      [];

    secondsRef.current =
      0;

    setAudioFile(null);
    setPreviewUrl("");

    setSeconds(0);

    setRecording(false);
    setPaused(false);

    setPlaying(false);
    setSelected(false);

    setError("");

    /*
     * Tell parent that the
     * selected audio was removed.
     */
    notifyAudioReady(
      null
    );
  }


  function handleFileUpload(
    event
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSelected(false);


    if (
      !file.type.startsWith(
        "audio/"
      )
    ) {
      setError(
        "Please choose an audio file."
      );

      event.target.value =
        "";

      return;
    }


    if (
      file.size >
      25 * 1024 * 1024
    ) {
      setError(
        "Voice recordings cannot exceed 25 MB."
      );

      event.target.value =
        "";

      return;
    }


    removePreviewUrl();


    const url =
      URL.createObjectURL(
        file
      );


    setAudioFile(
      file
    );

    setPreviewUrl(
      url
    );

    setSeconds(0);


    /*
     * IMPORTANT:
     *
     * Uploaded audio is also
     * sent to the parent immediately.
     */
    notifyAudioReady(
      file
    );


    /*
     * Allows selecting the
     * same file again later.
     */
    event.target.value =
      "";
  }


  function handleUseVoiceNote() {
    if (
      !audioFile
    ) {
      setError(
        "Record or upload a voice note first."
      );

      return;
    }

    setError("");
    setSelected(true);

    /*
     * IMPORTANT:
     *
     * NO navigate()
     * NO React Router route.
     *
     * Just pass the File back
     * to the journal form.
     */
    if (
      typeof onUseVoiceNote ===
      "function"
    ) {
      onUseVoiceNote(
        audioFile
      );
    }

    /*
     * Also make sure parent
     * still has the actual File.
     */
    notifyAudioReady(
      audioFile
    );
  }


  async function handleTranscribe() {
    if (
      !audioFile
    ) {
      setError(
        "Record or upload a voice note first."
      );

      return;
    }

    if (
      typeof onTranscribe !==
      "function"
    ) {
      setError(
        "Speech-to-text is not available yet."
      );

      return;
    }

    try {
      setError("");

      await onTranscribe(
        audioFile
      );
    } catch (
      transcriptionError
    ) {
      console.error(
        "Speech-to-text error:",
        transcriptionError
      );

      setError(
        transcriptionError
          ?.response?.data
          ?.message ||
          transcriptionError
            ?.message ||
          "We could not convert this voice note to text."
      );
    }
  }


  async function togglePlayback() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    try {
      if (
        audio.paused
      ) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (
      playbackError
    ) {
      console.error(
        "Audio playback error:",
        playbackError
      );

      setError(
        "We could not play this voice note."
      );
    }
  }


  return (
    <section className="journal-voice-recorder">
      <div className="journal-voice-recorder__heading">
        <span>
          <Mic size={17} />

          Voice Journal
        </span>

        <small>
          Record your thoughts or
          upload an audio note.
        </small>
      </div>


      {error ? (
        <div
          className="journal-voice-recorder__error"
          role="alert"
        >
          {error}
        </div>
      ) : null}


      {!recording &&
      !audioFile ? (
        <div className="journal-voice-recorder__start">
          <button
            type="button"
            disabled={
              disabled ||
              processing
            }
            onClick={
              startRecording
            }
          >
            <Mic size={20} />

            Start recording
          </button>


          <label>
            <Upload size={18} />

            Upload audio

            <input
              type="file"
              accept="audio/*"
              disabled={
                disabled ||
                processing
              }
              onChange={
                handleFileUpload
              }
              hidden
            />
          </label>
        </div>
      ) : null}


      {recording ? (
        <div className="journal-voice-recorder__recording">
          <span className="journal-voice-recorder__pulse" />


          <strong>
            {paused
              ? "Recording paused"
              : "Recording"}
          </strong>


          <span>
            {formatDuration(
              seconds
            )}
          </span>


          <button
            type="button"
            disabled={
              disabled
            }
            onClick={
              togglePauseRecording
            }
          >
            {paused ? (
              <>
                <Play
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
            disabled={
              disabled
            }
            onClick={
              stopRecording
            }
          >
            <Square
              size={17}
            />

            Stop
          </button>
        </div>
      ) : null}


      {audioFile &&
      previewUrl ? (
        <div className="journal-voice-recorder__preview">
          <audio
            ref={audioRef}
            src={previewUrl}
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


          <div className="journal-voice-recorder__custom-player">
            <button
              type="button"
              className="journal-voice-recorder__play"
              onClick={
                togglePlayback
              }
              disabled={
                disabled ||
                processing
              }
              aria-label={
                playing
                  ? "Pause voice note"
                  : "Play voice note"
              }
            >
              {playing ? (
                <Pause
                  size={18}
                />
              ) : (
                <Play
                  size={18}
                />
              )}
            </button>


            <div>
              <strong>
                Voice note ready
              </strong>

              <small>
                {audioFile.name}
              </small>
            </div>
          </div>


          <div className="journal-voice-recorder__preview-actions">
            <button
              type="button"
              disabled={
                disabled ||
                processing
              }
              onClick={
                resetRecording
              }
            >
              <RotateCcw
                size={16}
              />

              Record again
            </button>


            <button
              type="button"
              disabled={
                disabled ||
                processing
              }
              onClick={
                handleUseVoiceNote
              }
            >
              {selected ? (
                <Check
                  size={16}
                />
              ) : (
                <Mic
                  size={16}
                />
              )}

              {selected
                ? "Voice note selected"
                : "Use voice note"}
            </button>


            <button
              type="button"
              disabled={
                disabled ||
                processing
              }
              onClick={
                handleTranscribe
              }
            >
              {processing ? (
                <LoaderCircle
                  size={16}
                  className="journal-spin"
                />
              ) : (
                <Sparkles
                  size={16}
                />
              )}

              {processing
                ? "Transcribing..."
                : "Convert to text"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}


export default JournalVoiceRecorder;