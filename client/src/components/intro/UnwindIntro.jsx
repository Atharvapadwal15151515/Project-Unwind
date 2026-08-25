import {
  useEffect,
  useRef,
  useState
} from "react";

import "./UnwindIntro.css";

import unwindIntroVideo
  from "../../assets/brand/unwind-intro.mp4";

export default function UnwindIntro({
  onComplete
}) {
  const videoRef =
    useRef(null);

  const [
    needsInteraction,
    setNeedsInteraction
  ] = useState(false);

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    const handleEnded = () => {
      onComplete?.();
    };

    video.addEventListener(
      "ended",
      handleEnded
    );

    video.muted = false;
    video.volume = 1;

    video
      .play()
      .then(() => {
        setNeedsInteraction(false);
      })
      .catch(() => {
        setNeedsInteraction(true);
      });

    return () => {
      video.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [onComplete]);

  const handleStart = async () => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    try {
      video.muted = false;
      video.volume = 1;

      await video.play();

      setNeedsInteraction(false);
    } catch (error) {
      console.warn(
        "Intro video playback failed:",
        error
      );
    }
  };

  return (
    <div className="unwind-intro">
      <video
        ref={videoRef}
        className="unwind-intro-video"
        src={unwindIntroVideo}
        playsInline
        preload="auto"
      />

      {needsInteraction && (
        <button
          type="button"
          className="unwind-intro-start"
          onClick={handleStart}
        >
          Enter UNWIND
        </button>
      )}
    </div>
  );
}