import {
  ArrowLeft,
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

import "./BodyScan.css";

const bodyScanSteps = [
  {
    id: "forehead",
    label: "Forehead",
    duration: 12,
    instruction:
      "Notice your forehead. Let any tension soften without forcing it."
  },

  {
    id: "jaw",
    label: "Jaw",
    duration: 12,
    instruction:
      "Notice your jaw. Allow it to loosen slightly if that feels comfortable."
  },

  {
    id: "shoulders",
    label: "Shoulders",
    duration: 15,
    instruction:
      "Notice your shoulders. Let them drop away from your ears."
  },

  {
    id: "hands",
    label: "Hands",
    duration: 12,
    instruction:
      "Notice your hands and fingers. Let them rest without gripping."
  },

  {
    id: "chest",
    label: "Chest",
    duration: 15,
    instruction:
      "Notice the movement of your chest as you breathe. No need to change anything."
  },

  {
    id: "stomach",
    label: "Stomach",
    duration: 15,
    instruction:
      "Notice your stomach and the movement of your breath there."
  },

  {
    id: "legs",
    label: "Legs",
    duration: 15,
    instruction:
      "Notice your legs. Feel where they are supported and let them settle."
  },

  {
    id: "feet",
    label: "Feet",
    duration: 12,
    instruction:
      "Notice your feet and the points where they meet the floor or surface beneath you."
  }
];

function BodyScan() {
  const navigate =
    useNavigate();

  const intervalRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const [
    stepIndex,
    setStepIndex
  ] = useState(0);

  const [
    secondsLeft,
    setSecondsLeft
  ] = useState(
    bodyScanSteps[0].duration
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
    bodyScanSteps[
      stepIndex
    ];

  const progress =
    useMemo(() => {
      if (completed) {
        return 100;
      }

      return Math.round(
        (stepIndex /
          bodyScanSteps.length) *
          100
      );
    }, [
      stepIndex,
      completed
    ]);

  const clearTimer =
    useCallback(() => {
      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    }, []);

  const playTingSound =
    () => {
      try {
        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) {
          return;
        }

        if (
          !audioContextRef.current
        ) {
          audioContextRef.current =
            new AudioContext();
        }

        const context =
          audioContextRef.current;

        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type =
          "sine";

        oscillator.frequency.setValueAtTime(
          760,
          context.currentTime
        );

        gain.gain.setValueAtTime(
          0.09,
          context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime +
            0.7
        );

        oscillator.connect(
          gain
        );

        gain.connect(
          context.destination
        );

        oscillator.start();

        oscillator.stop(
          context.currentTime +
            0.7
        );
      } catch {
        // Ignore audio failures.
      }
    };

  const advanceStep =
    useCallback(() => {
      clearTimer();

      if (
        stepIndex <
        bodyScanSteps.length - 1
      ) {
        const nextIndex =
          stepIndex + 1;

        setStepIndex(
          nextIndex
        );

        setSecondsLeft(
          bodyScanSteps[
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
          "body-scan",

        toolName:
          "Body Scan",

        type:
          "body-scan",

        duration:
          "2–3 min"
      });
    }, [
      stepIndex,
      clearTimer
    ]);

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
        bodyScanSteps[0]
          .duration
      );

      setRunning(false);
      setPaused(false);
      setCompleted(false);
    };

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
            if (
              current <= 1
            ) {
              return 0;
            }

            return (
              current - 1
            );
          }
        );
      }, 1000);

    return clearTimer;
  }, [
    running,
    paused,
    completed,
    stepIndex,
    clearTimer
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
  }, [clearTimer]);

  return (
    <main className="body-scan-page">
      <header className="body-scan-header">
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
            Ground Yourself
          </span>

          <h1>
            Body Scan
          </h1>
        </div>
      </header>

      <section className="body-scan-progress">
        <div>
          <span>
            Progress
          </span>

          <strong>
            {completed
              ? "Complete"
              : `Step ${stepIndex + 1} of ${bodyScanSteps.length}`}
          </strong>
        </div>

        <span>
          {progress}%
        </span>

        <div className="body-scan-progress__track">
          <div
            style={{
              width:
                `${progress}%`
            }}
          />
        </div>
      </section>

      {!completed ? (
        <section className="body-scan-layout">
          <div className="body-scan-figure-card">
            <div className="body-scan-figure">
              <div
                className={
                  currentStep.id ===
                  "forehead"
                    ? "body-part body-part--head body-part--active"
                    : "body-part body-part--head"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "jaw"
                    ? "body-part body-part--jaw body-part--active"
                    : "body-part body-part--jaw"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "shoulders"
                    ? "body-part body-part--shoulders body-part--active"
                    : "body-part body-part--shoulders"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "chest"
                    ? "body-part body-part--chest body-part--active"
                    : "body-part body-part--chest"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "stomach"
                    ? "body-part body-part--stomach body-part--active"
                    : "body-part body-part--stomach"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "hands"
                    ? "body-part body-part--hands body-part--active"
                    : "body-part body-part--hands"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "legs"
                    ? "body-part body-part--legs body-part--active"
                    : "body-part body-part--legs"
                }
              />

              <div
                className={
                  currentStep.id ===
                  "feet"
                    ? "body-part body-part--feet body-part--active"
                    : "body-part body-part--feet"
                }
              />
            </div>

            <span>
              Current area
            </span>

            <strong>
              {currentStep.label}
            </strong>
          </div>

          <div className="body-scan-session-card">
            <span className="body-scan-eyebrow">
              Notice, don&apos;t judge
            </span>

            <h2>
              {
                currentStep.label
              }
            </h2>

            <p>
              {
                currentStep.instruction
              }
            </p>

            <div className="body-scan-timer">
              <strong>
                {secondsLeft}
              </strong>

              <span>
                seconds
              </span>
            </div>

            <div className="body-scan-steps">
              {bodyScanSteps.map(
                (
                  step,
                  index
                ) => (
                  <div
                    key={
                      step.id
                    }
                    className={
                      index ===
                      stepIndex
                        ? "body-scan-step body-scan-step--active"
                        : index <
                            stepIndex
                          ? "body-scan-step body-scan-step--complete"
                          : "body-scan-step"
                    }
                  >
                    <span>
                      {index <
                      stepIndex ? (
                        <Check
                          size={12}
                        />
                      ) : (
                        index + 1
                      )}
                    </span>

                    <strong>
                      {step.label}
                    </strong>
                  </div>
                )
              )}
            </div>

            <div className="body-scan-controls">
              {!running &&
                !paused && (
                  <button
                    type="button"
                    className="body-scan-primary"
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
                  className="body-scan-primary"
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
                  className="body-scan-primary"
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
                className="body-scan-secondary"
                onClick={
                  advanceStep
                }
              >
                Next area
              </button>

              <button
                type="button"
                className="body-scan-secondary"
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
          </div>
        </section>
      ) : (
        <section className="body-scan-complete">
          <div className="body-scan-complete__icon">
            <Check
              size={27}
            />
          </div>

          <span>
            Body scan complete
          </span>

          <h2>
            Take a moment
            before moving on.
          </h2>

          <p>
            Notice whether any area
            feels softer, heavier,
            warmer, calmer, or simply
            more noticeable than before.
          </p>

          <div className="body-scan-complete__actions">
            <button
              type="button"
              className="body-scan-secondary"
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
              className="body-scan-primary"
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

export default BodyScan;