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
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileWarning,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react";

import {
  getAdminUserById
} from "../../services/admin/adminUser.service";
import {
  warnAdminUser,
  restrictAdminUser,
  suspendAdminUser,
  banAdminUser,
  restoreAdminUser
} from "../../services/admin/adminModeration.service";

import "./AdminUserDetailsPage.css";


function AdminUserDetailsPage() {
  const navigate = useNavigate();

  const {
    userId
  } = useParams();

  const [
    data,
    setData
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
    error,
    setError
  ] = useState("");

  const [
  moderationAction,
  setModerationAction
] = useState(null);

const [
  moderationReason,
  setModerationReason
] = useState("");

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
] = useState(1440);

const [
  suspensionDuration,
  setSuspensionDuration
] = useState(1440);

const [
  customSuspensionDays,
  setCustomSuspensionDays
] = useState("");

const [
  suspensionDurationMode,
  setSuspensionDurationMode
] = useState("preset");

const [
  moderationSubmitting,
  setModerationSubmitting
] = useState(false);

const [
  moderationError,
  setModerationError
] = useState("");

const [
  moderationSuccess,
  setModerationSuccess
] = useState("");

const resolvedSuspensionMinutes =
  suspensionDurationMode === "custom"
    ? Number(customSuspensionDays) *
      24 *
      60
    : Number(suspensionDuration);

const suspensionRequiresApproval =
  moderationAction === "suspend" &&
  Number.isFinite(
    resolvedSuspensionMinutes
  ) &&
  resolvedSuspensionMinutes >
    7 * 24 * 60;


  const loadUser =
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
            await getAdminUserById(
              userId
            );

          setData(result);

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load user details."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [userId]
    );


  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleModerationAction() {
  if (!moderationAction) {
    return;
  }

  if (!moderationReason.trim()) {
    setModerationError(
      "Enter a reason for this moderation action."
    );

    return;
  }

  try {
    setModerationSubmitting(true);
    setModerationError("");
    setModerationSuccess("");

    const reason =
      moderationReason.trim();

    switch (moderationAction) {

      case "warning":
        await warnAdminUser(
          userId,
          {
            reason,
            severity:
              warningSeverity
          }
        );
        break;


      case "restriction":
        await restrictAdminUser(
          userId,
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


      case "suspend": {
  if (
    !Number.isFinite(
      resolvedSuspensionMinutes
    ) ||
    resolvedSuspensionMinutes <= 0
  ) {
    throw new Error(
      "Enter a valid suspension duration."
    );
  }

  const response =
    await suspendAdminUser(
      userId,
      {
        reason,

        durationMinutes:
          resolvedSuspensionMinutes
      }
    );

  if (
    response?.requiresApproval
  ) {
    setModerationSuccess(
      "Suspension proposal submitted for administrator approval."
    );
  } else {
    setModerationSuccess(
      "User suspended successfully."
    );
  }

  break;
}

      case "ban": {
  await banAdminUser(
    userId,
    reason
  );

  setModerationSuccess(
    "Permanent ban proposal submitted for administrator approval."
  );

  break;
}


      case "restore":
        await restoreAdminUser(
          userId,
          reason
        );
        break;


      default:
        throw new Error(
          "Unsupported moderation action."
        );
    }


    if (
  moderationAction !== "suspend" &&
  moderationAction !== "ban"
) {
  setModerationSuccess(
    "Moderation action completed successfully."
  );
}

    setModerationReason("");
    setModerationAction(null);

    await loadUser({
      silent: true
    });

  } catch (err) {
    console.error(
      "User moderation failed:",
      err
    );

    setModerationError(
      err?.response?.data?.message ||
      err?.message ||
      "Unable to complete moderation action."
    );

  } finally {
    setModerationSubmitting(false);
  }
}

  if (loading) {
    return (
      <main className="admin-user-details-page">
        <div className="admin-user-details-state">
          <LoaderCircle
            size={29}
            className="admin-user-details-spinner"
          />

          <p>
            Loading user details...
          </p>
        </div>
      </main>
    );
  }


  if (
    error &&
    !data
  ) {
    return (
      <main className="admin-user-details-page">
        <div className="admin-user-details-state">
          <ShieldAlert size={34} />

          <h2>
            Unable to load user
          </h2>

          <p>
            {error}
          </p>

          <div className="admin-user-details-state-actions">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/users"
                )
              }
            >
              <ArrowLeft size={17} />
              Users
            </button>

            <button
              type="button"
              onClick={() =>
                loadUser()
              }
            >
              <RefreshCw size={17} />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }


  const user =
    data?.user || {};

  const reports =
    data?.reports || [];

  const warnings =
    data?.warnings || [];

  const restrictions =
    data?.restrictions || [];

  const moderationActions =
    data?.moderationActions || [];


  return (
    <main className="admin-user-details-page">

      <div className="admin-user-details-container">

        <div className="admin-user-details-topbar">

          <button
            type="button"
            className="admin-user-details-back"
            onClick={() =>
              navigate(
                "/admin/users"
              )
            }
          >
            <ArrowLeft size={17} />
            Users
          </button>


          <button
            type="button"
            className="admin-user-details-refresh"
            onClick={() =>
              loadUser({
                silent: true
              })
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-user-details-refreshing"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>


        {error && (
          <div
            className="admin-user-details-error"
            role="alert"
          >
            <AlertTriangle size={17} />
            {error}
          </div>
        )}


        <section className="admin-user-details-profile">

          <div className="admin-user-details-avatar">
            {getInitial(
              user.username
            )}
          </div>


          <div className="admin-user-details-profile-main">

            <div className="admin-user-details-name-line">

              <h1>
                {user.username ||
                  "Unknown user"}
              </h1>

              {user.role === "admin" && (
                <span className="admin-user-details-admin-badge">
                  <ShieldCheck size={13} />
                  Admin
                </span>
              )}

            </div>


            <div className="admin-user-details-email">
              <Mail size={15} />

              <span>
                {user.email || "—"}
              </span>

              {user.email_verified ? (
                <span className="admin-user-details-verified">
                  <CheckCircle2 size={13} />
                  Verified
                </span>
              ) : (
                <span className="admin-user-details-not-verified">
                  <XCircle size={13} />
                  Not verified
                </span>
              )}
            </div>


            <div className="admin-user-details-badges">

              <AccountStatusBadge
                status={
                  user.account_status
                }
              />

              <span className="admin-user-details-role">
                <UserRound size={13} />
                {capitalize(
                  user.role
                )}
              </span>

            </div>

          </div>

        </section>


        <section className="admin-user-details-stats">

          <StatCard
            label="Reports"
            value={reports.length}
            icon={FileWarning}
            attention={
              reports.length > 0
            }
          />

          <StatCard
            label="Warnings"
            value={warnings.length}
            icon={AlertTriangle}
            attention={
              warnings.length > 0
            }
          />

          <StatCard
            label="Restrictions"
            value={
              restrictions.length
            }
            icon={Ban}
            attention={
              restrictions.length > 0
            }
          />

          <StatCard
            label="Moderation Actions"
            value={
              moderationActions.length
            }
            icon={Activity}
          />

        </section>


        <div className="admin-user-details-layout">

          <div className="admin-user-details-main-column">

            <DetailsSection
              title="Account Information"
              description="Basic account and security information."
              icon={UserRound}
            >
              <div className="admin-user-details-info-grid">

                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={
                    user.email ||
                    "Not available"
                  }
                />

                <InfoItem
                  icon={Shield}
                  label="Role"
                  value={
                    capitalize(
                      user.role
                    )
                  }
                />

                <InfoItem
                  icon={CheckCircle2}
                  label="Email Verification"
                  value={
                    user.email_verified
                      ? "Verified"
                      : "Not verified"
                  }
                />

                <InfoItem
                  icon={KeyRound}
                  label="Two-Factor Authentication"
                  value={
                    user.two_factor_enabled
                      ? "Enabled"
                      : "Disabled"
                  }
                />

                <InfoItem
                  icon={Clock3}
                  label="Last Login"
                  value={
                    formatDateTime(
                      user.last_login_at
                    )
                  }
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Account Created"
                  value={
                    formatDateTime(
                      user.created_at
                    )
                  }
                />

              </div>
            </DetailsSection>


            <DetailsSection
              title="Reports"
              description="Reports received for this user."
              icon={FileWarning}
              count={reports.length}
            >
              {reports.length === 0 ? (
                <EmptySection
                  icon={FileWarning}
                  title="No reports"
                  text="This user has not received any reports."
                />
              ) : (
                <div className="admin-user-details-list">
                  {reports.map(
                    (
                      report,
                      index
                    ) => (
                      <ReportItem
                        key={
                          report.report_id ||
                          index
                        }
                        report={report}
                      />
                    )
                  )}
                </div>
              )}
            </DetailsSection>


            <DetailsSection
              title="Warnings"
              description="Warnings issued to this account."
              icon={AlertTriangle}
              count={warnings.length}
            >
              {warnings.length === 0 ? (
                <EmptySection
                  icon={AlertTriangle}
                  title="No warnings"
                  text="No warnings have been issued to this user."
                />
              ) : (
                <div className="admin-user-details-list">
                  {warnings.map(
                    (
                      warning,
                      index
                    ) => (
                      <GenericModerationItem
                        key={
                          warning.warning_id ||
                          index
                        }
                        icon={
                          AlertTriangle
                        }
                        title={
                          warning.reason ||
                          warning.warning_type ||
                          "Warning"
                        }
                        description={
                          warning.message ||
                          warning.description ||
                          warning.notes ||
                          "Warning issued to user."
                        }
                        date={
                          warning.created_at
                        }
                      />
                    )
                  )}
                </div>
              )}
            </DetailsSection>


            <DetailsSection
              title="Restrictions"
              description="Current and previous restrictions."
              icon={Ban}
              count={
                restrictions.length
              }
            >
              {restrictions.length === 0 ? (
                <EmptySection
                  icon={Ban}
                  title="No restrictions"
                  text="This user currently has no restrictions."
                />
              ) : (
                <div className="admin-user-details-list">
                  {restrictions.map(
                    (
                      restriction,
                      index
                    ) => (
                      <GenericModerationItem
                        key={
                          restriction.restriction_id ||
                          index
                        }
                        icon={Ban}
                        title={
                          restriction.restriction_type ||
                          restriction.type ||
                          "Restriction"
                        }
                        description={
                          restriction.reason ||
                          restriction.notes ||
                          "Account restriction"
                        }
                        date={
                          restriction.created_at
                        }
                      />
                    )
                  )}
                </div>
              )}
            </DetailsSection>


            <DetailsSection
              title="Moderation History"
              description="Administrative actions involving this user."
              icon={Activity}
              count={
                moderationActions.length
              }
            >
              {moderationActions.length === 0 ? (
                <EmptySection
                  icon={Activity}
                  title="No moderation history"
                  text="No administrative actions have been recorded for this user."
                />
              ) : (
                <div className="admin-user-details-list">
                  {moderationActions.map(
                    (
                      action,
                      index
                    ) => (
                      <GenericModerationItem
                        key={
                          action.action_id ||
                          action.moderation_action_id ||
                          index
                        }
                        icon={Activity}
                        title={
                          formatLabel(
                            action.action_type ||
                            action.action
                          ) ||
                          "Moderation action"
                        }
                        description={
                          action.reason ||
                          action.notes ||
                          "Administrative action"
                        }
                        date={
                          action.created_at
                        }
                      />
                    )
                  )}
                </div>
              )}
            </DetailsSection>

          </div>


          <aside className="admin-user-details-sidebar">

            <section className="admin-user-details-moderation-card">

              <div className="admin-user-details-moderation-heading">
                <ShieldAlert size={20} />

                <div>
                  <h2>
                    Moderation
                  </h2>

                  <p>
                    Administrative controls
                    for this account.
                  </p>
                </div>
              </div>


              {user.role === "admin" ? (
                <div className="admin-user-details-admin-notice">
                  <ShieldCheck size={18} />

                  <p>
                    This account is an
                    administrator. User
                    moderation controls are
                    disabled here.
                  </p>
                </div>
              ) : (
               <>
  {user.account_status === "active" ? (
    <>
      <button
        type="button"
        className="admin-user-details-action admin-user-details-action-warning"
        onClick={() =>
          setModerationAction(
            "warning"
          )
        }
        disabled={
          moderationSubmitting
        }
      >
        <AlertTriangle size={17} />
        Issue Warning
      </button>

      <button
        type="button"
        className="admin-user-details-action"
        onClick={() =>
          setModerationAction(
            "restriction"
          )
        }
        disabled={
          moderationSubmitting
        }
      >
        <Ban size={17} />
        Add Restriction
      </button>

      <button
        type="button"
        className="admin-user-details-action"
        onClick={() =>
          setModerationAction(
            "suspend"
          )
        }
        disabled={
          moderationSubmitting
        }
      >
        <Clock3 size={17} />
        Suspend Account
      </button>

      <button
        type="button"
        className="admin-user-details-action admin-user-details-action-danger"
        onClick={() =>
          setModerationAction(
            "ban"
          )
        }
        disabled={
          moderationSubmitting
        }
      >
        <Ban size={17} />
        Ban Account
      </button>
    </>
  ) : (
    <button
      type="button"
      className="admin-user-details-action admin-user-details-action-restore"
      onClick={() =>
        setModerationAction(
          "restore"
        )
      }
      disabled={
        moderationSubmitting
      }
    >
      <CheckCircle2 size={17} />
      Restore Account
    </button>
  )}


  {moderationAction && (
    <div className="admin-user-details-moderation-form">

      <div className="admin-user-details-moderation-form-header">
        <strong>
          {getModerationActionLabel(
            moderationAction
          )}
        </strong>

        <button
          type="button"
          onClick={() => {
            setModerationAction(
              null
            );

            setModerationReason(
              ""
            );

            setModerationError(
              ""
            );
          }}
          disabled={
            moderationSubmitting
          }
        >
          <XCircle size={17} />
        </button>
      </div>


      <label className="admin-user-details-moderation-field">
        <span>
          Reason
        </span>

        <textarea
          value={
            moderationReason
          }
          onChange={(event) =>
            setModerationReason(
              event.target.value
            )
          }
          placeholder="Enter moderation reason..."
          rows={4}
          disabled={
            moderationSubmitting
          }
        />
      </label>


      {moderationAction ===
        "warning" && (
        <label className="admin-user-details-moderation-field">
          <span>
            Warning Severity
          </span>

          <select
            value={
              warningSeverity
            }
            onChange={(event) =>
              setWarningSeverity(
                event.target.value
              )
            }
            disabled={
              moderationSubmitting
            }
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
      )}


      {moderationAction ===
        "restriction" && (
        <>
          <label className="admin-user-details-moderation-field">
            <span>
              Restriction Type
            </span>

            <select
              value={
                restrictionType
              }
              onChange={(event) =>
                setRestrictionType(
                  event.target.value
                )
              }
              disabled={
                moderationSubmitting
              }
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


          <label className="admin-user-details-moderation-field">
            <span>
              Duration
            </span>

            <select
              value={
                restrictionDuration
              }
              onChange={(event) =>
                setRestrictionDuration(
                  Number(
                    event.target.value
                  )
                )
              }
              disabled={
                moderationSubmitting
              }
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
        </>
      )}


     {moderationAction ===
  "suspend" && (
  <>
    <label className="admin-user-details-moderation-field">
      <span>
        Suspension Duration
      </span>

      <select
        value={
          suspensionDurationMode
        }
        onChange={(event) =>
          setSuspensionDurationMode(
            event.target.value
          )
        }
        disabled={
          moderationSubmitting
        }
      >
        <option value="preset">
          Select preset
        </option>

        <option value="custom">
          Custom number of days
        </option>
      </select>
    </label>


    {suspensionDurationMode ===
      "preset" && (
      <label className="admin-user-details-moderation-field">
        <span>
          Duration
        </span>

        <select
          value={
            suspensionDuration
          }
          onChange={(event) =>
            setSuspensionDuration(
              Number(
                event.target.value
              )
            )
          }
          disabled={
            moderationSubmitting
          }
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
            1 day
          </option>

          <option value={4320}>
            3 days
          </option>

          <option value={10080}>
            7 days
          </option>

          <option value={20160}>
            14 days — approval required
          </option>

          <option value={43200}>
            30 days — approval required
          </option>

          <option value={129600}>
            90 days — approval required
          </option>

          <option value={525600}>
            1 year — approval required
          </option>
        </select>
      </label>
    )}


    {suspensionDurationMode ===
      "custom" && (
      <label className="admin-user-details-moderation-field">
        <span>
          Number of Days
        </span>

        <input
          type="number"
          min="1"
          step="1"
          value={
            customSuspensionDays
          }
          onChange={(event) =>
            setCustomSuspensionDays(
              event.target.value
            )
          }
          placeholder="Example: 21"
          disabled={
            moderationSubmitting
          }
        />
      </label>
    )}


    {suspensionRequiresApproval ? (
      <div className="admin-user-details-moderation-danger">
        <ShieldAlert size={16} />

        <p>
          Suspensions longer than
          7 days require majority
          administrator approval.
          This will create a proposal
          instead of suspending the
          account immediately.
        </p>
      </div>
    ) : (
      <div className="admin-user-details-moderation-restore">
        <Clock3 size={16} />

        <p>
          Suspensions of 7 days or
          less can be applied
          immediately by one
          administrator.
        </p>
      </div>
    )}
  </>
)}


     {moderationAction ===
  "ban" && (
  <div className="admin-user-details-moderation-danger">
    <ShieldAlert size={16} />

    <p>
      Permanent bans require
      majority administrator
      approval. The account will
      not be banned immediately.
      A voting proposal will be
      created first.
    </p>
  </div>
)}


      {moderationAction ===
        "restore" && (
        <div className="admin-user-details-moderation-restore">
          <CheckCircle2 size={16} />

          <p>
            This will restore the user's
            account to active status.
          </p>
        </div>
      )}


      {moderationError && (
        <div className="admin-user-details-moderation-error">
          {moderationError}
        </div>
      )}


      <button
        type="button"
        className={
          moderationAction === "ban"
            ? "admin-user-details-moderation-submit admin-user-details-moderation-submit-danger"
            : "admin-user-details-moderation-submit"
        }
        onClick={
          handleModerationAction
        }
        disabled={
          moderationSubmitting ||
          !moderationReason.trim()
        }
      >
        {moderationSubmitting ? (
          <>
            <LoaderCircle
              size={17}
              className="admin-user-details-spinner"
            />

            Processing...
          </>
        ) : (
         <>
  <ShieldCheck size={17} />

  {moderationAction === "ban"
    ? "Submit Ban Proposal"
    : suspensionRequiresApproval
      ? "Submit Suspension Proposal"
      : "Confirm Action"}
</>
        )}
      </button>

    </div>
  )}


  {moderationSuccess && (
    <div className="admin-user-details-moderation-success">
      <CheckCircle2 size={16} />

      <span>
        {moderationSuccess}
      </span>
    </div>
  )}
</>
              )}

            </section>


            <section className="admin-user-details-id-card">
              <span>
                User ID
              </span>

              <code>
                {user.user_id}
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
  description,
  icon: Icon,
  count,
  children
}) {
  return (
    <section className="admin-user-details-section">

      <div className="admin-user-details-section-header">

        <div className="admin-user-details-section-title">
          <div className="admin-user-details-section-icon">
            <Icon size={18} />
          </div>

          <div>
            <div className="admin-user-details-section-title-line">
              <h2>
                {title}
              </h2>

              {count !== undefined && (
                <span>
                  {count}
                </span>
              )}
            </div>

            <p>
              {description}
            </p>
          </div>
        </div>

      </div>

      <div className="admin-user-details-section-body">
        {children}
      </div>

    </section>
  );
}

function getModerationActionLabel(
  action
) {
  const labels = {
    warning:
      "Issue Warning",

    restriction:
      "Add Restriction",

    suspend:
      "Suspend Account",

    ban:
      "Ban Account",

    restore:
      "Restore Account"
  };

  return (
    labels[action] ||
    "Moderation Action"
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  attention = false
}) {
  return (
    <article
      className={
        attention
          ? "admin-user-details-stat admin-user-details-stat-attention"
          : "admin-user-details-stat"
      }
    >
      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="admin-user-details-stat-icon">
        <Icon size={19} />
      </div>
    </article>
  );
}


function InfoItem({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="admin-user-details-info-item">
      <div className="admin-user-details-info-icon">
        <Icon size={16} />
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}


function EmptySection({
  icon: Icon,
  title,
  text
}) {
  return (
    <div className="admin-user-details-empty">
      <Icon size={22} />

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}


function ReportItem({
  report
}) {
  return (
    <div className="admin-user-details-list-item">

      <div className="admin-user-details-list-icon">
        <FileWarning size={17} />
      </div>

      <div className="admin-user-details-list-content">

        <div className="admin-user-details-list-heading">
          <strong>
            {formatLabel(
              report.reason
            ) || "User report"}
          </strong>

          {report.report_status && (
            <span>
              {formatLabel(
                report.report_status
              )}
            </span>
          )}
        </div>

        <p>
          {report.description ||
            "No additional description."}
        </p>

        <small>
          {formatDateTime(
            report.created_at
          )}
        </small>

      </div>
    </div>
  );
}


function GenericModerationItem({
  icon: Icon,
  title,
  description,
  date
}) {
  return (
    <div className="admin-user-details-list-item">

      <div className="admin-user-details-list-icon">
        <Icon size={17} />
      </div>

      <div className="admin-user-details-list-content">
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

        {date && (
          <small>
            {formatDateTime(
              date
            )}
          </small>
        )}
      </div>

    </div>
  );
}


function AccountStatusBadge({
  status = "unknown"
}) {
  return (
    <span
      className={
        `admin-user-details-status admin-user-details-status-${status}`
      }
    >
      {status === "active" && (
        <CheckCircle2 size={13} />
      )}

      {status === "suspended" && (
        <Clock3 size={13} />
      )}

      {status === "banned" && (
        <Ban size={13} />
      )}

      {capitalize(status)}
    </span>
  );
}


function formatDateTime(
  value
) {
  if (!value) {
    return "Never";
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


function formatLabel(
  value
) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function capitalize(
  value
) {
  if (!value) {
    return "Unknown";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
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


export default AdminUserDetailsPage;