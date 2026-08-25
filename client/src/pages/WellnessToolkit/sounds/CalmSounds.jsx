import {
  ArrowLeft,
  Clock3,
  CloudRain,
  Flame,
  Leaf,
  Pause,
  Play,
  Save,
  Trees,
  Volume2,
  Waves,
  Wind
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

import "./CalmSounds.css";

const SOUND_MIX_KEY =
  "unwind.wellness.soundMix";

const sounds = [
  {
    id: "rain",
    name: "Rain",
    description:
      "Steady rainfall for a softer background.",
    icon: CloudRain,
    source:
      "/audio/wellness/rain.mp3"
  },

  {
    id: "ocean",
    name: "Ocean",
    description:
      "Slow waves moving in and out.",
    icon: Waves,
    source:
      "/audio/wellness/ocean.mp3"
  },

  {
    id: "fireplace",
    name: "Fireplace",
    description:
      "A quiet crackling fire.",
    icon: Flame,
    source:
      "/audio/wellness/fireplace.mp3"
  },

  {
    id: "forest",
    name: "Forest",
    description:
      "A gentle outdoor forest atmosphere.",
    icon: Trees,
    source:
      "/audio/wellness/forest.mp3"
  },

  {
    id: "wind",
    name: "Wind",
    description:
      "Soft moving air for a calm environment.",
    icon: Wind,
    source:
      "/audio/wellness/wind.mp3"
  }
];

const defaultVolumes = {
  rain: 0.65,
  ocean: 0,
  fireplace: 0,
  forest: 0,
  wind: 0
};

function loadSavedMix() {
  try {
    const stored =
      localStorage.getItem(
        SOUND_MIX_KEY
      );

    if (!stored) {
      return defaultVolumes;
    }

    return {
      ...defaultVolumes,
      ...JSON.parse(stored)
    };
  } catch {
    return defaultVolumes;
  }
}

function CalmSounds() {
  const navigate =
    useNavigate();

  const audioRefs =
    useRef({});

  const timerRef =
    useRef(null);

  const [
    volumes,
    setVolumes
  ] = useState(
    loadSavedMix
  );

  const [
    playing,
    setPlaying
  ] = useState(false);

  const [
    timerMinutes,
    setTimerMinutes
  ] = useState(0);

  const [
    secondsRemaining,
    setSecondsRemaining
  ] = useState(0);

  const [
    savedMessage,
    setSavedMessage
  ] = useState("");

  const activeSoundCount =
    useMemo(
      () =>
        Object.values(
          volumes
        ).filter(
          (volume) =>
            volume > 0
        ).length,
      [volumes]
    );

  const formattedTimer =
    useMemo(() => {
      if (
        secondsRemaining <= 0
      ) {
        return null;
      }

      const minutes =
        Math.floor(
          secondsRemaining /
            60
        );

      const seconds =
        secondsRemaining %
        60;

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
    }, [
      secondsRemaining
    ]);

  const stopAllAudio =
    () => {
      Object.values(
        audioRefs.current
      ).forEach(
        (audio) => {
          if (!audio) {
            return;
          }

          audio.pause();
        }
      );

      setPlaying(false);
    };

  const startAudio =
    async () => {
      const playableSounds =
        sounds.filter(
          (sound) =>
            volumes[
              sound.id
            ] > 0
        );

      if (
        playableSounds.length ===
        0
      ) {
        return;
      }

      try {
        await Promise.all(
          playableSounds.map(
            async (
              sound
            ) => {
              const audio =
                audioRefs
                  .current[
                    sound.id
                  ];

              if (!audio) {
                return;
              }

              audio.volume =
                volumes[
                  sound.id
                ];

              await audio.play();
            }
          )
        );

        setPlaying(true);

        addWellnessHistoryEntry({
          toolId:
            "calm-sounds",

          toolName:
            "Calming Sounds",

          type:
            "calm-sounds",

          activeSounds:
            playableSounds.map(
              (
                sound
              ) =>
                sound.id
            )
        });
      } catch (
        error
      ) {
        console.error(
          "Unable to play wellness audio:",
          error
        );
      }
    };

  const togglePlaying =
    () => {
      if (playing) {
        stopAllAudio();
        return;
      }

      startAudio();
    };

  const handleVolumeChange =
    (
      soundId,
      value
    ) => {
      const volume =
        Number(value);

      setVolumes(
        (
          current
        ) => ({
          ...current,
          [soundId]:
            volume
        })
      );

      const audio =
        audioRefs.current[
          soundId
        ];

      if (audio) {
        audio.volume =
          volume;

        if (
          playing &&
          volume > 0 &&
          audio.paused
        ) {
          audio
            .play()
            .catch(
              () => {}
            );
        }

        if (
          volume === 0
        ) {
          audio.pause();
        }
      }
    };

  const saveMix =
    () => {
      try {
        localStorage.setItem(
          SOUND_MIX_KEY,
          JSON.stringify(
            volumes
          )
        );

        setSavedMessage(
          "Mix saved"
        );

        window.setTimeout(
          () =>
            setSavedMessage(
              ""
            ),
          1600
        );
      } catch {
        setSavedMessage(
          "Unable to save mix"
        );
      }
    };

  const startTimer =
    (
      minutes
    ) => {
      setTimerMinutes(
        minutes
      );

      if (
        minutes === 0
      ) {
        setSecondsRemaining(
          0
        );

        return;
      }

      setSecondsRemaining(
        minutes * 60
      );
    };

  useEffect(() => {
    if (
      secondsRemaining <= 0
    ) {
      return;
    }

    clearInterval(
      timerRef.current
    );

    timerRef.current =
      setInterval(
        () => {
          setSecondsRemaining(
            (
              current
            ) => {
              if (
                current <= 1
              ) {
                clearInterval(
                  timerRef.current
                );

                Object.values(
                  audioRefs.current
                ).forEach(
                  (
                    audio
                  ) => {
                    audio?.pause();
                  }
                );

                setPlaying(
                  false
                );

                return 0;
              }

              return (
                current - 1
              );
            }
          );
        },
        1000
      );

    return () =>
      clearInterval(
        timerRef.current
      );
  }, [
    secondsRemaining > 0
  ]);

  useEffect(() => {
    return () => {
      clearInterval(
        timerRef.current
      );

      Object.values(
        audioRefs.current
      ).forEach(
        (audio) => {
          audio?.pause();
        }
      );
    };
  }, []);

  return (
    <main className="calm-sounds-page">
      {/* AUDIO ELEMENTS */}

      <div
        aria-hidden="true"
        className="calm-sounds-audio"
      >
        {sounds.map(
          (sound) => (
            <audio
              key={
                sound.id
              }
              ref={(
                element
              ) => {
                audioRefs.current[
                  sound.id
                ] = element;
              }}
              src={
                sound.source
              }
              loop
              preload="auto"
            />
          )
        )}
      </div>

      {/* HEADER */}

      <header className="calm-sounds-header">
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
            Calm & Sensory
          </span>

          <h1>
            Calming Sounds
          </h1>
        </div>
      </header>

      <section className="calm-sounds-hero">
        <div className="calm-sounds-hero__visual">
          <div
            className={
              playing
                ? "calm-sounds-visual-orb calm-sounds-visual-orb--playing"
                : "calm-sounds-visual-orb"
            }
          >
            <Leaf
              size={30}
            />
          </div>
        </div>

        <div className="calm-sounds-hero__copy">
          <span>
            Sound mixer
          </span>

          <h2>
            Build a space that
            feels a little quieter.
          </h2>

          <p>
            Combine multiple
            ambient sounds and
            adjust each one
            independently.
          </p>

          <p className="calm-sounds-headphone-note">
  🎧 Use headphones for a better experience
</p>

          <div className="calm-sounds-summary">
            <span>
              {
                activeSoundCount
              }{" "}
              {activeSoundCount ===
              1
                ? "sound"
                : "sounds"}{" "}
              active
            </span>

            {formattedTimer && (
              <span>
                <Clock3
                  size={13}
                />

                {
                  formattedTimer
                }
              </span>
            )}
          </div>

          <div className="calm-sounds-main-actions">
            <button
              type="button"
              className="calm-sounds-play"
              disabled={
                activeSoundCount ===
                0
              }
              onClick={
                togglePlaying
              }
            >
              {playing ? (
                <>
                  <Pause
                    size={17}
                  />

                  Pause
                </>
              ) : (
                <>
                  <Play
                    size={17}
                  />

                  Play mix
                </>
              )}
            </button>

            <button
              type="button"
              className="calm-sounds-save"
              onClick={
                saveMix
              }
            >
              <Save
                size={16}
              />

              {savedMessage ||
                "Save mix"}
            </button>
          </div>
        </div>
      </section>

      {/* MIXER */}

      <section className="calm-sounds-section">
        <header className="calm-sounds-section__header">
          <div>
            <span>
              Mixer
            </span>

            <h2>
              Choose your sounds
            </h2>
          </div>

          <Volume2
            size={18}
          />
        </header>

        <div className="calm-sounds-mixer">
          {sounds.map(
            (sound) => {
              const Icon =
                sound.icon;

              const volume =
                volumes[
                  sound.id
                ];

              const active =
                volume > 0;

              return (
                <article
                  key={
                    sound.id
                  }
                  className={
                    active
                      ? "calm-sound-card calm-sound-card--active"
                      : "calm-sound-card"
                  }
                >
                  <div className="calm-sound-card__top">
                    <span className="calm-sound-card__icon">
                      <Icon
                        size={20}
                      />
                    </span>

                    <span className="calm-sound-card__percentage">
                      {Math.round(
                        volume *
                          100
                      )}
                      %
                    </span>
                  </div>

                  <h3>
                    {
                      sound.name
                    }
                  </h3>

                  <p>
                    {
                      sound.description
                    }
                  </p>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      volume
                    }
                    aria-label={`${sound.name} volume`}
                    onChange={(
                      event
                    ) =>
                      handleVolumeChange(
                        sound.id,
                        event
                          .target
                          .value
                      )
                    }
                  />

                  <div className="calm-sound-card__range-labels">
                    <span>
                      Off
                    </span>

                    <span>
                      Full
                    </span>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* TIMER */}

      <section className="calm-sounds-section">
        <header className="calm-sounds-section__header">
          <div>
            <span>
              Sleep timer
            </span>

            <h2>
              Stop automatically
            </h2>
          </div>

          <Clock3
            size={18}
          />
        </header>

        <div className="calm-sounds-timers">
          {[
            {
              label:
                "No timer",
              value: 0
            },
            {
              label:
                "10 min",
              value: 10
            },
            {
              label:
                "20 min",
              value: 20
            },
            {
              label:
                "30 min",
              value: 30
            },
            {
              label:
                "60 min",
              value: 60
            }
          ].map(
            (
              timer
            ) => (
              <button
                key={
                  timer.value
                }
                type="button"
                className={
                  timerMinutes ===
                  timer.value
                    ? "calm-sounds-timer calm-sounds-timer--active"
                    : "calm-sounds-timer"
                }
                onClick={() =>
                  startTimer(
                    timer.value
                  )
                }
              >
                {
                  timer.label
                }
              </button>
            )
          )}
        </div>
      </section>
    </main>
  );
}

export default CalmSounds;