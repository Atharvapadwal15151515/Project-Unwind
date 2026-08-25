import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

export function useBreathingSession(
  exercise
) {
  const phases =
    exercise?.phases || [];

  const defaultRounds =
    exercise?.defaultRounds ||
    4;

  const [
    rounds,
    setRounds
  ] = useState(
    defaultRounds
  );

  const [
    currentRound,
    setCurrentRound
  ] = useState(1);

  const [
    currentPhaseIndex,
    setCurrentPhaseIndex
  ] = useState(0);

  const [
    secondsRemaining,
    setSecondsRemaining
  ] = useState(
    phases[0]?.duration ||
      0
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

  const intervalRef =
    useRef(null);

  const currentPhase =
    phases[
      currentPhaseIndex
    ] || null;

  const totalPhases =
    phases.length *
    rounds;

  const completedPhases =
    (currentRound - 1) *
      phases.length +
    currentPhaseIndex;

  const progress =
    totalPhases > 0
      ? Math.min(
          100,
          Math.round(
            (completedPhases /
              totalPhases) *
              100
          )
        )
      : 0;

  const clearTimer =
    useCallback(
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
      },
      []
    );

  const restart =
    useCallback(
      () => {
        clearTimer();

        setCurrentRound(
          1
        );

        setCurrentPhaseIndex(
          0
        );

        setSecondsRemaining(
          phases[0]
            ?.duration ||
            0
        );

        setRunning(false);
        setPaused(false);
        setCompleted(false);
      },
      [
        phases,
        clearTimer
      ]
    );

  const start =
    useCallback(
      () => {
        if (
          completed
        ) {
          restart();

          setTimeout(
            () => {
              setRunning(
                true
              );
            },
            0
          );

          return;
        }

        setRunning(true);
        setPaused(false);
      },
      [
        completed,
        restart
      ]
    );

  const pause =
    useCallback(
      () => {
        setPaused(true);
        setRunning(false);

        clearTimer();
      },
      [clearTimer]
    );

  const resume =
    useCallback(
      () => {
        setPaused(false);
        setRunning(true);
      },
      []
    );

  useEffect(() => {
    if (
      !running ||
      paused ||
      completed ||
      !currentPhase
    ) {
      return;
    }

    clearTimer();

    intervalRef.current =
      setInterval(
        () => {
          setSecondsRemaining(
            (
              currentSeconds
            ) => {
              if (
                currentSeconds >
                1
              ) {
                return (
                  currentSeconds -
                  1
                );
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
    completed,
    currentPhase,
    clearTimer
  ]);

  useEffect(() => {
    if (
      !running ||
      paused ||
      completed ||
      secondsRemaining !==
        0
    ) {
      return;
    }

    clearTimer();

    const nextPhaseIndex =
      currentPhaseIndex +
      1;

    if (
      nextPhaseIndex <
      phases.length
    ) {
      setCurrentPhaseIndex(
        nextPhaseIndex
      );

      setSecondsRemaining(
        phases[
          nextPhaseIndex
        ]?.duration || 0
      );

      return;
    }

    if (
      currentRound <
      rounds
    ) {
      setCurrentRound(
        (
          round
        ) => round + 1
      );

      setCurrentPhaseIndex(
        0
      );

      setSecondsRemaining(
        phases[0]
          ?.duration || 0
      );

      return;
    }

    setCompleted(true);
    setRunning(false);
    setPaused(false);

    clearTimer();
  }, [
    secondsRemaining,
    running,
    paused,
    completed,
    currentPhaseIndex,
    currentRound,
    rounds,
    phases,
    clearTimer
  ]);

  useEffect(() => {
    restart();
  }, [
    exercise?.id
  ]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const sessionState =
    useMemo(
      () => {
        if (
          completed
        ) {
          return "completed";
        }

        if (
          paused
        ) {
          return "paused";
        }

        if (
          running
        ) {
          return "running";
        }

        return "idle";
      },
      [
        completed,
        paused,
        running
      ]
    );

  return {
    rounds,
    setRounds,

    currentRound,

    currentPhase,
    currentPhaseIndex,

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
  };
}

export default useBreathingSession;