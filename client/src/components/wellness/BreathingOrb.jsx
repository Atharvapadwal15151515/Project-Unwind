import {
  useEffect,
  useMemo,
  useRef
} from "react";

import gsap from "gsap";

import "./BreathingOrb.css";

function BreathingOrb({
  phase,
  phaseLabel,
  phaseDuration,
  secondsRemaining,
  paused = false
}) {
  const orbRef =
    useRef(null);

  const reduceMotion =
    useMemo(
      () =>
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches,
      []
    );

  useEffect(() => {
    if (
      !orbRef.current ||
      paused
    ) {
      return;
    }

    const orb =
      orbRef.current;

    gsap.killTweensOf(
      orb
    );

    if (reduceMotion) {
      if (
        phase === "inhale"
      ) {
        gsap.set(
          orb,
          {
            scale: 1.2
          }
        );
      } else if (
        phase === "exhale"
      ) {
        gsap.set(
          orb,
          {
            scale: 1
          }
        );
      }

      return;
    }

    if (
      phase === "inhale"
    ) {
      gsap.to(
        orb,
        {
          scale: 1.55,
          duration:
            phaseDuration,
          ease:
            "sine.inOut"
        }
      );
    } else if (
      phase === "exhale"
    ) {
      gsap.to(
        orb,
        {
          scale: 1,
          duration:
            phaseDuration,
          ease:
            "sine.inOut"
        }
      );
    }
  }, [
    phase,
    phaseDuration,
    paused,
    reduceMotion
  ]);

  const displaySeconds =
    Math.max(
      0,
      secondsRemaining
    );

  return (
    <div className="breathing-orb-shell">
      <div className="breathing-orb-rings">
        <span />
        <span />
        <span />
      </div>

      <div
        ref={orbRef}
        className="breathing-orb"
      >
        <span className="breathing-orb__phase">
          {paused
            ? "Paused"
            : phaseLabel}
        </span>

        <strong className="breathing-orb__count">
          {displaySeconds}
        </strong>

        <span className="breathing-orb__seconds">
          seconds
        </span>
      </div>
    </div>
  );
}

export default BreathingOrb;