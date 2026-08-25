import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Play,
  RefreshCcw
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  addWellnessHistoryEntry
} from "../../../utils/wellnessStorage";

import "./MovementBreak.css";

const movementSteps = [
  {
    id: "shoulders",
    title: "Roll your shoulders",
    instruction:
      "Slowly roll your shoulders backward in a relaxed circle.",
    duration: 10
  },
  {
    id: "neck",
    title: "Neck stretch",
    instruction:
      "Gently tilt your head to one side. Keep the stretch comfortable.",
    duration: 10
  },
  {
    id: "stand",
    title: "Stand up",
    instruction:
      "If you're able, stand up slowly and notice your posture.",
    duration: 8
  },
  {
    id: "arms",
    title: "Stretch your arms",
    instruction:
      "Reach your arms upward and lengthen through your sides.",
    duration: 10
  },
  {
    id: "walk",
    title: "Walk for one minute",
    instruction:
      "Walk around your space at an easy pace and let your body move.",
    duration: 60
  }
];

function MovementBreak() {
  const navigate =
    useNavigate();

  const intervalRef =
    useRef(null);

  const [
    stepIndex,
    setStepIndex
  ] = useState(0);

  const [
    secondsLeft,
    setSecondsLeft
  ] = useState(
    movementSteps[0].duration
  );

  const [
    running,
    setRunning
  ] = useState(false);

  const [
    paused,
    setPaused
  ] = useState(false);

  const [
    completed,
    setCompleted
  ] = useState(false);

  const currentStep =
    movementSteps[
      stepIndex
    ];

  const progress =
    useMemo(() => {
      if (completed) {
        return 100;
      }

      return Math.round(
        (stepIndex /
          movementSteps.length) *
          100
      );
    }, [
      stepIndex,
      completed
    ]);

  const clearTimer =
    () => {
      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    };

  const start =
    () => {
      setRunning(true);
      setPaused(false);
    };

  const pause =
    () => {
      clearTimer();

      setRunning(false);
      setPaused(true);
    };

  const resume =
    () => {
      setPaused(false);
      setRunning(true);
    };

  const restart =
    () => {
      clearTimer();

      setStepIndex(0);

      setSecondsLeft(
        movementSteps[0]
          .duration
      );

      setRunning(false);
      setPaused(false);
      setCompleted(false);
    };

    const playTingSound = () => {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const context =
      new AudioContext();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "sine";

    // Soft bell-like pitch
    oscillator.frequency.setValueAtTime(
      880,
      context.currentTime
    );

    gain.gain.setValueAtTime(
      0.12,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + 0.8
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.8
    );

    oscillator.onended = () => {
      context.close();
    };
  } catch (error) {
    console.error(
      "Unable to play movement sound:",
      error
    );
  }
};

  const advanceStep =
  useCallback(() => {
    clearTimer();

    if (
      stepIndex <
      movementSteps.length - 1
    ) {
      const nextIndex =
        stepIndex + 1;

      setStepIndex(
        nextIndex
      );

      setSecondsLeft(
        movementSteps[
          nextIndex
        ].duration
      );

      return;
    }

    setRunning(false);
    setPaused(false);
    setCompleted(true);

    addWellnessHistoryEntry({
      toolId:
        "movement-break",

      toolName:
        "Movement Break",

      type:
        "movement",

      duration:
        "2–3 min"
    });
  }, [stepIndex]);

  useEffect(() => {
  if (
    !running ||
    paused ||
    completed
  ) {
    return;
  }

  clearTimer();

  intervalRef.current =
    setInterval(() => {
      setSecondsLeft(
        (current) => {
          if (current <= 1) {
            return 0;
          }

          return current - 1;
        }
      );
    }, 1000);

  return () => {
    clearTimer();
  };
}, [
  running,
  paused,
  completed,
  stepIndex
]);

useEffect(() => {
  if (
    secondsLeft !== 0 ||
    !running ||
    paused ||
    completed
  ) {
    return;
  }
  
  playTingSound();
  advanceStep();
}, [
  secondsLeft,
  running,
  paused,
  completed,
  advanceStep
]);

  useEffect(() => {
    return clearTimer;
  }, []);

  return (
    <main className="movement-page">
      <header className="movement-header">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/toolkit"
            )
          }
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

        <div>
          <span>
            Healthy Habits
          </span>

          <h1>
            Movement Break
          </h1>
        </div>
      </header>

      <section className="movement-progress-card">
        <div>
          <span>
            Progress
          </span>

          <strong>
            {completed
              ? "Complete"
              : `Step ${stepIndex + 1} of ${movementSteps.length}`}
          </strong>
        </div>

        <span>
          {progress}%
        </span>

        <div className="movement-progress-track">
          <div
            style={{
              width:
                `${progress}%`
            }}
          />
        </div>
      </section>

      {!completed ? (
        <section className="movement-card">
          <div className="movement-visual">
            <div className="movement-visual__ring">
              <div className="movement-visual__center">
                <span>
                  {stepIndex + 1}
                </span>
              </div>
            </div>
          </div>

          <span className="movement-eyebrow">
            Gentle movement
          </span>

          <h2>
            {currentStep.title}
          </h2>

          <p>
            {
              currentStep.instruction
            }
          </p>

          <div className="movement-timer">
            <strong>
              {secondsLeft}
            </strong>

            <span>
              seconds
            </span>
          </div>

          <div className="movement-controls">
            {!running &&
              !paused && (
                <button
                  type="button"
                  className="movement-primary"
                  onClick={
                    start
                  }
                >
                  <Play
                    size={17}
                  />

                  Start
                </button>
              )}

            {running && (
              <button
                type="button"
                className="movement-primary"
                onClick={
                  pause
                }
              >
                <Pause
                  size={17}
                />

                Pause
              </button>
            )}

            {paused && (
              <button
                type="button"
                className="movement-primary"
                onClick={
                  resume
                }
              >
                <Play
                  size={17}
                />

                Resume
              </button>
            )}

           <button
  type="button"
  className="movement-secondary"
  onClick={
    advanceStep
  }
>
  Next

  <ArrowRight
    size={16}
  />
</button>

            <button
              type="button"
              className="movement-secondary"
              onClick={
                restart
              }
            >
              <RefreshCcw
                size={16}
              />

              Restart
            </button>
          </div>
        </section>
      ) : (
        <section className="movement-complete">
          <div className="movement-complete__icon">
            <Check
              size={27}
            />
          </div>

          <span>
            Movement complete
          </span>

          <h2>
            That&apos;s enough
            for now.
          </h2>

          <p>
            Notice whether your
            body feels even a
            little less stiff or
            more awake.
          </p>

          <div className="movement-complete__actions">
            <button
              type="button"
              className="movement-secondary"
              onClick={
                restart
              }
            >
              <RefreshCcw
                size={16}
              />

              Do again
            </button>

            <button
              type="button"
              className="movement-primary"
              onClick={() =>
                navigate(
                  "/dashboard/toolkit"
                )
              }
            >
              Done
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default MovementBreak;