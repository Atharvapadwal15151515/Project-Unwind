import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  HeartPulse,
  Sparkles
} from "lucide-react";

const moods = [
  {
    value: "excellent",
    emoji: "😄",
    label: "Excellent",
    message: "You are feeling bright today."
  },
  {
    value: "good",
    emoji: "🙂",
    label: "Good",
    message: "You seem to be doing okay."
  },
  {
    value: "neutral",
    emoji: "😐",
    label: "Okay",
    message: "A neutral day is completely valid."
  },
  {
    value: "low",
    emoji: "😔",
    label: "Low",
    message: "Be gentle with yourself today."
  },
  {
    value: "struggling",
    emoji: "😣",
    label: "Struggling",
    message: "You do not have to carry everything alone."
  }
];

const STORAGE_KEY = "unwind_daily_mood";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getSavedMood() {
  try {
    const savedValue = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (savedValue?.date === getTodayKey()) {
      return savedValue.mood;
    }
  } catch {
    return null;
  }

  return null;
}

function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState(
    getSavedMood
  );

  const [saved, setSaved] = useState(
    Boolean(getSavedMood())
  );

  useEffect(() => {
    if (!selectedMood) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        mood: selectedMood
      })
    );
  }, [selectedMood]);

  const selectedMoodDetails = moods.find(
    (mood) => mood.value === selectedMood
  );

  const handleMoodSelection = (moodValue) => {
    setSelectedMood(moodValue);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedMood) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        mood: selectedMood
      })
    );

    setSaved(true);

    window.dispatchEvent(
      new CustomEvent("unwind:mood-updated", {
        detail: {
          mood: selectedMood
        }
      })
    );
  };

  return (
    <motion.article
      className="dashboard-widget mood-check-in"
      initial={{
        opacity: 0,
        y: 24
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay: 0.05
      }}
    >
      <div className="dashboard-widget__header">
        <div>
          <span className="dashboard-widget__eyebrow">
            <HeartPulse size={14} />
            Daily check-in
          </span>

          <h2>How are you feeling?</h2>
        </div>

        <span className="dashboard-widget__header-icon">
          <Sparkles size={19} />
        </span>
      </div>

      <p className="dashboard-widget__description">
        There is no right answer. Choose what feels
        closest to your present moment.
      </p>

      <div className="mood-check-in__options">
        {moods.map((mood) => {
          const isSelected =
            selectedMood === mood.value;

          return (
            <motion.button
              type="button"
              key={mood.value}
              className={`mood-option ${
                isSelected
                  ? "mood-option--selected"
                  : ""
              }`}
              onClick={() =>
                handleMoodSelection(mood.value)
              }
              whileHover={{
                y: -5
              }}
              whileTap={{
                scale: 0.94
              }}
              aria-pressed={isSelected}
            >
              <span>{mood.emoji}</span>
              <small>{mood.label}</small>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedMoodDetails && (
          <motion.div
            key={selectedMoodDetails.value}
            className="mood-check-in__response"
            initial={{
              opacity: 0,
              y: 8
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0
            }}
          >
            <div>
              <strong>
                {selectedMoodDetails.emoji}{" "}
                {selectedMoodDetails.label}
              </strong>

              <p>
                {selectedMoodDetails.message}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? (
                <>
                  <CheckCircle2 size={16} />
                  Saved
                </>
              ) : (
                "Save check-in"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default MoodCheckIn;