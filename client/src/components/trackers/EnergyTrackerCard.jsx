import {
  BatteryCharging,
  CheckCircle2,
  Save,
  Zap
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";
import ButtonLoader
  from "../common/AppStates/ButtonLoader";

const energyOptions = [
  {
    value: 1,
    label: "Drained"
  },
  {
    value: 2,
    label: "Low"
  },
  {
    value: 3,
    label: "Steady"
  },
  {
    value: 4,
    label: "Energised"
  },
  {
    value: 5,
    label: "Thriving"
  }
];

function EnergyTrackerCard({
  entry,
  saving,
  onSave
}) {
  const [form, setForm] = useState({
    energyScore: 3,
    fatigueScore: 3,
    focusScore: 3,
    motivationScore: 3,
    physicalEnergyScore: 3,
    mentalEnergyScore: 3,
    contextCategory: "daily_check_in",
    note: ""
  });
const [
  saved,
  setSaved
] = useState(false);
  useEffect(() => {
    if (!entry) {
      return;
    }

    setForm({
      energyScore:
        entry.energy_score ||
        entry.energyScore ||
        3,

      fatigueScore:
        entry.fatigue_score ??
        entry.fatigueScore ??
        3,

      focusScore:
        entry.focus_score ??
        entry.focusScore ??
        3,

      motivationScore:
        entry.motivation_score ??
        entry.motivationScore ??
        3,

      physicalEnergyScore:
        entry.physical_energy_score ??
        entry.physicalEnergyScore ??
        3,

      mentalEnergyScore:
        entry.mental_energy_score ??
        entry.mentalEnergyScore ??
        3,

      contextCategory:
        entry.context_category ||
        entry.contextCategory ||
        "daily_check_in",

      note: entry.note || ""
    });
  }, [entry]);

 const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    setSaved(false);

    await onSave({
      ...form,
      note:
        form.note.trim() ||
        null
    });

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  } catch {
    // The parent tracker hook displays the error.
  }
};

  const selectedOption =
    energyOptions.find(
      (option) =>
        option.value ===
        form.energyScore
    );

  return (
    <article className="tracker-card tracker-card--energy">
      <header className="tracker-card__header">
        <div>
          <span className="tracker-card__eyebrow">
            <Zap size={14} />
            Energy
          </span>

          <h2>How energised are you?</h2>

          <p>
            Notice both physical and mental
            energy.
          </p>
        </div>

        <span className="energy-battery">
          <BatteryCharging size={20} />
          {form.energyScore}/5
        </span>
      </header>

      <form
  onSubmit={handleSubmit}
  aria-busy={saving}
>
        <div className="energy-selector">
          {energyOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              disabled={saving}
              className={
                option.value ===
                form.energyScore
                  ? "energy-selector__option energy-selector__option--active"
                  : "energy-selector__option"
              }
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  energyScore: option.value
                }))
              }
            >
              <span>{option.value}</span>
              <small>{option.label}</small>
            </button>
          ))}
        </div>

        <div className="energy-level-display">
          <div>
            <span
              style={{
                width: `${
                  form.energyScore * 20
                }%`
              }}
            />
          </div>

          <strong>
            {selectedOption?.label}
          </strong>
        </div>

        <div className="tracker-range-grid">
          {[
            {
              key: "physicalEnergyScore",
              label: "Physical energy"
            },
            {
              key: "mentalEnergyScore",
              label: "Mental energy"
            },
            {
              key: "focusScore",
              label: "Focus"
            },
            {
              key: "motivationScore",
              label: "Motivation"
            },
            {
              key: "fatigueScore",
              label: "Fatigue"
            }
          ].map((item) => (
            <label key={item.key}>
              <span>
                {item.label}

                <strong>
                  {form[item.key]}/5
                </strong>
              </span>

              <input
                type="range"
                min="1"
                max="5"
                value={form[item.key]}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [item.key]: Number(
                      event.target.value
                    )
                  }))
                }
              />
            </label>
          ))}
        </div>

        <label className="tracker-textarea">
          <span>
            Add a note{" "}
            <small>Optional</small>
          </span>

          <textarea
            value={form.note}
            maxLength={5000}
            rows={3}
            disabled={saving}
            placeholder="What is affecting your energy today?"
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
  className={
    saved
      ? "tracker-save-button tracker-save-button--success"
      : "tracker-save-button"
  }
  disabled={saving}
  aria-live="polite"
>
  {saving ? (
    <ButtonLoader
      label={
        entry
          ? "Updating energy…"
          : "Saving energy…"
      }
      size="small"
    />
  ) : saved ? (
    <>
      <CheckCircle2 size={16} />
      Energy saved
    </>
  ) : (
    <>
      <Save size={16} />

      {entry
        ? "Update energy"
        : "Save energy"}
    </>
  )}
</button>
      </form>
    </article>
  );
}

export default EnergyTrackerCard;