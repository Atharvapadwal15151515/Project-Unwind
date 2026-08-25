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

  const completedRef =
    useRef(false);

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    const completeIntro = () => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;

      onComplete?.();
    };

    const handleEnded = () => {
      completeIntro();
    };

    const handleError = () => {
      console.error(
        "UNWIND intro video failed to load."
      );

      completeIntro();
    };

    video.addEventListener(
      "ended",
      handleEnded
    );

    video.addEventListener(
      "error",
      handleError
    );

    const startIntro =
      async () => {
        try {
          /*
            First attempt:
            video + audio.
          */

          video.currentTime = 0;
          video.muted = false;
          video.volume = 1;

          await video.play();
        } catch (audioAutoplayError) {
          console.warn(
            "Autoplay with sound blocked. Retrying muted."
          );

          try {
            /*
              Browser does not permit
              autoplay with sound.

              Retry muted so UNWIND
              never gets stuck.
            */

            video.muted = true;
            video.volume = 0;

            await video.play();
          } catch (mutedAutoplayError) {
            console.error(
              "Intro autoplay failed completely:",
              mutedAutoplayError
            );

            completeIntro();
          }
        }
      };

    startIntro();

    /*
      Safety fallback.

      Even if the browser/video somehow
      freezes and never dispatches ended,
      never trap the user on the intro.

      Your intro is ~10 seconds, so give
      it a little extra room.
    */

    const safetyTimeout =
      window.setTimeout(
        () => {
          if (
            video.paused &&
            !video.ended
          ) {
            completeIntro();
          }
        },
        12000
      );

    return () => {
      window.clearTimeout(
        safetyTimeout
      );

      video.removeEventListener(
        "ended",
        handleEnded
      );

      video.removeEventListener(
        "error",
        handleError
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