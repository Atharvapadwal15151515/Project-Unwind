import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Flag,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Save,
  ShieldAlert,
  UserRound
} from "lucide-react";

import {
  getAdminReportById,
  markAdminReportUnderReview,
  resolveAdminReport
} from "../../services/admin/adminReport.service";
import {
  warnAdminUser,
  restrictAdminUser,
  suspendAdminUser,
  banAdminUser
} from "../../services/admin/adminModeration.service";

import {
  removeAdminCommunityContent
} from "../../services/admin/adminCommunity.service";
import "./AdminReportDetailsPage.css";


const RESOLUTION_ACTIONS = [
  {
    value: "no_action",
    label: "No Action Required"
  },
  {
    value: "warning",
    label: "Warning Issued"
  },
  {
    value: "content_removed",
    label: "Content Removed"
  },
  {
    value: "restriction",
    label: "User Restricted"
  },
  {
    value: "suspended",
    label: "Account Suspended"
  },
  {
    value: "banned",
    label: "Account Banned"
  }
];


function AdminReportDetailsPage() {
  const navigate = useNavigate();

  const {
    reportId
  } = useParams();

  const [
    report,
    setReport
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage
  ] = useState("");

  const [
    moderationNotes,
    setModerationNotes
  ] = useState("");

  const [
    actionTaken,
    setActionTaken
  ] = useState("no_action");

  const [
  warningSeverity,
  setWarningSeverity
] = useState("low");

const [
  restrictionType,
  setRestrictionType
] = useState(
  "community_chat_block"
);

const [
  restrictionDuration,
  setRestrictionDuration
] = useState(60);

const [
  suspensionDuration,
  setSuspensionDuration
] = useState(1440);


  const loadReport =
    useCallback(
      async ({
        silent = false
      } = {}) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getAdminReportById(
              reportId
            );

          setReport(result);

          setModerationNotes(
            result?.moderation_notes ||
            ""
          );

          if (
            result?.action_taken
          ) {
            setActionTaken(
              result.action_taken
            );
          }

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load report."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [reportId]
    );


  useEffect(() => {
    loadReport();
  }, [loadReport]);


  async function handleMarkUnderReview() {
    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      await markAdminReportUnderReview(
        reportId,
        moderationNotes.trim() ||
          undefined
      );

      setSuccessMessage(
        "Report marked as under review."
      );

      await loadReport({
        silent: true
      });

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Unable to mark report under review."
      );

    } finally {
      setSubmitting(false);
    }
  }


 async function handleResolve() {
  if (!actionTaken) {
    setError(
      "Select the moderation action taken."
    );

    return;
  }

  const reason =
    moderationNotes.trim() ||
    `Action taken for report: ${formatLabel(
      report.reason
    )}`;

  try {
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    /*
    |--------------------------------------------------------------------------
    | Perform Actual Moderation Action
    |--------------------------------------------------------------------------
    */

    switch (actionTaken) {

      /*
      | No moderation required.
      | Only resolve the report.
      */
      case "no_action":
        break;


      /*
      | Issue warning to reported user.
      */
      case "warning":
        if (!report.reported_user_id) {
          throw new Error(
            "Reported user could not be identified."
          );
        }

        await warnAdminUser(
          report.reported_user_id,
          {
            reason,
            severity:
  warningSeverity
          }
        );

        break;


      /*
      | Remove the reported content.
      */
      case "content_removed":
        if (
          ![
            "post",
            "comment",
            "chat_message"
          ].includes(
            report.target_type
          )
        ) {
          throw new Error(
            "This report does not target removable community content."
          );
        }

        if (!report.target_id) {
          throw new Error(
            "Reported content could not be identified."
          );
        }

        await removeAdminCommunityContent(
          report.target_type,
          report.target_id,
          reason
        );

        break;


      /*
      | Restrict reported user.
      |
      | Temporary defaults for now.
      | We'll replace these with admin
      | form controls next.
      */
      case "restriction":
        if (!report.reported_user_id) {
          throw new Error(
            "Reported user could not be identified."
          );
        }

        await restrictAdminUser(
          report.reported_user_id,
          {
           restrictionType,

reason,

durationMinutes:
  Number(
    restrictionDuration
  )
          }
        );

        break;


      /*
      | Suspend reported user.
      |
      | Temporary 24-hour duration.
      */
      case "suspended":
        if (!report.reported_user_id) {
          throw new Error(
            "Reported user could not be identified."
          );
        }

        await suspendAdminUser(
          report.reported_user_id,
          {
            reason,

            durationMinutes:
  Number(
    suspensionDuration
  )
          }
        );

        break;


      /*
      | Permanently ban reported user.
      */
      case "banned":
        if (!report.reported_user_id) {
          throw new Error(
            "Reported user could not be identified."
          );
        }

        await banAdminUser(
          report.reported_user_id,
          reason
        );

        break;


      default:
        throw new Error(
          "Unsupported moderation action."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Resolve Report
    |--------------------------------------------------------------------------
    |
    | This runs only after the actual
    | moderation action succeeds.
    |
    */

    await resolveAdminReport(
      reportId,
      {
        actionTaken,

        moderationNotes:
          moderationNotes.trim() ||
          undefined
      }
    );


    setSuccessMessage(
      "Moderation action completed and report resolved successfully."
    );


    await loadReport({
      silent: true
    });

  } catch (err) {
    console.error(
      "Report moderation failed:",
      err
    );

    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Unable to complete moderation action."
    );

  } finally {
    setSubmitting(false);
  }
}


  if (loading) {
    return (
      <main className="admin-report-details-page">

        <div className="admin-report-details-state">
          <LoaderCircle
            size={30}
            className="admin-report-details-spin"
          />

          <p>
            Loading report...
          </p>
        </div>

      </main>
    );
  }


  if (
    error &&
    !report
  ) {
    return (
      <main className="admin-report-details-page">

        <div className="admin-report-details-state">

          <CircleAlert size={34} />

          <h2>
            Unable to load report
          </h2>

          <p>
            {error}
          </p>

          <div className="admin-report-details-state-actions">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/reports"
                )
              }
            >
              <ArrowLeft size={16} />
              Reports
            </button>

            <button
              type="button"
              onClick={() =>
                loadReport()
              }
            >
              <RefreshCw size={16} />
              Try Again
            </button>

          </div>

        </div>

      </main>
    );
  }


  const TargetIcon =
    getTargetIcon(
      report.target_type
    );

  const isResolved =
    report.report_status ===
    "resolved";

  const isPending =
    report.report_status ===
    "pending";


  return (
    <main className="admin-report-details-page">

      <div className="admin-report-details-container">

        <div className="admin-report-details-topbar">

          <button
            type="button"
            className="admin-report-details-back"
            onClick={() =>
              navigate(
                "/admin/reports"
              )
            }
          >
            <ArrowLeft size={16} />
            Reports
          </button>


          <button
            type="button"
            className="admin-report-details-refresh"
            onClick={() =>
              loadReport({
                silent: true
              })
            }
            disabled={
              refreshing ||
              submitting
            }
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "admin-report-details-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>


        {error && (
          <div className="admin-report-details-error">
            <CircleAlert size={17} />

            <span>
              {error}
            </span>
          </div>
        )}


        {successMessage && (
          <div className="admin-report-details-success">
            <CheckCircle2 size={17} />

            <span>
              {successMessage}
            </span>
          </div>
        )}


        <header className="admin-report-details-header">

          <div className="admin-report-details-header-icon">
            <TargetIcon size={23} />
          </div>


          <div className="admin-report-details-header-main">

            <div className="admin-report-details-badges">

              <StatusBadge
                status={
                  report.report_status
                }
              />

              <PriorityBadge
                priority={
                  report.priority
                }
              />

              <span className="admin-report-details-target-badge">
                {formatLabel(
                  report.target_type
                )}
              </span>

            </div>


            <h1>
              {formatLabel(
                report.reason
              )}
            </h1>

            <p>
              Report submitted{" "}
              {formatDateTime(
                report.created_at
              )}
            </p>

          </div>

        </header>


        <div className="admin-report-details-layout">

          <div className="admin-report-details-main">

            <DetailsSection
              title="Report Information"
              icon={Flag}
            >

              <div className="admin-report-details-info-grid">

                <InfoItem
                  label="Reason"
                  value={
                    formatLabel(
                      report.reason
                    )
                  }
                />

                <InfoItem
                  label="Content Type"
                  value={
                    formatLabel(
                      report.target_type
                    )
                  }
                />

                <InfoItem
                  label="Priority"
                  value={
                    formatLabel(
                      report.priority
                    )
                  }
                />

                <InfoItem
                  label="Status"
                  value={
                    formatLabel(
                      report.report_status
                    )
                  }
                />

                <InfoItem
                  label="Reported At"
                  value={
                    formatDateTime(
                      report.created_at
                    )
                  }
                />

                <InfoItem
                  label="Last Updated"
                  value={
                    formatDateTime(
                      report.updated_at
                    )
                  }
                />

              </div>


              <div className="admin-report-details-description">

                <span>
                  Report Description
                </span>

                <p>
                  {report.description ||
                    "The reporter did not provide an additional description."}
                </p>

              </div>

            </DetailsSection>


            <DetailsSection
              title="People Involved"
              icon={UserRound}
            >

              <div className="admin-report-details-people">

                <PersonCard
                  title="Reporter"
                  username={
                    report.reporter_username
                  }
                  email={
                    report.reporter_email
                  }
                  userId={
                    report.reporter_user_id
                  }
                  onOpen={() =>
                    navigate(
                      `/admin/users/${report.reporter_user_id}`
                    )
                  }
                />


                <div className="admin-report-details-people-arrow">
                  <ChevronRight
                    size={20}
                  />
                </div>


                <PersonCard
                  title="Reported User"
                  username={
                    report.reported_username
                  }
                  email={
                    report.reported_email
                  }
                  userId={
                    report.reported_user_id
                  }
                  status={
                    report.reported_account_status
                  }
                  onOpen={() =>
                    navigate(
                      `/admin/users/${report.reported_user_id}`
                    )
                  }
                />

              </div>

            </DetailsSection>


            <DetailsSection
  title="Reported Target"
  icon={TargetIcon}
>

  <div className="admin-report-details-target">

    <div className="admin-report-details-target-icon">
      <TargetIcon size={20} />
    </div>

    <div>
      <span>
        {formatLabel(
          report.target_type
        )}
      </span>

      <code>
        {report.target_id}
      </code>
    </div>

  </div>


  {report.reported_target ? (
    <div className="admin-report-details-target-content">

      {Array.isArray(
  report.reported_target.media
) &&
  report.reported_target.media.length > 0 && (
    <div className="admin-report-details-target-media">

      {report.reported_target.media.map(
        (media) => (
          <div
            key={media.media_id}
            className="admin-report-details-target-media-item"
          >
            {media.media_type ===
            "image" ? (
              <img
                src={media.media_url}
                alt="Reported post media"
              />
            ) : (
              <video
                src={media.media_url}
                controls
                preload="metadata"
              />
            )}
          </div>
        )
      )}

    </div>
  )}

      {report.reported_target
        .author_visible_name && (
        <div className="admin-report-details-target-author">
          <UserRound size={15} />

          <span>
            {report.reported_target
              .author_visible_name}
          </span>
        </div>
      )}


      {report.reported_target
        .content && (
        <div className="admin-report-details-target-message">
          <span>
            Reported Content
          </span>

          <p>
            {
              report.reported_target
                .content
            }
          </p>
        </div>
      )}


      {report.target_type ===
        "user" && (
        <div className="admin-report-details-target-user">

          <InfoItem
            label="Username"
            value={
              report.reported_target
                .username
            }
          />

          <InfoItem
            label="Email"
            value={
              report.reported_target
                .email
            }
          />

          <InfoItem
            label="Account Status"
            value={
              formatLabel(
                report.reported_target
                  .account_status
              )
            }
          />

        </div>
      )}


      <div className="admin-report-details-target-meta">

        {report.reported_target
          .created_at && (
          <span>
            Created{" "}
            {formatDateTime(
              report.reported_target
                .created_at
            )}
          </span>
        )}

        {report.reported_target
          .is_deleted && (
          <span className="admin-report-details-target-deleted">
            Content removed
          </span>
        )}

      </div>

    </div>
  ) : (
    <p className="admin-report-details-target-note">
      The original reported content
      could not be found.
    </p>
  )}

</DetailsSection>


            <DetailsSection
              title="Review History"
              icon={Clock3}
            >

              <div className="admin-report-details-timeline">

                <TimelineItem
                  title="Report submitted"
                  date={
                    report.created_at
                  }
                  complete
                />


                <TimelineItem
                  title={
                    report.reviewed_by
                      ? `Reviewed by ${report.reviewer_username || "admin"}`
                      : "Admin review"
                  }
                  date={
                    report.reviewed_at
                  }
                  complete={
                    Boolean(
                      report.reviewed_at
                    )
                  }
                />


                <TimelineItem
                  title="Report resolved"
                  date={
                    report.resolved_at
                  }
                  complete={
                    Boolean(
                      report.resolved_at
                    )
                  }
                  last
                />

              </div>


              {report.moderation_notes && (
                <div className="admin-report-details-existing-notes">

                  <span>
                    Moderation Notes
                  </span>

                  <p>
                    {report.moderation_notes}
                  </p>

                </div>
              )}

            </DetailsSection>

          </div>


          <aside className="admin-report-details-sidebar">

            <section className="admin-report-details-moderation">

              <div className="admin-report-details-moderation-heading">

                <ShieldAlert
                  size={21}
                />

                <div>
                  <h2>
                    Moderation
                  </h2>

                  <p>
                    Review and resolve this
                    report.
                  </p>
                </div>

              </div>


              {isResolved ? (
                <ResolvedPanel
                  report={report}
                />
              ) : (
                <>

                  <label className="admin-report-details-field">

                    <span>
                      Moderation Notes
                    </span>

                    <textarea
                      value={
                        moderationNotes
                      }
                      onChange={(event) =>
                        setModerationNotes(
                          event.target.value
                        )
                      }
                      placeholder="Add notes about your review..."
                      rows={6}
                      disabled={
                        submitting
                      }
                    />

                  </label>


                  {isPending && (
                    <button
                      type="button"
                      className="admin-report-details-review-button"
                      onClick={
                        handleMarkUnderReview
                      }
                      disabled={
                        submitting
                      }
                    >
                      {submitting ? (
                        <LoaderCircle
                          size={17}
                          className="admin-report-details-spin"
                        />
                      ) : (
                        <ShieldAlert
                          size={17}
                        />
                      )}

                      Mark Under Review
                    </button>
                  )}


                  <div className="admin-report-details-divider" />


                  <label className="admin-report-details-field">

                    <span>
                      Resolution
                    </span>

                    <select
                      value={
                        actionTaken
                      }
                      onChange={(event) =>
                        setActionTaken(
                          event.target.value
                        )
                      }
                      disabled={
                        submitting
                      }
                    >
                      {RESOLUTION_ACTIONS.map(
                        (action) => (
                          <option
                            key={
                              action.value
                            }
                            value={
                              action.value
                            }
                          >
                            {action.label}
                          </option>
                        )
                      )}
                    </select>

                  </label>
                {actionTaken === "warning" && (
  <div className="admin-report-details-action-options">

    <label className="admin-report-details-field">
      <span>
        Warning Severity
      </span>

      <select
        value={warningSeverity}
        onChange={(event) =>
          setWarningSeverity(
            event.target.value
          )
        }
        disabled={submitting}
      >
        <option value="low">
          Low
        </option>

        <option value="medium">
          Medium
        </option>

        <option value="high">
          High
        </option>
      </select>
    </label>

  </div>
)}

{actionTaken === "restriction" && (
  <div className="admin-report-details-action-options">

    <label className="admin-report-details-field">
      <span>
        Restriction Type
      </span>

      <select
        value={restrictionType}
        onChange={(event) =>
          setRestrictionType(
            event.target.value
          )
        }
        disabled={submitting}
      >
        <option value="community_chat_block">
          Block Community Chat
        </option>

        <option value="community_post_block">
          Block Community Posting
        </option>

        <option value="community_mute">
          Community Mute
        </option>

        <option value="temporary_account_restriction">
          Temporary Account Restriction
        </option>

        <option value="shadow_ban">
          Restrict Community Visibility
        </option>
      </select>
    </label>


    <label className="admin-report-details-field">
      <span>
        Duration
      </span>

      <select
        value={restrictionDuration}
        onChange={(event) =>
          setRestrictionDuration(
            Number(
              event.target.value
            )
          )
        }
        disabled={submitting}
      >
        <option value={60}>
          1 hour
        </option>

        <option value={360}>
          6 hours
        </option>

        <option value={720}>
          12 hours
        </option>

        <option value={1440}>
          24 hours
        </option>

        <option value={4320}>
          3 days
        </option>

        <option value={10080}>
          7 days
        </option>
      </select>
    </label>

  </div>
)}

{actionTaken === "suspended" && (
  <div className="admin-report-details-action-options">

    <label className="admin-report-details-field">
      <span>
        Suspension Duration
      </span>

      <select
        value={suspensionDuration}
        onChange={(event) =>
          setSuspensionDuration(
            Number(
              event.target.value
            )
          )
        }
        disabled={submitting}
      >
        <option value={60}>
          1 hour
        </option>

        <option value={360}>
          6 hours
        </option>

        <option value={720}>
          12 hours
        </option>

        <option value={1440}>
          24 hours
        </option>

        <option value={4320}>
          3 days
        </option>

        <option value={10080}>
          7 days
        </option>

        <option value={43200}>
          30 days
        </option>
      </select>
    </label>

  </div>
)}

{actionTaken === "banned" && (
  <div className="admin-report-details-danger-notice">

    <Ban size={17} />

    <p>
      This permanently bans the
      reported account until an
      administrator restores it.
    </p>

  </div>
)}

{actionTaken === "content_removed" && (
  <div className="admin-report-details-action-notice">

    <ShieldAlert size={17} />

    <p>
      The reported{" "}
      {formatLabel(
        report.target_type
      ).toLowerCase()}
      {" "}
      will be removed before this
      report is resolved.
    </p>

  </div>
)}


                  <button
                    type="button"
                    className="admin-report-details-resolve-button"
                    onClick={
                      handleResolve
                    }
                    disabled={
                      submitting
                    }
                  >
                    {submitting ? (
                      <LoaderCircle
                        size={17}
                        className="admin-report-details-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )}

                    Resolve Report
                  </button>


                  <p className="admin-report-details-warning">
                    Resolving closes the
                    report and records your
                    selected moderation
                    decision.
                  </p>

                </>
              )}

            </section>


            <section className="admin-report-details-id-card">

              <span>
                Report ID
              </span>

              <code>
                {report.report_id}
              </code>

            </section>

          </aside>

        </div>

      </div>

    </main>
  );
}


function DetailsSection({
  title,
  icon: Icon,
  children
}) {
  return (
    <section className="admin-report-details-section">

      <div className="admin-report-details-section-header">

        <div className="admin-report-details-section-icon">
          <Icon size={18} />
        </div>

        <h2>
          {title}
        </h2>

      </div>


      <div className="admin-report-details-section-body">
        {children}
      </div>

    </section>
  );
}


function InfoItem({
  label,
  value
}) {
  return (
    <div className="admin-report-details-info-item">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}


function PersonCard({
  title,
  username,
  email,
  userId,
  status,
  onOpen
}) {
  return (
    <article className="admin-report-details-person">

      <div className="admin-report-details-person-avatar">
        {getInitial(username)}
      </div>


      <div className="admin-report-details-person-content">

        <span>
          {title}
        </span>

        <strong>
          {username ||
            "Unknown user"}
        </strong>

        {email && (
          <p>
            <Mail size={13} />
            {email}
          </p>
        )}

        {status && (
          <AccountStatus
            status={status}
          />
        )}

        <button
          type="button"
          onClick={onOpen}
          disabled={!userId}
        >
          View User
          <ChevronRight size={14} />
        </button>

      </div>

    </article>
  );
}


function TimelineItem({
  title,
  date,
  complete,
  last = false
}) {
  return (
    <div className="admin-report-details-timeline-item">

      <div className="admin-report-details-timeline-marker">

        <div
          className={
            complete
              ? "admin-report-details-timeline-dot admin-report-details-timeline-dot-complete"
              : "admin-report-details-timeline-dot"
          }
        >
          {complete && (
            <CheckCircle2
              size={13}
            />
          )}
        </div>


        {!last && (
          <div className="admin-report-details-timeline-line" />
        )}

      </div>


      <div className="admin-report-details-timeline-content">

        <strong>
          {title}
        </strong>

        <span>
          {date
            ? formatDateTime(date)
            : "Not yet"}
        </span>

      </div>

    </div>
  );
}


function ResolvedPanel({
  report
}) {
  return (
    <div className="admin-report-details-resolved">

      <div className="admin-report-details-resolved-icon">
        <CheckCircle2 size={25} />
      </div>

      <h3>
        Report Resolved
      </h3>

      <p>
        This moderation case has
        been closed.
      </p>


      <div className="admin-report-details-resolved-info">

        <span>
          Action Taken
        </span>

        <strong>
          {formatLabel(
            report.action_taken
          )}
        </strong>

      </div>


      <div className="admin-report-details-resolved-info">

        <span>
          Reviewed By
        </span>

        <strong>
          {report.reviewer_username ||
            "Administrator"}
        </strong>

      </div>


      <div className="admin-report-details-resolved-info">

        <span>
          Resolved At
        </span>

        <strong>
          {formatDateTime(
            report.resolved_at
          )}
        </strong>

      </div>

    </div>
  );
}


function StatusBadge({
  status
}) {
  return (
    <span
      className={
        `admin-report-details-status admin-report-details-status-${status}`
      }
    >
      {formatLabel(status)}
    </span>
  );
}


function PriorityBadge({
  priority
}) {
  return (
    <span
      className={
        `admin-report-details-priority admin-report-details-priority-${priority}`
      }
    >
      {formatLabel(priority)}
    </span>
  );
}


function AccountStatus({
  status
}) {
  return (
    <span
      className={
        `admin-report-details-account-status admin-report-details-account-status-${status}`
      }
    >
      {formatLabel(status)}
    </span>
  );
}


function getTargetIcon(
  targetType
) {
  switch (targetType) {
    case "user":
      return UserRound;

    case "post":
      return FileText;

    case "comment":
      return MessageCircle;

    case "chat_message":
      return MessagesSquare;

    default:
      return Flag;
  }
}


function getInitial(
  value
) {
  if (!value) {
    return "?";
  }

  return value
    .trim()
    .charAt(0)
    .toUpperCase();
}


function formatLabel(
  value
) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function formatDateTime(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


export default AdminReportDetailsPage;