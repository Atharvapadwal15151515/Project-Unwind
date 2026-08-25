import {
  ArrowLeft,
  Pause,
  Play,
  RefreshCcw,
  Volume2,
  VolumeX
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getBreathingExercise
} from "../../../data/wellness/breathingExercises";

import useBreathingSession
  from "../../../hooks/wellness/useBreathingSession";

import BreathingOrb
  from "../../../components/wellness/BreathingOrb";

import {
  addWellnessHistoryEntry
} from "../../../utils/wellnessStorage";

import "./BreathingPage.css";

function BreathingPage() {
  const navigate =
    useNavigate();

  const {
    exerciseId
  } = useParams();

  const exercise =
    useMemo(
      () =>
        getBreathingExercise(
          exerciseId
        ),
      [exerciseId]
    );

  const [
    soundEnabled,
    setSoundEnabled
  ] = useState(false);

  const audioContextRef =
  useRef(null);

  const previousPhaseRef =
  useRef(null);

  const playTone = (
  frequency = 440,
  duration = 0.25
) => {
  if (!soundEnabled) {
    return;
  }

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
      frequency,
      context.currentTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.08,
      context.currentTime +
        0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime +
        duration
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
        duration
    );
  } catch (error) {
    console.warn(
      "Unable to play breathing sound:",
      error
    );
  }
};

  const {
    rounds,
    setRounds,

    currentRound,

    currentPhase,

    secondsRemaining,

    progress,

    running,
    paused,
    completed,
    sessionState,

    start,
    pause,
    resume,
    restart
  } = useBreathingSession(
    exercise
  );

  useEffect(() => {
  if (
    !soundEnabled ||
    !running ||
    paused ||
    completed ||
    !currentPhase
  ) {
    return;
  }

  if (
    previousPhaseRef.current ===
    currentPhase.id
  ) {
    return;
  }

  previousPhaseRef.current =
    currentPhase.id;

  switch (
    currentPhase.id
  ) {
    case "inhale":
      playTone(
        440,
        0.35
      );
      break;

    case "exhale":
      playTone(
        330,
        0.4
      );
      break;

    default:
      playTone(
        380,
        0.2
      );
      break;
  }
}, [
  currentPhase,
  soundEnabled,
  running,
  paused,
  completed
]);

  if (!exercise) {
    return (
      <main className="breathing-page breathing-page--missing">
        <div className="breathing-missing-card">
          <h1>
            Breathing exercise not found
          </h1>

          <p>
            This breathing exercise
            could not be loaded.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard/toolkit"
              )
            }
          >
            Return to Toolkit
          </button>
        </div>
      </main>
    );
  }

  const handleComplete =
    () => {
      addWellnessHistoryEntry({
        toolId:
          exercise.id,

        toolName:
          exercise.name,

        type:
          "breathing",

        duration:
          `${rounds} rounds`
      });

      navigate(
        "/dashboard/toolkit"
      );
    };

  return (
    <main className="breathing-page">
      <header className="breathing-page__header">
        <button
          type="button"
          className="breathing-back-button"
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
            Breathe & Relax
          </span>

          <h1>
            {exercise.name}
          </h1>
        </div>

        <button
          type="button"
          className="breathing-sound-button"
          onClick={() =>
            setSoundEnabled(
              (
                current
              ) => !current
            )
          }
          aria-label={
            soundEnabled
              ? "Turn sound off"
              : "Turn sound on"
          }
        >
          {soundEnabled ? (
            <Volume2
              size={17}
            />
          ) : (
            <VolumeX
              size={17}
            />
          )}
        </button>
      </header>

      <section className="breathing-intro-card">
        <div>
          <span>
            Gentle breathing
          </span>

          <h2>
            Follow the rhythm
            at your own pace.
          </h2>

          <p>
            {exercise.description}
          </p>
        </div>

        <div className="breathing-round-selector">
          <label>
            Rounds
          </label>

          <select
            value={
              rounds
            }
            disabled={
              running ||
              paused
            }
            onChange={(
              event
            ) =>
              setRounds(
                Number(
                  event
                    .target
                    .value
                )
              )
            }
          >
            {[2, 4, 6, 8, 10].map(
              (value) => (
                <option
                  key={
                    value
                  }
                  value={
                    value
                  }
                >
                  {value}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      <section className="breathing-session-card">
        <div className="breathing-progress-row">
          <div>
            <span>
              Session progress
            </span>

            <strong>
              {completed
                ? "Complete"
                : `Round ${currentRound} of ${rounds}`}
            </strong>
          </div>

          <span>
            {progress}%
          </span>
        </div>

        <div className="breathing-progress-track">
          <div
            style={{
              width:
                `${progress}%`
            }}
          />
        </div>

        <div className="breathing-orb-area">
          {completed ? (
            <div className="breathing-complete">
              <div className="breathing-complete__icon">
                ✓
              </div>

              <span>
                Session complete
              </span>

              <h2>
                Nicely done.
              </h2>

              <p>
                Take a moment to
                notice how your body
                feels before you
                continue.
              </p>
            </div>
          ) : (
            <BreathingOrb
              phase={
                currentPhase
                  ?.id
              }
              phaseLabel={
                currentPhase
                  ?.label ||
                "Ready"
              }
              phaseDuration={
                currentPhase
                  ?.duration ||
                0
              }
              secondsRemaining={
                secondsRemaining
              }
              paused={
                paused
              }
            />
          )}
        </div>

        {!completed && (
          <div className="breathing-phase-details">
            {exercise.phases.map(
              (
                phase,
                index
              ) => {
                const active =
                  currentPhase
                    ?.id ===
                  phase.id;

                return (
                  <div
                    key={
                      `${phase.id}-${index}`
                    }
                    className={
                      active
                        ? "breathing-phase-item breathing-phase-item--active"
                        : "breathing-phase-item"
                    }
                  >
                    <span>
                      {phase.label}
                    </span>

                    <strong>
                      {
                        phase.duration
                      }
                      s
                    </strong>
                  </div>
                );
              }
            )}
          </div>
        )}

        <div className="breathing-controls">
          {sessionState ===
            "idle" && (
            <button
              type="button"
              className="breathing-primary-control"
              onClick={
                start
              }
            >
              <Play
                size={18}
              />

              Start
            </button>
          )}

          {running && (
            <button
              type="button"
              className="breathing-primary-control"
              onClick={
                pause
              }
            >
              <Pause
                size={18}
              />

              Pause
            </button>
          )}

          {paused && (
            <button
              type="button"
              className="breathing-primary-control"
              onClick={
                resume
              }
            >
              <Play
                size={18}
              />

              Resume
            </button>
          )}

          {!completed && (
            <button
              type="button"
              className="breathing-secondary-control"
              onClick={
                restart
              }
            >
              <RefreshCcw
                size={17}
              />

              Restart
            </button>
          )}

          {completed && (
            <>
              <button
                type="button"
                className="breathing-secondary-control"
                onClick={() => {
  previousPhaseRef.current =
    null;

  restart();
}}
              >
                <RefreshCcw
                  size={17}
                />

                Do again
              </button>

              <button
                type="button"
                className="breathing-primary-control"
                onClick={() => {
  previousPhaseRef.current =
    null;

  restart();
}}
              >
                Done
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default BreathingPage;