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
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

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
    video.muted = false;
    video.volume = 1;

    const startVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.warn(
          "Browser blocked autoplay with audio:",
          error
        );
      }
    };

    startVideo();

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
        playsInline
        preload="auto"
      />
    </div>
  );
}