import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  FileWarning,
  Flag,
  HeartHandshake,
  LoaderCircle,
  LockKeyhole,
  MessageSquareWarning,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
  XCircle
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  getApiErrorMessage
} from "../../services/api";

import {
  getMyReport,
  getMyReports
} from "../../services/reportService";

import "./SafetyReportsPage.css";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const STATUS_FILTERS = [
  {
    value: "all",
    label: "All"
  },
  {
    value: "pending",
    label: "Pending"
  },
  {
    value: "reviewing",
    label: "Under review"
  },
  {
    value: "resolved",
    label: "Resolved"
  },
  {
    value: "rejected",
    label: "Closed"
  }
];


const STATUS_META = {
  pending: {
    label: "Pending",
    description:
      "Your report has been received and is waiting for review.",
    icon: Clock3
  },

  reviewing: {
    label: "Under review",
    description:
      "The report is currently being reviewed.",
    icon: Eye
  },

  resolved: {
    label: "Resolved",
    description:
      "The report was reviewed and action was completed.",
    icon: CheckCircle2
  },

  rejected: {
    label: "Closed",
    description:
      "The report was reviewed and no moderation action was required.",
    icon: XCircle
  }
};


const REASON_LABELS = {
  harassment:
    "Harassment or bullying",

  hate_speech:
    "Hate speech",

  spam:
    "Spam",

  sexual_content:
    "Sexual content",

  violence:
    "Violence or dangerous content",

  self_harm:
    "Self-harm related content",

  misinformation:
    "Misinformation",

  privacy_violation:
    "Privacy violation",

  impersonation:
    "Impersonation",

  scam:
    "Scam or fraud",

  inappropriate_content:
    "Inappropriate content",

  other:
    "Other concern"
};


const TARGET_LABELS = {
  post:
    "Community post",

  comment:
    "Comment",

  chat_message:
  "Chat message",

  private_room:
    "Private room",

  direct_message:
    "Direct message",

  user:
    "Community member"
};


const ACTION_LABELS = {
  no_action:
    "No action required",

  content_removed:
    "Content removed",

  user_warned:
    "User warned",

  user_suspended:
    "User suspended",

  user_banned:
    "User banned",

  room_closed:
    "Room closed",

  message_removed:
    "Message removed",

  post_removed:
    "Post removed",

  comment_removed:
    "Comment removed"
};


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatDate(
  value
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}


function formatReason(
  reason
) {
  return (
    REASON_LABELS[
      reason
    ] ||
    reason
      ?.replaceAll(
        "_",
        " "
      ) ||
    "Reported content"
  );
}


function formatTarget(
  targetType
) {
  return (
    TARGET_LABELS[
      targetType
    ] ||
    targetType
      ?.replaceAll(
        "_",
        " "
      ) ||
    "Content"
  );
}


function getReportId(
  report
) {
  return (
    report?.report_id ||
    report?.reportId ||
    report?.id ||
    null
  );
}


function ReportStatusBadge({
  status
}) {
  const meta =
    STATUS_META[
      status
    ] ||
    STATUS_META.pending;

  const Icon =
    meta.icon;

  return (
    <span
      className={`safety-report-status safety-report-status--${status || "pending"}`}
    >
      <Icon
        size={14}
      />

      {meta.label}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| Detail Modal
|--------------------------------------------------------------------------
*/

function ReportDetailModal({
  open,
  report,
  loading,
  error,
  onClose
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const oldOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
      "hidden";

    const handleKeyDown =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style
        .overflow =
        oldOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose
  ]);

  if (!open) {
    return null;
  }

  const status =
    report?.report_status ||
    "pending";

  const statusMeta =
    STATUS_META[
      status
    ] ||
    STATUS_META.pending;

  const StatusIcon =
    statusMeta.icon;

  return (
    <div
      className="safety-report-modal-layer"
      role="presentation"
    >
      <button
        type="button"
        className="safety-report-modal-backdrop"
        aria-label="Close report details"
        onClick={onClose}
      />

      <section
        className="safety-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-detail-title"
      >
        <div
          className="safety-report-modal__header"
        >
          <div>
            <span>
              <ShieldAlert
                size={17}
              />

              Safety report
            </span>

            <h2
              id="report-detail-title"
            >
              Report details
            </h2>
          </div>

          <button
            type="button"
            className="safety-report-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X
              size={19}
            />
          </button>
        </div>

        {loading ? (
          <div
            className="safety-report-modal__state"
          >
            <LoaderCircle
              size={28}
              className="safety-reports__spinner"
            />

            <p>
              Loading report…
            </p>
          </div>
        ) : error ? (
          <div
            className="safety-report-modal__state safety-report-modal__state--error"
          >
            <AlertCircle
              size={28}
            />

            <p>
              {error}
            </p>
          </div>
        ) : report ? (
          <div
            className="safety-report-modal__body"
          >
            <div
              className={`safety-report-progress safety-report-progress--${status}`}
            >
              <span>
                <StatusIcon
                  size={21}
                />
              </span>

              <div>
                <strong>
                  {
                    statusMeta.label
                  }
                </strong>

                <p>
                  {
                    statusMeta.description
                  }
                </p>
              </div>
            </div>

            <div
              className="safety-report-detail-grid"
            >
              <div>
                <span>
                  Reported item
                </span>

                <strong>
                  {formatTarget(
                    report.target_type
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Reason
                </span>

                <strong>
                  {formatReason(
                    report.reason
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Submitted
                </span>

                <strong>
                  {formatDate(
                    report.created_at
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Last updated
                </span>

                <strong>
                  {formatDate(
                    report.updated_at
                  )}
                </strong>
              </div>
            </div>

            {report.description && (
              <div
                className="safety-report-modal__section"
              >
                <span>
                  Your description
                </span>

                <p>
                  {
                    report.description
                  }
                </p>
              </div>
            )}

            {report.reported_username && (
              <div
                className="safety-report-modal__section"
              >
                <span>
                  Reported account
                </span>

                <p>
                  @
                  {
                    report.reported_username
                  }
                </p>
              </div>
            )}

            {report.action_taken && (
              <div
                className="safety-report-modal__outcome"
              >
                <BadgeCheck
                  size={21}
                />

                <div>
                  <span>
                    Review outcome
                  </span>

                  <strong>
                    {ACTION_LABELS[
                      report.action_taken
                    ] ||
                      report.action_taken
                        .replaceAll(
                          "_",
                          " "
                        )}
                  </strong>
                </div>
              </div>
            )}

            <div
              className="safety-report-modal__privacy"
            >
              <LockKeyhole
                size={17}
              />

              <p>
                Your report is
                private. Other
                community members
                cannot view your
                report history.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function SafetyReportsPage() {
  const navigate =
    useNavigate();

  const [
    reports,
    setReports
  ] = useState([]);

  const [
    statusFilter,
    setStatusFilter
  ] = useState("all");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    selectedReport,
    setSelectedReport
  ] = useState(null);

  const [
    detailOpen,
    setDetailOpen
  ] = useState(false);

  const [
    detailLoading,
    setDetailLoading
  ] = useState(false);

  const [
    detailError,
    setDetailError
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Load reports
  |--------------------------------------------------------------------------
  */

  const loadReports =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getMyReports({
              status:
                statusFilter
            });

          setReports(
            Array.isArray(
              result
            )
              ? result
              : []
          );
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load your reports."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        statusFilter
      ]
    );


  useEffect(() => {
    loadReports();
  }, [
    loadReports
  ]);


  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const statistics =
    useMemo(
      () => {
        const counts = {
          total:
            reports.length,

          pending: 0,

          reviewing: 0,

          resolved: 0,

          rejected: 0
        };

        reports.forEach(
          (report) => {
            const status =
              report
                ?.report_status;

            if (
              Object.prototype
                .hasOwnProperty
                .call(
                  counts,
                  status
                )
            ) {
              counts[
                status
              ] += 1;
            }
          }
        );

        return counts;
      },
      [
        reports
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Open report
  |--------------------------------------------------------------------------
  */

  const handleOpenReport =
    async (
      report
    ) => {
      const reportId =
        getReportId(
          report
        );

      if (!reportId) {
        return;
      }

      setSelectedReport(
        report
      );

      setDetailOpen(
        true
      );

      setDetailError(
        ""
      );

      try {
        setDetailLoading(
          true
        );

        const result =
          await getMyReport(
            reportId
          );

        setSelectedReport(
          result
        );
      } catch (
        requestError
      ) {
        setDetailError(
          getApiErrorMessage(
            requestError,
            "Unable to load this report."
          )
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };


  return (
    <>
      <main
        className="safety-reports"
      >
        {/*
        |--------------------------------------------------------------------------
        | Hero
        |--------------------------------------------------------------------------
        */}

        <section
          className="safety-reports__hero"
        >
          <div
            className="safety-reports__hero-copy"
          >
            <span
              className="safety-reports__eyebrow"
            >
              <ShieldCheck
                size={16}
              />

              Community safety
            </span>

            <h1>
              Safety & Reports
            </h1>

            <p>
              Your space should
              feel safe. Review
              reports you have
              submitted and find
              tools for handling
              unsafe community
              interactions.
            </p>

            <div
              className="safety-reports__hero-actions"
            >
              <button
                type="button"
                className="safety-reports__primary-button"
                onClick={() =>
                  navigate(
                    "/dashboard/community"
                  )
                }
              >
                <Flag
                  size={18}
                />

                Report unsafe content

                <ArrowRight
                  size={17}
                />
              </button>

              <button
                type="button"
                className="safety-reports__secondary-button"
                onClick={
                  loadReports
                }
                disabled={
                  loading
                }
              >
                <RefreshCcw
                  size={17}
                  className={
                    loading
                      ? "safety-reports__spinner"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>
          </div>

          <div
            className="safety-reports__hero-visual"
            aria-hidden="true"
          >
            <div>
              <ShieldAlert
                size={46}
              />
            </div>

            <span
              className="safety-reports__hero-orbit safety-reports__hero-orbit--one"
            >
              <HeartHandshake
                size={18}
              />
            </span>

            <span
              className="safety-reports__hero-orbit safety-reports__hero-orbit--two"
            >
              <UserRoundCheck
                size={17}
              />
            </span>
          </div>
        </section>


        {/*
        |--------------------------------------------------------------------------
        | Quick safety tools
        |--------------------------------------------------------------------------
        */}

        <section
          className="safety-reports__quick-tools"
        >
          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard/community"
              )
            }
          >
            <span>
              <MessageSquareWarning
                size={20}
              />
            </span>

            <div>
              <strong>
                Community safety
              </strong>

              <p>
                Report a post from
                its menu whenever
                something feels
                unsafe.
              </p>
            </div>

            <ArrowRight
              size={18}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard/settings/security"
              )
            }
          >
            <span>
              <LockKeyhole
                size={20}
              />
            </span>

            <div>
              <strong>
                Account security
              </strong>

              <p>
                Review password and
                active session
                protections.
              </p>
            </div>

            <ArrowRight
              size={18}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/privacy"
              )
            }
          >
            <span>
              <ShieldCheck
                size={20}
              />
            </span>

            <div>
              <strong>
                Privacy
              </strong>

              <p>
                Understand how
                UNWIND protects
                your information.
              </p>
            </div>

            <ExternalLink
              size={17}
            />
          </button>
        </section>


        {/*
        |--------------------------------------------------------------------------
        | Reports
        |--------------------------------------------------------------------------
        */}

        <section
          className="safety-reports__workspace"
        >
          <div
            className="safety-reports__workspace-header"
          >
            <div>
              <span>
                <FileWarning
                  size={17}
                />

                Report history
              </span>

              <h2>
                Your submitted reports
              </h2>

              <p>
                Only you can see
                reports submitted
                from your account.
              </p>
            </div>

            <div
              className="safety-reports__count"
            >
              <strong>
                {
                  statistics.total
                }
              </strong>

              <span>
                shown
              </span>
            </div>
          </div>


          {/*
          |--------------------------------------------------------------------------
          | Filters
          |--------------------------------------------------------------------------
          */}

          <div
            className="safety-reports__filters"
          >
            {STATUS_FILTERS.map(
              (
                filter
              ) => (
                <button
                  type="button"
                  key={
                    filter.value
                  }
                  className={
                    statusFilter ===
                    filter.value
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      filter.value
                    )
                  }
                >
                  {
                    filter.label
                  }
                </button>
              )
            )}
          </div>


          {/*
          |--------------------------------------------------------------------------
          | Content
          |--------------------------------------------------------------------------
          */}

          {loading ? (
            <div
              className="safety-reports__state"
            >
              <LoaderCircle
                size={30}
                className="safety-reports__spinner"
              />

              <h3>
                Loading your reports
              </h3>

              <p>
                Checking your
                community safety
                history…
              </p>
            </div>
          ) : error ? (
            <div
              className="safety-reports__state safety-reports__state--error"
            >
              <AlertCircle
                size={30}
              />

              <h3>
                Reports couldn't load
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={
                  loadReports
                }
              >
                Try again
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div
              className="safety-reports__state"
            >
              <div
                className="safety-reports__empty-icon"
              >
                <ShieldCheck
                  size={29}
                />
              </div>

              <h3>
                {statusFilter ===
                "all"
                  ? "No reports submitted"
                  : `No ${STATUS_META[
                      statusFilter
                    ]?.label?.toLowerCase()} reports`}
              </h3>

              <p>
                {statusFilter ===
                "all"
                  ? "Reports you submit from UNWIND Community will appear here."
                  : "There are currently no reports matching this status."}
              </p>

              {statusFilter ===
                "all" && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/dashboard/community"
                    )
                  }
                >
                  Go to Community

                  <ArrowRight
                    size={16}
                  />
                </button>
              )}
            </div>
          ) : (
            <div
              className="safety-reports__list"
            >
              {reports.map(
                (
                  report
                ) => {
                  const reportId =
                    getReportId(
                      report
                    );

                  const status =
                    report.report_status ||
                    "pending";

                  return (
                    <article
                      key={
                        reportId
                      }
                      className="safety-report-card"
                    >
                      <div
                        className="safety-report-card__icon"
                      >
                        <Flag
                          size={20}
                        />
                      </div>

                      <div
                        className="safety-report-card__content"
                      >
                        <div
                          className="safety-report-card__top"
                        >
                          <div>
                            <span>
                              {formatTarget(
                                report.target_type
                              )}
                            </span>

                            <h3>
                              {formatReason(
                                report.reason
                              )}
                            </h3>
                          </div>

                          <ReportStatusBadge
                            status={
                              status
                            }
                          />
                        </div>

                        {report.description && (
                          <p
                            className="safety-report-card__description"
                          >
                            {
                              report.description
                            }
                          </p>
                        )}

                        <div
                          className="safety-report-card__footer"
                        >
                          <span>
                            Submitted{" "}
                            {formatDate(
                              report.created_at
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenReport(
                                report
                              )
                            }
                          >
                            View details

                            <ArrowRight
                              size={15}
                            />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>


        {/*
        |--------------------------------------------------------------------------
        | Safety principles
        |--------------------------------------------------------------------------
        */}

        <section
          className="safety-reports__principles"
        >
          <div
            className="safety-reports__principles-heading"
          >
            <span>
              <Sparkles
                size={17}
              />

              Safer together
            </span>

            <h2>
              Using UNWIND safely
            </h2>

            <p>
              A few simple
              principles help keep
              community spaces
              supportive and
              respectful.
            </p>
          </div>

          <div
            className="safety-reports__principle-grid"
          >
            <article>
              <ShieldCheck
                size={22}
              />

              <h3>
                Report harmful content
              </h3>

              <p>
                Use the report option
                when a post violates
                community safety or
                makes you uncomfortable.
              </p>
            </article>

            <article>
              <LockKeyhole
                size={22}
              />

              <h3>
                Protect your privacy
              </h3>

              <p>
                Avoid sharing
                passwords, financial
                details, private
                addresses or other
                sensitive information.
              </p>
            </article>

            <article>
              <HeartHandshake
                size={22}
              />

              <h3>
                Keep conversations respectful
              </h3>

              <p>
                UNWIND is built for
                supportive conversation.
                Disagreement should never
                become harassment.
              </p>
            </article>
          </div>
        </section>
      </main>


      <ReportDetailModal
        open={detailOpen}
        report={
          selectedReport
        }
        loading={
          detailLoading
        }
        error={
          detailError
        }
        onClose={() => {
          setDetailOpen(
            false
          );

          setSelectedReport(
            null
          );

          setDetailError(
            ""
          );
        }}
      />
    </>
  );
}


export default SafetyReportsPage;