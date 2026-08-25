import {
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCcw
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  addWellnessHistoryEntry
} from "../../../utils/wellnessStorage";

import "./GroundingPage.css";

const groundingSteps = [
  {
    number: 5,
    title: "Name 5 things you can see",
    description:
      "Look around slowly. Notice shapes, colors, light, or small details.",
    placeholder:
      "Something you can see..."
  },

  {
    number: 4,
    title: "Name 4 things you can touch",
    description:
      "Notice textures or objects that are already around you.",
    placeholder:
      "Something you can touch..."
  },

  {
    number: 3,
    title: "Name 3 things you can hear",
    description:
      "Pause and notice sounds nearby or farther away.",
    placeholder:
      "Something you can hear..."
  },

  {
    number: 2,
    title: "Name 2 things you can smell",
    description:
      "Notice any scent in the room, your clothes, or the air.",
    placeholder:
      "Something you can smell..."
  },

  {
    number: 1,
    title: "Name 1 thing you can taste",
    description:
      "Notice any taste currently present, even if it is very subtle.",
    placeholder:
      "Something you can taste..."
  }
];

function createInitialAnswers() {
  return groundingSteps.map(
    (step) =>
      Array.from(
        {
          length:
            step.number
        },
        () => ""
      )
  );
}

function GroundingPage() {
  const navigate =
    useNavigate();

  const [
    stepIndex,
    setStepIndex
  ] = useState(0);

  const [
    answers,
    setAnswers
  ] = useState(
    createInitialAnswers
  );

  const [
    completed,
    setCompleted
  ] = useState(false);

  const [
    reflection,
    setReflection
  ] = useState("");

  const currentStep =
    groundingSteps[
      stepIndex
    ];

  const currentAnswers =
    answers[
      stepIndex
    ];

  const progress =
    useMemo(
      () =>
        completed
          ? 100
          : Math.round(
              (
                stepIndex /
                groundingSteps.length
              ) *
                100
            ),
      [
        stepIndex,
        completed
      ]
    );

  const filledCount =
    currentAnswers.filter(
      (item) =>
        item.trim()
    ).length;

  const canContinue =
    filledCount ===
    currentStep.number;

  const updateAnswer =
    (
      answerIndex,
      value
    ) => {
      setAnswers(
        (
          current
        ) =>
          current.map(
            (
              stepAnswers,
              currentStepIndex
            ) => {
              if (
                currentStepIndex !==
                stepIndex
              ) {
                return stepAnswers;
              }

              return stepAnswers.map(
                (
                  answer,
                  currentAnswerIndex
                ) =>
                  currentAnswerIndex ===
                  answerIndex
                    ? value
                    : answer
              );
            }
          )
      );
    };

  const handleNext =
    () => {
      if (
        !canContinue
      ) {
        return;
      }

      if (
        stepIndex <
        groundingSteps.length -
          1
      ) {
        setStepIndex(
          (
            current
          ) =>
            current + 1
        );

        return;
      }

      setCompleted(true);

      addWellnessHistoryEntry({
        toolId:
          "grounding-54321",

        toolName:
          "5-4-3-2-1 Grounding",

        type:
          "grounding",

        duration:
          "3–5 min"
      });
    };

  const handleBack =
    () => {
      if (
        completed
      ) {
        setCompleted(false);
        return;
      }

      if (
        stepIndex > 0
      ) {
        setStepIndex(
          (
            current
          ) =>
            current - 1
        );

        return;
      }

      navigate(
        "/dashboard/toolkit"
      );
    };

  const restart =
    () => {
      setStepIndex(0);
      setAnswers(
        createInitialAnswers()
      );
      setReflection("");
      setCompleted(false);
    };

  return (
    <main className="grounding-page">
      <header className="grounding-header">
        <button
          type="button"
          onClick={
            handleBack
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
            5-4-3-2-1 Grounding
          </h1>
        </div>
      </header>

      <section className="grounding-progress-card">
        <div className="grounding-progress-card__top">
          <div>
            <span>
              Progress
            </span>

            <strong>
              {completed
                ? "Complete"
                : `Step ${stepIndex + 1} of ${groundingSteps.length}`}
            </strong>
          </div>

          <span>
            {progress}%
          </span>
        </div>

        <div className="grounding-progress-track">
          <div
            style={{
              width:
                `${progress}%`
            }}
          />
        </div>
      </section>

      {!completed ? (
        <section className="grounding-card">
          <span className="grounding-card__number">
            {currentStep.number}
          </span>

          <span className="grounding-card__eyebrow">
            Take a moment and
            look around you
          </span>

          <h2>
            {
              currentStep.title
            }
          </h2>

          <p>
            {
              currentStep.description
            }
          </p>

          <div className="grounding-input-list">
            {currentAnswers.map(
              (
                answer,
                index
              ) => (
                <label
                  key={
                    index
                  }
                  className={
                    answer.trim()
                      ? "grounding-input grounding-input--filled"
                      : "grounding-input"
                  }
                >
                  <span>
                    {index + 1}
                  </span>

                  <input
                    value={
                      answer
                    }
                    placeholder={
                      currentStep.placeholder
                    }
                    onChange={(
                      event
                    ) =>
                      updateAnswer(
                        index,
                        event
                          .target
                          .value
                      )
                    }
                  />

                  {answer.trim() && (
                    <Check
                      size={15}
                    />
                  )}
                </label>
              )
            )}
          </div>

          <div className="grounding-card__footer">
            <span>
              {filledCount} of{" "}
              {
                currentStep.number
              } complete
            </span>

            <button
              type="button"
              disabled={
                !canContinue
              }
              onClick={
                handleNext
              }
            >
              {stepIndex ===
              groundingSteps.length -
                1
                ? "Finish"
                : "Continue"}

              <ArrowRight
                size={16}
              />
            </button>
          </div>
        </section>
      ) : (
        <section className="grounding-complete-card">
          <div className="grounding-complete-card__icon">
            <Check
              size={27}
            />
          </div>

          <span>
            Grounding complete
          </span>

          <h2>
            You&apos;re here.
            <br />
            You&apos;re present.
          </h2>

          <p>
            Notice whether anything
            feels different now, even
            if the change is small.
          </p>

          <label className="grounding-reflection">
            <span>
              How do you feel now?
              Optional
            </span>

            <textarea
              rows={4}
              value={
                reflection
              }
              placeholder="Write anything you notice..."
              onChange={(
                event
              ) =>
                setReflection(
                  event
                    .target
                    .value
                )
              }
            />
          </label>

          <div className="grounding-complete-actions">
            <button
              type="button"
              className="grounding-secondary-button"
              onClick={
                restart
              }
            >
              <RefreshCcw
                size={16}
              />

              Repeat
            </button>

            <button
              type="button"
              className="grounding-primary-button"
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

export default GroundingPage;