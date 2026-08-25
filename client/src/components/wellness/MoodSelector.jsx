import {
  wellnessGoals
} from "../../data/wellness/emotions";

import "./MoodSelector.css";

function MoodSelector({
  selectedGoal,
  onSelect
}) {
  return (
    <div className="wellness-mood-selector">
      {wellnessGoals.map(
        (goal) => {
          const selected =
            selectedGoal ===
            goal.id;

          return (
            <button
              key={
                goal.id
              }
              type="button"
              className={
                selected
                  ? "wellness-mood-chip wellness-mood-chip--selected"
                  : "wellness-mood-chip"
              }
              aria-pressed={
                selected
              }
              onClick={() =>
                onSelect?.(
                  selected
                    ? null
                    : goal.id
                )
              }
            >
              <span>
                {goal.emoji}
              </span>

              <strong>
                {goal.label}
              </strong>
            </button>
          );
        }
      )}
    </div>
  );
}

export default MoodSelector;