import {
  useEffect,
  useRef
} from "react";

import "./UnwindIntro.css";

import unwindIntroVideo
  from "../../assets/brand/unwind-intro.mp4";

export default function UnwindIntro({
  onComplete
}) {
  const videoRef =
    useRef(null);

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

    video.currentTime = 0;
    video.volume = 1;
    video.muted = false;

    video
      .play()
      .catch((error) => {
        console.warn(
          "Intro autoplay with audio was blocked:",
          error
        );
      });

    return () => {
      video.removeEventListener(
        "ended",
        handleEnded
      );

      video.pause();
    };
  }, [onComplete]);

  return (
    <div className="unwind-intro">
      <video
        ref={videoRef}
        className="unwind-intro-video"
        src={unwindIntroVideo}
        autoPlay
        playsInline
        preload="auto"
      />
    </div>
  );
}