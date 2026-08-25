import {
  motion
} from "framer-motion";

function clampScore(score) {
  const numericScore =
    Number(score);

  if (
    !Number.isFinite(
      numericScore
    )
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      Math.round(
        numericScore
      ),
      0
    ),
    100
  );
}

function getScoreInformation(
  score
) {
  if (score >= 85) {
    return {
      label: "Thriving",
      description:
        "Your check-ins show a well-supported day."
    };
  }

  if (score >= 65) {
    return {
      label: "Balanced",
      description:
        "You are maintaining a steady wellness rhythm."
    };
  }

  if (score >= 40) {
    return {
      label: "Needs care",
      description:
        "A few gentle actions may support you today."
    };
  }

  return {
    label: "Beginning",
    description:
      "Start with one small and manageable check-in."
  };
}

function TrackerProgressRing({
  score = 0,
  size = 150,
  strokeWidth = 12,
  showDescription = true
}) {
  const safeScore =
    clampScore(score);

  const radius =
    (size - strokeWidth) / 2;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (safeScore / 100) *
      circumference;

  const information =
    getScoreInformation(
      safeScore
    );

  return (
    <div className="tracker-progress-ring">
      <div
        className="tracker-progress-ring__visual"
        style={{
          width: size,
          height: size
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            className="tracker-progress-ring__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={
              strokeWidth
            }
          />

          <motion.circle
            className="tracker-progress-ring__value"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={
              strokeWidth
            }
            strokeLinecap="round"
            strokeDasharray={
              circumference
            }
            initial={{
              strokeDashoffset:
                circumference
            }}
            animate={{
              strokeDashoffset:
                offset
            }}
            transition={{
              duration: 0.85,
              ease: "easeOut"
            }}
          />
        </svg>

        <span className="tracker-progress-ring__content">
          <strong>
            {safeScore}%
          </strong>

          <small>
            {information.label}
          </small>
        </span>
      </div>

      {showDescription && (
        <p>
          {
            information.description
          }
        </p>
      )}
    </div>
  );
}

export default TrackerProgressRing;