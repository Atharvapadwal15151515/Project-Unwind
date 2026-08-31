import {
  Pause,
  Play,
  Volume2
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState
} from "react";

import "./UnwindAudioPlayer.css";


function formatTime(
  seconds
) {
  if (
    !Number.isFinite(
      seconds
    )
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  const remainingSeconds =
    Math.floor(
      seconds % 60
    );

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}


export default function UnwindAudioPlayer({
  src
}) {
  const audioRef =
    useRef(null);

  const [
    playing,
    setPlaying
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime
  ] = useState(0);

  const [
    duration,
    setDuration
  ] = useState(0);


  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate =
      () => {
        setCurrentTime(
          audio.currentTime
        );
      };

    const handleLoadedMetadata =
      () => {
        setDuration(
          audio.duration || 0
        );
      };

    const handleEnded =
      () => {
        setPlaying(false);
        setCurrentTime(0);
      };


    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "ended",
      handleEnded
    );


    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, []);


  const togglePlayback =
    async () => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    };


  const handleSeek = (
    event
  ) => {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const nextTime =
      Number(
        event.target.value
      );

    audio.currentTime =
      nextTime;

    setCurrentTime(
      nextTime
    );
  };


  return (
    <div className="unwind-audio-player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />

      <button
        type="button"
        className="unwind-audio-player__play"
        onClick={
          togglePlayback
        }
        aria-label={
          playing
            ? "Pause audio"
            : "Play audio"
        }
      >
        {playing ? (
          <Pause size={17} />
        ) : (
          <Play size={17} />
        )}
      </button>

      <div className="unwind-audio-player__main">
        <input
          type="range"
          min="0"
          max={
            duration || 0
          }
          step="0.1"
          value={
            currentTime
          }
          onChange={
            handleSeek
          }
          className="unwind-audio-player__progress"
        />

        <div className="unwind-audio-player__meta">
          <span>
            {formatTime(
              currentTime
            )}
          </span>

          <span>
            {formatTime(
              duration
            )}
          </span>
        </div>
      </div>

      <span className="unwind-audio-player__volume">
        <Volume2
          size={17}
        />
      </span>
    </div>
  );
}