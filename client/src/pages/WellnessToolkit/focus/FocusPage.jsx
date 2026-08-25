import {
  ArrowLeft,
  Check,
  Pause,
  Play,
  RefreshCcw,
  TimerReset
} from "lucide-react";

import {
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

import "./FocusPage.css";

const presets = [
  {
    id: "focus-25",
    label: "25 min Focus",
    minutes: 25
  },
  {
    id: "break-5",
    label: "5 min Break",
    minutes: 5
  },
  {
    id: "deep-50",
    label: "50 min Deep Work",
    minutes: 50
  }
];

function FocusPage() {
  const navigate =
    useNavigate();

  const intervalRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const [
    selectedPreset,
    setSelectedPreset
  ] = useState("focus-25");

  const [
    customMinutes,
    setCustomMinutes
  ] = useState(20);

  const [
    durationMinutes,
    setDurationMinutes
  ] = useState(25);

  const [
    secondsLeft,
    setSecondsLeft
  ] = useState(
    25 * 60
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

  const totalSeconds =
    durationMinutes * 60;

  const progress =
    totalSeconds > 0
      ? Math.min(
          100,
          Math.round(
            ((totalSeconds -
              secondsLeft) /
              totalSeconds) *
              100
          )
        )
      : 0;

  const formattedTime =
    useMemo(() => {
      const minutes =
        Math.floor(
          secondsLeft / 60
        );

      const seconds =
        secondsLeft % 60;

      return `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        seconds
      ).padStart(
        2,
        "0"
      )}`;
    }, [secondsLeft]);

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

  const playCompletionTone =
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
          520,
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

  const applyDuration =
    (
      minutes,
      presetId
    ) => {
      clearTimer();

      setSelectedPreset(
        presetId
      );

      setDurationMinutes(
        minutes
      );

      setSecondsLeft(
        minutes * 60
      );

      setRunning(false);
      setPaused(false);
      setCompleted(false);
    };

  const handleCustom =
    () => {
      const value =
        Number(
          customMinutes
        );

      if (
        !Number.isFinite(
          value
        ) ||
        value < 1 ||
        value > 180
      ) {
        return;
      }

      applyDuration(
        value,
        "custom"
      );
    };

  const start =
    () => {
      if (
        completed
      ) {
        setSecondsLeft(
          totalSeconds
        );

        setCompleted(false);
      }

      setRunning(true);
      setPaused(false);
    };

  const pause =
    () => {
      setRunning(false);
      setPaused(true);

      clearTimer();
    };

  const resume =
    () => {
      setPaused(false);
      setRunning(true);
    };

  const restart =
    () => {
      clearTimer();

      setSecondsLeft(
        totalSeconds
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
      setInterval(
        () => {
          setSecondsLeft(
            (
              current
            ) => {
              if (
                current > 1
              ) {
                return current - 1;
              }

              return 0;
            }
          );
        },
        1000
      );

    return clearTimer;
  }, [
    running,
    paused,
    completed
  ]);

  useEffect(() => {
    if (
      secondsLeft !== 0 ||
      completed
    ) {
      return;
    }

    clearTimer();

    setRunning(false);
    setPaused(false);
    setCompleted(true);

    playCompletionTone();

    addWellnessHistoryEntry({
      toolId:
        "focus-timer",

      toolName:
        "Focus Timer",

      type:
        "focus",

      durationMinutes
    });
  }, [
    secondsLeft,
    completed,
    durationMinutes
  ]);

  useEffect(() => {
    return clearTimer;
  }, []);

  return (
    <main className="focus-page">
      <header className="focus-header">
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
            Focus & Productivity
          </span>

          <h1>
            Focus Timer
          </h1>
        </div>
      </header>

      <section className="focus-layout">
        <aside className="focus-settings-card">
          <div className="focus-settings-card__icon">
            <TimerReset
              size={23}
            />
          </div>

          <span>
            Choose a session
          </span>

          <h2>
            How long do you want
            to focus?
          </h2>

          <div className="focus-preset-list">
            {presets.map(
              (preset) => (
                <button
                  key={
                    preset.id
                  }
                  type="button"
                  className={
                    selectedPreset ===
                    preset.id
                      ? "focus-preset focus-preset--active"
                      : "focus-preset"
                  }
                  onClick={() =>
                    applyDuration(
                      preset.minutes,
                      preset.id
                    )
                  }
                >
                  <strong>
                    {preset.label}
                  </strong>

                  <span>
                    {
                      preset.minutes
                    }{" "}
                    minutes
                  </span>
                </button>
              )
            )}
          </div>

          <div className="focus-custom">
            <label>
              <span>
                Custom minutes
              </span>

              <input
                type="number"
                min="1"
                max="180"
                value={
                  customMinutes
                }
                onChange={(
                  event
                ) =>
                  setCustomMinutes(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <button
              type="button"
              onClick={
                handleCustom
              }
            >
              Use custom
            </button>
          </div>
        </aside>

        <section className="focus-session-card">
          {!completed ? (
            <>
              <span className="focus-session-card__eyebrow">
                {running
                  ? "Focus session"
                  : paused
                    ? "Paused"
                    : "Ready when you are"}
              </span>

              <h2>
                {selectedPreset ===
                "break-5"
                  ? "Take a short break."
                  : "Focus on one thing."}
              </h2>

              <div className="focus-timer-ring">
                <div
                  className="focus-timer-ring__progress"
                  style={{
                    "--focus-progress":
                      `${progress}%`
                  }}
                >
                  <div className="focus-timer-ring__center">
                    <span>
                      {selectedPreset ===
                      "break-5"
                        ? "BREAK"
                        : "FOCUS"}
                    </span>

                    <strong>
                      {formattedTime}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="focus-progress-text">
                <span>
                  {progress}% complete
                </span>

                <span>
                  {durationMinutes} min
                  session
                </span>
              </div>

              <div className="focus-controls">
                {!running &&
                  !paused && (
                    <button
                      type="button"
                      className="focus-primary"
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
                    className="focus-primary"
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
                    className="focus-primary"
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
                  className="focus-secondary"
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
            </>
          ) : (
            <div className="focus-complete">
              <div className="focus-complete__icon">
                <Check
                  size={27}
                />
              </div>

              <span>
                Session complete
              </span>

              <h2>
                Nice work.
              </h2>

              <p>
                You completed a{" "}
                {durationMinutes}
                -minute session.
                Take a moment before
                deciding what comes
                next.
              </p>

              <div className="focus-complete__actions">
                <button
                  type="button"
                  className="focus-secondary"
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
                  className="focus-primary"
                  onClick={() =>
                    navigate(
                      "/dashboard/toolkit"
                    )
                  }
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default FocusPage;