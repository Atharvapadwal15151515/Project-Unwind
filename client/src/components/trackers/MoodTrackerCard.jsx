import {
  CheckCircle2,
  Save,
  Smile
} from "lucide-react";
import {
  UnwindSlider
} from "../common/UnwindControls/UnwindControls";
import ButtonLoader
  from "../common/AppStates/ButtonLoader";
import {
  useEffect,
  useState
} from "react";

const moodOptions = [
  {
    label: "very_low",
    score: 1,
    emoji: "😞",
    text: "Very low"
  },
  {
    label: "low",
    score: 2,
    emoji: "😕",
    text: "Low"
  },
  {
    label: "neutral",
    score: 3,
    emoji: "😐",
    text: "Neutral"
  },
  {
    label: "good",
    score: 4,
    emoji: "🙂",
    text: "Good"
  },
  {
    label: "very_good",
    score: 5,
    emoji: "😊",
    text: "Very good"
  }
];

function getMetadataList(
  metadata,
  possibleKeys
) {
  for (const key of possibleKeys) {
    if (Array.isArray(metadata?.[key])) {
      return metadata[key];
    }
  }

  return [];
}

function getMetadataId(item) {
  return (
    item?.emotion_id ||
    item?.emotionId ||
    item?.id
  );
}

function getMetadataName(item) {
  return (
    item?.emotion_name ||
    item?.emotionName ||
    item?.name ||
    item?.label ||
    "Emotion"
  );
}

function MoodTrackerCard({
  entry,
  metadata,
  saving,
  onSave
}) {
  const [form, setForm] = useState({
    moodLabel: "neutral",
    moodScore: 3,
    intensity: 3,
    stressScore: 5,
    note: "",
    emotionIds: []
  });

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    if (!entry) {
      return;
    }

    setForm({
      moodLabel:
        entry.mood_label ||
        entry.moodLabel ||
        "neutral",

      moodScore:
        entry.mood_score ||
        entry.moodScore ||
        3,

      intensity:
        entry.intensity || 3,

      stressScore:
        entry.stress_score ??
        entry.stressScore ??
        5,

      note:
        entry.note || "",

      emotionIds:
        entry.emotion_ids ||
        entry.emotionIds ||
        []
    });
  }, [entry]);

  const emotions = getMetadataList(
    metadata,
    ["emotions", "trackerEmotions"]
  );

  const toggleEmotion = (emotionId) => {
    setForm((current) => ({
      ...current,
      emotionIds:
        current.emotionIds.includes(
          emotionId
        )
          ? current.emotionIds.filter(
              (id) => id !== emotionId
            )
          : [
              ...current.emotionIds,
              emotionId
            ]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onSave({
      ...form,
      note: form.note.trim() || null,
      energyScore: null,
      triggerCategory: null,
      triggerNote: null,
      activityIds: []
    });

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <article className="tracker-card tracker-card--mood">
      <header className="tracker-card__header">
        <div>
          <span className="tracker-card__eyebrow">
            <Smile size={14} />
            Mood
          </span>

          <h2>How do you feel?</h2>

          <p>
            Choose the option that feels closest.
          </p>
        </div>

        {entry && (
          <span className="tracker-card__logged">
            Logged
          </span>
        )}
      </header>

      <form
  onSubmit={handleSubmit}
  aria-busy={saving}
>
        <div className="mood-selector">
          {moodOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={saving}
              className={
                form.moodLabel ===
                option.label
                  ? "mood-selector__option mood-selector__option--active"
                  : "mood-selector__option"
              }
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  moodLabel: option.label,
                  moodScore: option.score
                }))
              }
            >
              <span>{option.emoji}</span>
              <small>{option.text}</small>
            </button>
          ))}
        </div>

        <div className="tracker-range-grid">
          <label>
            <span>
              Emotional intensity
              <strong>
                {form.intensity}/5
              </strong>
            </span>

           <UnwindSlider
  min={1}
  max={5}
  step={1}
  value={form.intensity}
  showValue
  onChange={(event) =>
    setForm((current) => ({
      ...current,
      intensity: Number(
        event.target.value
      )
    }))
  }
/>
          </label>

          <label>
            <span>
              Stress level
              <strong>
                {form.stressScore}/10
              </strong>
            </span>

            <UnwindSlider
  min={1}
  max={10}
  step={1}
  value={form.stressScore}
  showValue
  onChange={(event) =>
    setForm((current) => ({
      ...current,
      stressScore: Number(
        event.target.value
      )
    }))
  }
/>
          </label>
        </div>

        {emotions.length > 0 && (
          <div className="tracker-tags">
            <span>What are you feeling?</span>

            <div>
              {emotions
                .slice(0, 10)
                .map((emotion) => {
                  const emotionId =
                    getMetadataId(emotion);

                  return (
                    <button
                      key={emotionId}
                      type="button"
                      disabled={saving}
                      className={
                        form.emotionIds.includes(
                          emotionId
                        )
                          ? "tracker-tag tracker-tag--active"
                          : "tracker-tag"
                      }
                      onClick={() =>
                        toggleEmotion(
                          emotionId
                        )
                      }
                    >
                      {getMetadataName(
                        emotion
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <label className="tracker-textarea">
          <span>
            Add a note{" "}
            <small>Optional</small>
          </span>

          <textarea
            value={form.note}
            maxLength={5000}
            rows={3}
            placeholder="What is influencing your mood today?"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                note: event.target.value
              }))
            }
          />
        </label>

        <button
          type="submit"
          className="tracker-save-button"
          disabled={saving}
        >
          {saving ? (
            <LoaderCircle
              size={16}
              className="trackers-icon-spin"
            />
          ) : (
            <Save size={16} />
          )}

          {saving
            ? "Saving…"
            : saved
              ? "Mood saved"
              : entry
                ? "Update mood"
                : "Save mood"}
        </button>
      </form>
    </article>
  );
}

export default MoodTrackerCard;