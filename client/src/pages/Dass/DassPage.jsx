import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  HeartHandshake,
  History,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X
} from "lucide-react";

import {
  saveDassReportPdf
} from "../../services/dassService";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useDassAssessment
} from "../../hooks/useDassAssessment";

import DassHistory
  from "./DassHistory";

import "./Dass.css";

const answerOptions = [
  {
    value: 0,
    number: "0",
    label:
      "Did not apply to me at all"
  },
  {
    value: 1,
    number: "1",
    label:
      "Applied to me to some degree, or some of the time"
  },
  {
    value: 2,
    number: "2",
    label:
      "Applied to me to a considerable degree, or a good part of the time"
  },
  {
    value: 3,
    number: "3",
    label:
      "Applied to me very much, or most of the time"
  }
];

function getQuestionText(question) {
  return (
    question?.question_text ||
    question?.questionText ||
    question?.text ||
    question?.statement ||
    "Question unavailable"
  );
}

function getQuestionId(question) {
  return (
    question?.question_id ||
    question?.questionId ||
    question?.id ||
    null
  );
}

function getAssessmentStatus(
  assessment
) {
  return (
    assessment?.status ||
    assessment?.assessment_status ||
    assessment?.assessmentStatus ||
    ""
  );
}

function getScoreValue(
  result,
  category
) {
  const capitalizedCategory =
    category.charAt(0).toUpperCase() +
    category.slice(1);

  return Number(
    result?.[
      `${category}_score`
    ] ??
      result?.[
        `${category}Score`
      ] ??
      result?.scores?.[
        category
      ] ??
      result?.assessment?.[
        `${category}_score`
      ] ??
      result?.assessment?.[
        `${category}Score`
      ] ??
      result?.result?.[
        `${category}_score`
      ] ??
      result?.result?.[
        `${category}Score`
      ] ??
      result?.[
        `${capitalizedCategory}Score`
      ] ??
      0
  );
}

function getSeverityValue(
  result,
  category
) {
  const directValue =
    result?.[
      `${category}_severity`
    ] ??
    result?.[
      `${category}Severity`
    ] ??
    result?.severities?.[
      category
    ] ??
    result?.assessment?.[
      `${category}_severity`
    ] ??
    result?.assessment?.[
      `${category}Severity`
    ] ??
    result?.result?.[
      `${category}_severity`
    ] ??
    result?.result?.[
      `${category}Severity`
    ];

  if (directValue) {
    return String(
      directValue
    );
  }

  const score =
    getScoreValue(
      result,
      category
    );

  return calculateSeverity(
    category,
    score
  );
}

function calculateSeverity(
  category,
  score
) {
  const thresholds = {
    depression: [
      [9, "Normal"],
      [13, "Mild"],
      [20, "Moderate"],
      [27, "Severe"],
      [Infinity, "Extremely severe"]
    ],
    anxiety: [
      [7, "Normal"],
      [9, "Mild"],
      [14, "Moderate"],
      [19, "Severe"],
      [Infinity, "Extremely severe"]
    ],
    stress: [
      [14, "Normal"],
      [18, "Mild"],
      [25, "Moderate"],
      [33, "Severe"],
      [Infinity, "Extremely severe"]
    ]
  };

  const categoryThresholds =
    thresholds[category] ||
    thresholds.stress;

  const match =
    categoryThresholds.find(
      ([maximum]) =>
        score <= maximum
    );

  return match?.[1] ||
    "Unavailable";
}

function getSeverityClass(
  severity
) {
  return String(severity)
    .toLowerCase()
    .replaceAll(" ", "-");
}

function getResultMessage(
  category,
  severity
) {
  const normalized =
    String(severity).toLowerCase();

  if (normalized === "normal") {
    return `Your ${category} score is within the normal range for this screening. Continue noticing your wellbeing and maintaining supportive routines.`;
  }

  if (normalized === "mild") {
    return `Your responses indicate mild ${category}-related experiences. Gentle self-care and monitoring how you feel may be helpful.`;
  }

  if (
    normalized === "moderate"
  ) {
    return `Your responses indicate a moderate level of ${category}-related experiences. Consider speaking with a qualified mental-health professional.`;
  }

  return `Your responses indicate a high level of ${category}-related experiences. Reaching out to a qualified mental-health professional is strongly encouraged.`;
}

function DassLoadingScreen() {
  return (
    <div className="dass-page">
      <section className="dass-loading">
        <span>
          <LoaderCircle
            size={30}
            className="dass-icon-spin"
          />
        </span>

        <h2>
          Preparing your assessment
        </h2>

        <p>
          This should only take a
          moment.
        </p>
      </section>
    </div>
  );
}

function DassPage() {
  const navigate =
    useNavigate();

  const {
  hasConsent,

  questions,
  questionsReady,
  questionCount,

  assessment,
  assessmentId,
  answers,

  currentAnswer,
  currentQuestion,
  currentQuestionIndex,
  currentQuestionNumber,

  answeredCount,
  totalQuestions,

  isFirstQuestion,
  isLastQuestion,

  result,

  loading,
  starting,
  savingAnswer,
  submitting,
  abandoning,
  error,

  initializeDass,
  acceptConsent,
  beginAssessment,
  answerQuestion,

  goToPreviousQuestion,
  goToQuestion,

  finishAssessment,
  abandonAssessment,
  resetAssessment,

  clearError
} = useDassAssessment();

  const [
    screen,
    setScreen
  ] = useState("landing");

  const [
    consentAccepted,
    setConsentAccepted
  ] = useState(false);

  const [
    selectedAnswer,
    setSelectedAnswer
  ] = useState(null);

  const [
    exitDialogOpen,
    setExitDialogOpen
  ] = useState(false);

  const assessmentStatus =
    getAssessmentStatus(
      assessment
    );

    const [
  downloadingPdf,
  setDownloadingPdf
] = useState(false);

const [
  pdfError,
  setPdfError
] = useState("");

const handleDownloadPdf =
  async () => {
    if (!assessmentId) {
      setPdfError(
        "Assessment ID is unavailable."
      );

      return;
    }

    try {
      setDownloadingPdf(true);
      setPdfError("");

      await saveDassReportPdf(
        assessmentId
      );
    } catch (downloadError) {
      console.error(
        "Unable to download DASS report:",
        downloadError
      );

      setPdfError(
        downloadError?.response?.data
          ?.message ||
          downloadError?.message ||
          "Unable to download the PDF report."
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

 useEffect(() => {
  /*
   * History is a deliberate user-selected
   * screen. Don't let an existing completed
   * assessment force the page back to results.
   */
  if (screen === "history") {
    return;
  }

  if (
    result ||
    assessmentStatus ===
      "completed"
  ) {
    setScreen("results");
    return;
  }

  if (assessmentId) {
    setScreen("assessment");
  }
}, [
  assessmentId,
  assessmentStatus,
  result,
  screen
]);

  useEffect(() => {
    if (
      Number.isInteger(
        currentAnswer
      )
    ) {
      setSelectedAnswer(
        currentAnswer
      );
    } else {
      setSelectedAnswer(null);
    }
  }, [
    currentAnswer,
    currentQuestionIndex
  ]);

  const questionProgress =
    useMemo(
      () =>
        totalQuestions > 0
          ? Math.round(
              (
                currentQuestionNumber /
                totalQuestions
              ) *
                100
            )
          : 0,
      [
        currentQuestionNumber,
        totalQuestions
      ]
    );

  const handleOpenInstructions =
    () => {
      clearError();
      setScreen("instructions");
    };

  const handleStartAssessment =
  async () => {
    if (!consentAccepted) {
      return;
    }

    if (!questionsReady) {
      clearError();

      await initializeDass();

      return;
    }

    try {
      if (!hasConsent) {
        await acceptConsent({
          consentVersion: "1.0"
        });
      }

      await beginAssessment();

      setScreen("assessment");
      } catch {
        // Hook displays error.
      }
    };

  const handleAnswerSelect =
    async (answerValue) => {
      if (
        savingAnswer ||
        submitting
      ) {
        return;
      }

      setSelectedAnswer(
        answerValue
      );

      try {
        await answerQuestion(
          answerValue,
          {
            advance: false
          }
        );
      } catch {
        setSelectedAnswer(
          Number.isInteger(
            currentAnswer
          )
            ? currentAnswer
            : null
        );
      }
    };

  const handleContinue =
    async () => {
      if (
        !Number.isInteger(
          selectedAnswer
        ) ||
        savingAnswer
      ) {
        return;
      }

      if (isLastQuestion) {
        try {
          const submittedResult =
            await finishAssessment();

          if (submittedResult) {
            setScreen("results");
          }
        } catch {
          // Hook displays error.
        }

        return;
      }

      goToQuestion(
        currentQuestionIndex + 1
      );
    };

  const handleAbandon =
    async () => {
      try {
        await abandonAssessment();

        setExitDialogOpen(false);
        setConsentAccepted(false);
        setSelectedAnswer(null);
        setScreen("landing");
      } catch {
        // Hook displays error.
      }
    };

  const handleRetake =
    () => {
      resetAssessment();
      setConsentAccepted(false);
      setSelectedAnswer(null);
      setScreen("instructions");
    };

  if (loading) {
    return <DassLoadingScreen />;
  }

  return (
    <div className="dass-page">
      {error && (
        <div
          className="dass-alert"
          role="alert"
        >
          <AlertCircle
            size={18}
          />

          <div>
            <strong>
              Something needs your
              attention
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {screen === "landing" && (
        <section className="dass-landing">
          <div className="dass-landing__content">
            <span className="dass-eyebrow">
              <ClipboardCheck
                size={15}
              />
              DASS-21 assessment
            </span>

            <h1>
              Take a moment to check
              in with yourself.
            </h1>

            <p className="dass-landing__description">
              The DASS-21 is a short
              self-report questionnaire
              designed to help you
              reflect on experiences
              related to depression,
              anxiety and stress during
              the past week.
            </p>

            <div className="dass-landing__actions">
  <button
    type="button"
    className="dass-primary-button"
    onClick={
      handleOpenInstructions
    }
  >
    Start assessment

    <ArrowRight
      size={17}
    />
  </button>

  <button
    type="button"
    className="dass-secondary-button"
    onClick={() => {
      clearError();
      setScreen("history");
    }}
  >
    <History size={17} />

    Assessment history
  </button>

  <button
    type="button"
    className="dass-secondary-button"
    onClick={() =>
      navigate(
        "/dashboard"
      )
    }
  >
    Return to dashboard
  </button>
</div>

            <div className="dass-landing__privacy">
              <LockKeyhole
                size={16}
              />

              <span>
                Your responses are
                private and connected
                only to your account.
              </span>
            </div>
          </div>

          <aside className="dass-landing__visual">
            <div className="dass-visual-card">
              <span className="dass-visual-card__icon">
                <Brain size={34} />
              </span>

              <h2>
                Three areas of
                wellbeing
              </h2>

              <div className="dass-domain-list">
                <div>
                  <span>D</span>

                  <div>
                    <strong>
                      Depression
                    </strong>

                    <small>
                      Mood, motivation and
                      interest
                    </small>
                  </div>
                </div>

                <div>
                  <span>A</span>

                  <div>
                    <strong>
                      Anxiety
                    </strong>

                    <small>
                      Fear, worry and
                      physical arousal
                    </small>
                  </div>
                </div>

                <div>
                  <span>S</span>

                  <div>
                    <strong>
                      Stress
                    </strong>

                    <small>
                      Tension, pressure and
                      difficulty relaxing
                    </small>
                  </div>
                </div>
              </div>

              <div className="dass-time-card">
                <Clock3 size={18} />

                <div>
                  <strong>
                    About 5–7 minutes
                  </strong>

                  <small>
                    21 short questions
                  </small>
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}

      {screen ===
        "instructions" && (
        <section className="dass-instructions">
          <button
            type="button"
            className="dass-back-button"
            onClick={() =>
              setScreen("landing")
            }
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="dass-instructions__card">
            <header>
              <span>
                <ShieldCheck
                  size={27}
                />
              </span>

              <div>
                <small>
                  Before you begin
                </small>

                <h1>
                  Please read this
                  carefully
                </h1>

                <p>
                  Choose the response
                  that best describes
                  how much each statement
                  applied to you during
                  the past week.
                </p>
              </div>
            </header>

            <div className="dass-instruction-grid">
              <article>
                <Clock3 size={19} />

                <h3>
                  Take your time
                </h3>

                <p>
                  There is no time limit.
                  Answer honestly rather
                  than choosing what feels
                  socially expected.
                </p>
              </article>

              <article>
                <LockKeyhole
                  size={19}
                />

                <h3>
                  Private responses
                </h3>

                <p>
                  Your answers are stored
                  securely and used to
                  generate your personal
                  result.
                </p>
              </article>

              <article>
                <HeartHandshake
                  size={19}
                />

                <h3>
                  Not a diagnosis
                </h3>

                <p>
                  This assessment is a
                  screening and
                  reflection tool. It
                  does not replace a
                  professional
                  evaluation.
                </p>
              </article>
            </div>

            <div className="dass-response-guide">
              <h2>
                Response guide
              </h2>

              <div>
                {answerOptions.map(
                  (option) => (
                    <article
                      key={
                        option.value
                      }
                    >
                      <span>
                        {option.number}
                      </span>

                      <p>
                        {option.label}
                      </p>
                    </article>
                  )
                )}
              </div>
            </div>

            <div className="dass-disclaimer">
              <TriangleAlert
                size={19}
              />

              <p>
                If you are in immediate
                danger or believe you may
                harm yourself or someone
                else, contact local
                emergency services or a
                trusted person nearby.
              </p>
            </div>

            <label className="dass-consent">
              <input
                type="checkbox"
                checked={
                  consentAccepted
                }
                onChange={(event) =>
                  setConsentAccepted(
                    event.target
                      .checked
                  )
                }
              />

              <span className="dass-consent__box">
                {consentAccepted && (
                  <Check size={15} />
                )}
              </span>

              <span>
                I understand that this
                assessment is not a
                diagnosis, and I consent
                to my responses being
                processed to generate my
                result.
              </span>
            </label>

            <button
              type="button"
              className="dass-primary-button dass-start-button"
              disabled={
                !consentAccepted ||
                starting
              }
              onClick={
                handleStartAssessment
              }
            >
              {starting ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="dass-icon-spin"
                  />
                  Starting assessment…
                </>
              ) : (
                <>
                  Begin assessment
                  <ArrowRight
                    size={17}
                  />
                </>
              )}
            </button>
          </div>
        </section>
      )}

     {screen === "assessment" && (
  <section className="dass-assessment">
    <header className="dass-assessment__topbar">
      <div>
        <span className="dass-eyebrow">
          <Brain size={14} />
          DASS-21
        </span>

        <h1>
          Your weekly check-in
        </h1>
      </div>

      <button
        type="button"
        className="dass-exit-button"
        onClick={() =>
          setExitDialogOpen(true)
        }
      >
        Save and exit
      </button>
    </header>

    {!questionsReady ? (
      <article className="dass-question-card dass-question-card--empty">
        <span className="dass-question-empty__icon">
          <AlertCircle size={26} />
        </span>

        <h2>
          Questions could not be loaded
        </h2>

        <p>
          The server returned{" "}
          {questionCount} of{" "}
          {totalQuestions} required
          questions.
        </p>

        <button
          type="button"
          className="dass-primary-button"
          onClick={initializeDass}
        >
          <RotateCcw size={17} />
          Reload questions
        </button>
      </article>
    ) : !currentQuestion ? (
      <article className="dass-question-card dass-question-card--empty">
        <LoaderCircle
          size={28}
          className="dass-icon-spin"
        />

        <h2>
          Preparing the first question
        </h2>

        <p>
          Please wait a moment.
        </p>
      </article>
    ) : (
      <>
        <div className="dass-progress-card">
          <div className="dass-progress-card__header">
            <div>
              <span>
                Question{" "}
                {currentQuestionNumber}{" "}
                of {totalQuestions}
              </span>

              <small>
                {answeredCount} answered
              </small>
            </div>

            <strong>
              {Math.round(
                (
                  currentQuestionNumber /
                  totalQuestions
                ) *
                  100
              )}
              %
            </strong>
          </div>

          <div className="dass-progress-track">
            <span
              style={{
                width: `${
                  (
                    currentQuestionNumber /
                    totalQuestions
                  ) *
                  100
                }%`
              }}
            />
          </div>

          <div className="dass-question-dots">
            {questions.map(
              (
                question,
                index
              ) => {
                const questionId =
                  getQuestionId(
                    question
                  );

                const isAnswered =
                  Boolean(
                    questionId
                  ) &&
                  Number.isInteger(
                    answers?.[
                      questionId
                    ]
                  );

                return (
                  <button
                    key={
                      questionId ||
                      index
                    }
                    type="button"
                    className={[
                      "dass-question-dot",

                      index ===
                      currentQuestionIndex
                        ? "dass-question-dot--current"
                        : "",

                      isAnswered
                        ? "dass-question-dot--answered"
                        : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      goToQuestion(
                        index
                      )
                    }
                    aria-label={`Go to question ${
                      index + 1
                    }`}
                  />
                );
              }
            )}
          </div>
        </div>

        <article className="dass-question-card">
          <header>
            <span>
              Think about the past week
            </span>

            <small>
              Select one response
            </small>
          </header>

          <h2>
            {getQuestionText(
              currentQuestion
            )}
          </h2>

          <div className="dass-answer-list">
            {answerOptions.map(
              (option) => {
                const active =
                  selectedAnswer ===
                  option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={
                      savingAnswer ||
                      submitting
                    }
                    className={
                      active
                        ? "dass-answer-option dass-answer-option--active"
                        : "dass-answer-option"
                    }
                    onClick={() =>
                      handleAnswerSelect(
                        option.value
                      )
                    }
                  >
                    <span className="dass-answer-option__number">
                      {option.number}
                    </span>

                    <span className="dass-answer-option__label">
                      {option.label}
                    </span>

                    <span className="dass-answer-option__check">
                      {active && (
                        <Check
                          size={16}
                        />
                      )}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <footer className="dass-question-card__footer">
            <button
              type="button"
              className="dass-secondary-button"
              disabled={
                isFirstQuestion ||
                savingAnswer ||
                submitting
              }
              onClick={
                goToPreviousQuestion
              }
            >
              <ArrowLeft size={17} />
              Previous
            </button>

            <div className="dass-save-status">
              {savingAnswer ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="dass-icon-spin"
                  />
                  Saving answer…
                </>
              ) : Number.isInteger(
                  selectedAnswer
                ) ? (
                <>
                  <CheckCircle2
                    size={15}
                  />
                  Answer saved
                </>
              ) : (
                "Choose one response"
              )}
            </div>

            <button
              type="button"
              className="dass-primary-button"
              disabled={
                !Number.isInteger(
                  selectedAnswer
                ) ||
                savingAnswer ||
                submitting
              }
              onClick={
                handleContinue
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="dass-icon-spin"
                  />
                  Calculating…
                </>
              ) : isLastQuestion ? (
                <>
                  View results
                  <Sparkles
                    size={17}
                  />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight
                    size={17}
                  />
                </>
              )}
            </button>
          </footer>
        </article>
      </>
    )}
  </section>
)}
{screen === "history" && (
  <DassHistory
    onBack={() => {
      clearError();
      setScreen("landing");
    }}
  />
)}
      {screen === "results" && (
        <section className="dass-results">
          <header className="dass-results__hero">
            <span>
              <CheckCircle2
                size={31}
              />
            </span>

            <small>
              Assessment completed
            </small>

            <h1>
              Your DASS-21 results
            </h1>

            <p>
              These scores describe
              patterns in your responses.
              They are not a clinical
              diagnosis.
            </p>
          </header>

          <div className="dass-result-grid">
            {[
              {
                key: "depression",
                title: "Depression",
                letter: "D"
              },
              {
                key: "anxiety",
                title: "Anxiety",
                letter: "A"
              },
              {
                key: "stress",
                title: "Stress",
                letter: "S"
              }
            ].map((domain) => {
              const score =
                getScoreValue(
                  result,
                  domain.key
                );

              const severity =
                getSeverityValue(
                  result,
                  domain.key
                );

              return (
                <article
                  key={domain.key}
                  className="dass-result-card"
                >
                  <header>
                    <span>
                      {domain.letter}
                    </span>

                    <div>
                      <small>
                        Screening score
                      </small>

                      <h2>
                        {domain.title}
                      </h2>
                    </div>
                  </header>

                  <div className="dass-result-card__score">
                    <strong>
                      {score}
                    </strong>

                    <span>
                      points
                    </span>
                  </div>

                  <span
                    className={`dass-severity dass-severity--${getSeverityClass(
                      severity
                    )}`}
                  >
                    {severity}
                  </span>

                  <p>
                    {getResultMessage(
                      domain.key,
                      severity
                    )}
                  </p>
                </article>
              );
            })}
          </div>

          <article className="dass-results__guidance">
            <span>
              <HeartHandshake
                size={24}
              />
            </span>

            <div>
              <h2>
                What should you do
                next?
              </h2>

              <p>
                Use these results as a
                starting point for
                reflection. If your
                symptoms are persistent,
                worsening or affecting
                daily life, consider
                discussing them with a
                qualified mental-health
                professional.
              </p>
            </div>
          </article>

          {pdfError && (
  <div
    className="dass-pdf-error"
    role="alert"
  >
    <AlertCircle size={16} />

    <span>
      {pdfError}
    </span>
  </div>
)}

         <div className="dass-results__actions">
  <button
    type="button"
    className="dass-secondary-button"
    onClick={() =>
      navigate("/dashboard")
    }
  >
    Return to dashboard
  </button>

  <button
    type="button"
    className="dass-secondary-button"
    onClick={() => {
      clearError();
      setScreen("history");
    }}
  >
    <History size={17} />

    View history
  </button>

  <button
    type="button"
    className="dass-secondary-button"
    disabled={
      downloadingPdf ||
      !assessmentId
    }
    onClick={
      handleDownloadPdf
    }
  >
    {downloadingPdf ? (
      <>
        <LoaderCircle
          size={17}
          className="dass-icon-spin"
        />

        Preparing PDF...
      </>
    ) : (
      <>
        <Download size={17} />

        Download PDF
      </>
    )}
  </button>

  <button
    type="button"
    className="dass-primary-button"
    onClick={
      handleRetake
    }
  >
    <RotateCcw size={17} />

    Take again
  </button>
</div>
        </section>
      )}

      {exitDialogOpen && (
        <div className="dass-dialog">
          <button
            type="button"
            className="dass-dialog__backdrop"
            onClick={() =>
              setExitDialogOpen(false)
            }
            aria-label="Close dialog"
          />

          <section
            className="dass-dialog__card"
            role="dialog"
            aria-modal="true"
          >
            <span>
              <TriangleAlert
                size={25}
              />
            </span>

            <h2>
              Leave this assessment?
            </h2>

            <p>
              Choosing “Abandon
              assessment” will discard
              this attempt. You can also
              stay and continue from
              where you are.
            </p>

            <div>
              <button
                type="button"
                className="dass-secondary-button"
                onClick={() =>
                  setExitDialogOpen(
                    false
                  )
                }
              >
                Continue assessment
              </button>

              <button
                type="button"
                className="dass-danger-button"
                disabled={
                  abandoning
                }
                onClick={
                  handleAbandon
                }
              >
                {abandoning ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="dass-icon-spin"
                    />
                    Leaving…
                  </>
                ) : (
                  "Abandon assessment"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DassPage;