import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Download,
  History,
  LoaderCircle,
  RefreshCcw,
  X
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getDassHistory,
  getDassHistoryDetails,
  saveDassReportPdf
} from "../../services/dassService";

import {
  getApiErrorMessage
} from "../../services/api";

import AppLoader
  from "../../components/common/AppStates/AppLoader";

import AppSkeleton
  from "../../components/common/AppStates/AppSkeleton";

import AppEmptyState
  from "../../components/common/AppStates/AppEmptyState";

import AppErrorState
  from "../../components/common/AppStates/AppErrorState";

import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import {
  getErrorType
} from "../../utils/getErrorType";


/* =========================================================
   HELPERS
========================================================= */

function getAssessmentId(
  assessment
) {
  return (
    assessment?.assessment_id ??
    assessment?.assessmentId ??
    assessment?.id ??
    null
  );
}


function getAssessmentDate(
  assessment
) {
  return (
    assessment?.completed_at ??
    assessment?.completedAt ??
    assessment?.submitted_at ??
    assessment?.submittedAt ??
    assessment?.created_at ??
    assessment?.createdAt ??
    null
  );
}


function formatAssessmentDate(
  value
) {
  if (!value) {
    return "Date unavailable";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}


function formatAssessmentTime(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}


/* =========================================================
   RESULT HELPERS
========================================================= */

function getScore(
  result,
  category
) {
  return Number(
    result?.[
      `${category}_score`
    ] ??
    result?.[
      `${category}Score`
    ] ??
    0
  );
}


function getSeverity(
  result,
  category
) {
  return String(
    result?.[
      `${category}_level`
    ] ??
    result?.[
      `${category}Level`
    ] ??
    result?.[
      `${category}_severity`
    ] ??
    result?.[
      `${category}Severity`
    ] ??
    "Unavailable"
  );
}


function getSeverityClass(
  severity
) {
  return String(
    severity
  )
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");
}


function formatSeverity(
  severity
) {
  return String(
    severity
  )
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


/* =========================================================
   SCORE CELL
========================================================= */

function ScoreItem({
  label,
  category,
  result
}) {
  const score =
    getScore(
      result,
      category
    );

  const severity =
    getSeverity(
      result,
      category
    );

  return (
    <div className="dass-history-score">
      <div className="dass-history-score__top">
        <span>
          {label}
        </span>

        <strong>
          {score}
          <small>
            /42
          </small>
        </strong>
      </div>

      <span
        className={[
          "dass-history-severity",
          `dass-history-severity--${getSeverityClass(
            severity
          )}`
        ].join(" ")}
      >
        {formatSeverity(
          severity
        )}
      </span>
    </div>
  );
}


/* =========================================================
   HISTORY CARD
========================================================= */

function HistoryCard({
  item,
  onView,
  onDownload,
  downloadingId
}) {
  const assessment =
    item?.assessment ??
    {};

  const result =
    item?.result ??
    {};

  const assessmentId =
    getAssessmentId(
      assessment
    );

  const date =
    getAssessmentDate(
      assessment
    );

  const downloading =
    downloadingId ===
    assessmentId;

  return (
    <article className="dass-history-card">
      <div className="dass-history-card__header">
        <div className="dass-history-card__date">
          <span>
            <CalendarDays
              size={18}
            />
          </span>

          <div>
            <strong>
              {formatAssessmentDate(
                date
              )}
            </strong>

            <small>
              {formatAssessmentTime(
                date
              )}
            </small>
          </div>
        </div>

        <span className="dass-history-card__status">
          Completed
        </span>
      </div>

      <div className="dass-history-card__scores">
        <ScoreItem
          label="Depression"
          category="depression"
          result={result}
        />

        <ScoreItem
          label="Anxiety"
          category="anxiety"
          result={result}
        />

        <ScoreItem
          label="Stress"
          category="stress"
          result={result}
        />
      </div>

      <div className="dass-history-card__actions">
        <button
          type="button"
          className="dass-history-card__view"
          onClick={() =>
            onView(
              assessmentId
            )
          }
          disabled={
            !assessmentId
          }
        >
          View details

          <ChevronRight
            size={16}
          />
        </button>

        <button
          type="button"
          className="dass-history-card__download"
          onClick={() =>
            onDownload(
              assessmentId
            )
          }
          disabled={
            !assessmentId ||
            downloading
          }
        >
        {downloading ? (
  <ButtonLoader
    label="Downloading…"
  />
) : (
  <>
    <Download size={16} />
    PDF
  </>
)}
        </button>
      </div>
    </article>
  );
}


/* =========================================================
   DETAILS PANEL
========================================================= */

function DassHistoryDetails({
  data,
  onClose,
  onDownload,
  downloadingId
}) {
  if (!data) {
    return null;
  }

  const assessment =
    data.assessment ??
    {};

  const result =
    data.result ??
    {};

  const responses =
    Array.isArray(
      data.responses
    )
      ? data.responses
      : [];

  const assessmentId =
    getAssessmentId(
      assessment
    );

  const date =
    getAssessmentDate(
      assessment
    );

  return (
    <div className="dass-history-details">
      <div className="dass-history-details__top">
        <div>
          <span className="dass-eyebrow">
            <ClipboardList
              size={14}
            />
            Assessment details
          </span>

          <h2>
            {formatAssessmentDate(
              date
            )}
          </h2>

          <p>
            Review the scores and
            responses from this
            self-assessment.
          </p>
        </div>

        <button
          type="button"
          className="dass-history-details__close"
          onClick={onClose}
          aria-label="Close assessment details"
        >
          <X size={19} />
        </button>
      </div>

      <div className="dass-history-details__scores">
        <ScoreItem
          label="Depression"
          category="depression"
          result={result}
        />

        <ScoreItem
          label="Anxiety"
          category="anxiety"
          result={result}
        />

        <ScoreItem
          label="Stress"
          category="stress"
          result={result}
        />
      </div>

      <div className="dass-history-details__response-summary">
        <div>
          <span>
            Questions answered
          </span>

          <strong>
            {responses.length}
            /21
          </strong>
        </div>

        <p>
          These are your saved
          responses from this
          self-assessment.
        </p>
      </div>

      {responses.length > 0 && (
        <div className="dass-history-responses">
          <header>
            <h3>
              Your responses
            </h3>

            <span>
              {responses.length} answers
            </span>
          </header>

          <div className="dass-history-responses__list">
            {responses.map(
              (
                response,
                index
              ) => {
                const questionNumber =
                  response?.question_number ??
                  response?.questionNumber ??
                  response?.question_id ??
                  response?.questionId ??
                  index + 1;

                const answer =
                  response?.answer_value ??
                  response?.answerValue ??
                  response?.response_value ??
                  response?.responseValue ??
                  "-";

                return (
                  <div
                    className="dass-history-response"
                    key={
                      response?.response_id ??
                      response?.responseId ??
                      `${assessmentId}-${questionNumber}`
                    }
                  >
                    <span>
                      {questionNumber}
                    </span>

                    <p>
                      Question{" "}
                      {questionNumber}
                    </p>

                    <strong>
                      {answer}
                    </strong>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      <div className="dass-history-details__actions">
        <button
          type="button"
          className="dass-secondary-button"
          onClick={onClose}
        >
          <ArrowLeft
            size={16}
          />

          Back to history
        </button>

        <button
          type="button"
          className="dass-primary-button"
          onClick={() =>
            onDownload(
              assessmentId
            )
          }
          disabled={
            downloadingId ===
            assessmentId
          }
        >
          {downloadingId ===
assessmentId ? (
  <ButtonLoader
    label="Downloading…"
  />
) : (
  <>
    <Download size={17} />
    Download report
  </>
)}
        </button>
      </div>
    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function DassHistory({
  onBack
}) {
  const [
    history,
    setHistory
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

 const [
  loadError,
  setLoadError
] = useState(null);
  const [
    selectedDetails,
    setSelectedDetails
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading
  ] = useState(false);

  const [
    downloadingId,
    setDownloadingId
  ] = useState(null);


  /* =======================================================
     LOAD HISTORY
  ======================================================= */

  const loadHistory =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");
          setLoadError(null);

          const items =
            await getDassHistory();

          setHistory(
            Array.isArray(items)
              ? items
              : []
          );
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load DASS history:",
            requestError
          );

        setLoadError(
  requestError
);

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(
    () => {
      loadHistory();
    },
    [loadHistory]
  );


  /* =======================================================
     SORT NEWEST FIRST
  ======================================================= */

  const sortedHistory =
    useMemo(
      () =>
        [...history].sort(
          (
            first,
            second
          ) => {
            const firstDate =
              new Date(
                getAssessmentDate(
                  first?.assessment
                ) ??
                  0
              ).getTime();

            const secondDate =
              new Date(
                getAssessmentDate(
                  second?.assessment
                ) ??
                  0
              ).getTime();

            return (
              secondDate -
              firstDate
            );
          }
        ),
      [history]
    );


  /* =======================================================
     VIEW DETAILS
  ======================================================= */

  const handleViewDetails =
    async (
      assessmentId
    ) => {
      if (!assessmentId) {
        return;
      }

      try {
        setDetailsLoading(true);
        setError("");

        const details =
          await getDassHistoryDetails(
            assessmentId
          );

        setSelectedDetails(
          details
        );
      } catch (
        requestError
      ) {
        console.error(
          "Unable to load assessment details:",
          requestError
        );

        setError(
          getApiErrorMessage(
            requestError,
            "Unable to load this assessment."
          )
        );
      } finally {
        setDetailsLoading(false);
      }
    };


  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const handleDownload =
    async (
      assessmentId
    ) => {
      if (!assessmentId) {
        return;
      }

      try {
        setDownloadingId(
          assessmentId
        );

        setError("");

        await saveDassReportPdf(
          assessmentId
        );
      } catch (
        requestError
      ) {
        console.error(
          "Unable to download DASS report:",
          requestError
        );

        setError(
          getApiErrorMessage(
            requestError,
            "Unable to download this report."
          )
        );
      } finally {
        setDownloadingId(
          null
        );
      }
    };


  /* =======================================================
     DETAILS VIEW
  ======================================================= */

  if (selectedDetails) {
    return (
      <DassHistoryDetails
        data={selectedDetails}
        downloadingId={
          downloadingId
        }
        onClose={() =>
          setSelectedDetails(
            null
          )
        }
        onDownload={
          handleDownload
        }
      />
    );
  }


  /* =======================================================
     HISTORY PAGE
  ======================================================= */

  return (
    <section className="dass-history">
      <header className="dass-history__header">
        <div>
          <span className="dass-eyebrow">
            <History size={14} />
            Assessment history
          </span>

          <h1>
            Your previous check-ins
          </h1>

          <p>
            Review how your
            self-assessment results
            have changed over time.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            className="dass-secondary-button"
            onClick={onBack}
          >
            <ArrowLeft
              size={16}
            />

            Back
          </button>
        )}
      </header>


      {error && (
        <div className="dass-history__error">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              loadHistory
            }
          >
            <RefreshCcw
              size={15}
            />
            Retry
          </button>
        </div>
      )}


      {loading ? (
  <AppSkeleton
    variant="card"
    count={3}
    className="dass-history__skeleton"
  />
) : loadError ? (
  <AppErrorState
    type={
      getErrorType(
        loadError
      )
    }
    title="Assessment history unavailable"
    description={
      loadError?.response?.data
        ?.message ||
      "We could not load your previous assessments."
    }
    onRetry={
      loadHistory
    }
  />
) : sortedHistory.length ===
  0 ? (
  <AppEmptyState
    icon={ClipboardList}
    title="No assessments yet"
    description="Completed DASS-21 self-assessments will appear here after your first check-in."
  />
) : (
        <>
          <div className="dass-history__summary">
            <div>
              <span>
                Completed assessments
              </span>

              <strong>
                {
                  sortedHistory.length
                }
              </strong>
            </div>

            <p>
              Most recent first
            </p>
          </div>

          <div className="dass-history__list">
            {sortedHistory.map(
              (
                item,
                index
              ) => {
                const assessmentId =
                  getAssessmentId(
                    item?.assessment
                  );

                return (
                  <HistoryCard
                    key={
                      assessmentId ??
                      index
                    }
                    item={item}
                    downloadingId={
                      downloadingId
                    }
                    onView={
                      handleViewDetails
                    }
                    onDownload={
                      handleDownload
                    }
                  />
                );
              }
            )}
          </div>
        </>
      )}


     {detailsLoading && (
  <div className="dass-history-details-loader">
    <AppLoader
      message="Loading assessment…"
      size="medium"
    />
  </div>
)}
    </section>
  );
}


export default DassHistory;