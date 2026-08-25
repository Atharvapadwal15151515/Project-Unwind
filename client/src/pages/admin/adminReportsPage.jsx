import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileText,
  Filter,
  Flag,
  LoaderCircle,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  X
} from "lucide-react";

import {
  getAdminReports
} from "../../services/admin/adminReport.service";

import "./adminReportsPage.css";


const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses"
  },
  {
    value: "pending",
    label: "Pending"
  },
  {
    value: "under_review",
    label: "Under Review"
  },
  {
    value: "resolved",
    label: "Resolved"
  }
];


const PRIORITY_OPTIONS = [
  {
    value: "",
    label: "All priorities"
  },
  {
    value: "critical",
    label: "Critical"
  },
  {
    value: "high",
    label: "High"
  },
  {
    value: "normal",
    label: "Normal"
  },
  {
    value: "low",
    label: "Low"
  }
];


const TARGET_OPTIONS = [
  {
    value: "",
    label: "All content"
  },
  {
    value: "user",
    label: "Users"
  },
  {
    value: "post",
    label: "Posts"
  },
  {
    value: "comment",
    label: "Comments"
  },
  {
    value: "chat_message",
    label: "Chat Messages"
  }
];


function AdminReportsPage() {
  const navigate =
    useNavigate();

  const [
    reports,
    setReports
  ] = useState([]);

  const [
    count,
    setCount
  ] = useState(0);

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
    search,
    setSearch
  ] = useState("");

  const [
    status,
    setStatus
  ] = useState("");

  const [
    priority,
    setPriority
  ] = useState("");

  const [
    targetType,
    setTargetType
  ] = useState("");


  const loadReports =
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
            await getAdminReports({
              status:
                status || undefined,

              priority:
                priority || undefined,

              targetType:
                targetType || undefined,

              limit: 50,
              offset: 0
            });

          setReports(
            result.reports
          );

          setCount(
            result.count
          );

        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
            "Unable to load reports."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        status,
        priority,
        targetType
      ]
    );


  useEffect(() => {
    loadReports();
  }, [loadReports]);


  const visibleReports =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return reports;
      }

      return reports.filter(
        (report) => {
          const values = [
            report.reporter_username,
            report.reported_username,
            report.reason,
            report.target_type,
            report.report_status,
            report.priority,
            report.description
          ];

          return values.some(
            (value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      reports,
      search
    ]);


  const stats =
    useMemo(() => {
      return {
        pending:
          reports.filter(
            (report) =>
              report.report_status ===
              "pending"
          ).length,

        reviewing:
          reports.filter(
            (report) =>
              report.report_status ===
              "under_review"
          ).length,

        resolved:
          reports.filter(
            (report) =>
              report.report_status ===
              "resolved"
          ).length
      };
    }, [reports]);


  const filtersActive =
    Boolean(
      status ||
      priority ||
      targetType ||
      search
    );


  function clearFilters() {
    setStatus("");
    setPriority("");
    setTargetType("");
    setSearch("");
  }


  return (
    <main className="admin-reports-page">

      <div className="admin-reports-container">

        <header className="admin-reports-header">

          <div>
            <div className="admin-reports-title-line">
              <div className="admin-reports-title-icon">
                <Flag size={21} />
              </div>

              <div>
                <h1>
                  Reports
                </h1>

                <p>
                  Review community reports
                  and moderation cases.
                </p>
              </div>
            </div>
          </div>


          <button
            type="button"
            className="admin-reports-refresh"
            onClick={() =>
              loadReports({
                silent: true
              })
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "admin-reports-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </header>


        {error && (
          <div
            className="admin-reports-error"
            role="alert"
          >
            <CircleAlert size={17} />

            <span>
              {error}
            </span>
          </div>
        )}


        <section className="admin-reports-stats">

          <ReportStat
            title="Loaded Reports"
            value={count}
            icon={Flag}
          />

          <ReportStat
            title="Pending"
            value={stats.pending}
            icon={AlertTriangle}
          />

          <ReportStat
            title="Under Review"
            value={stats.reviewing}
            icon={ShieldAlert}
          />

          <ReportStat
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
          />

        </section>


        <section className="admin-reports-toolbar">

          <div className="admin-reports-search">

            <Search size={16} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search reports or users..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

          </div>


          <div className="admin-reports-filters">

            <div className="admin-reports-filter-label">
              <Filter size={15} />
              Filters
            </div>


            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>


            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value
                )
              }
            >
              {PRIORITY_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>


            <select
              value={targetType}
              onChange={(event) =>
                setTargetType(
                  event.target.value
                )
              }
            >
              {TARGET_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>


            {filtersActive && (
              <button
                type="button"
                className="admin-reports-clear"
                onClick={
                  clearFilters
                }
              >
                <X size={14} />
                Clear
              </button>
            )}

          </div>

        </section>


        <section className="admin-reports-content">

          <div className="admin-reports-content-header">

            <div>
              <h2>
                Moderation Queue
              </h2>

              <p>
                {visibleReports.length}
                {" "}
                {visibleReports.length === 1
                  ? "report"
                  : "reports"}
                {" "}
                shown
              </p>
            </div>

          </div>


          {loading ? (
            <div className="admin-reports-state">
              <LoaderCircle
                size={28}
                className="admin-reports-spin"
              />

              <p>
                Loading reports...
              </p>
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="admin-reports-state">
              <CheckCircle2
                size={32}
              />

              <h3>
                No reports found
              </h3>

              <p>
                No reports match the
                selected filters.
              </p>

              {filtersActive && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-reports-list">

              {visibleReports.map(
                (report) => (
                  <ReportCard
                    key={
                      report.report_id
                    }
                    report={report}
                    onOpen={() =>
                      navigate(
                        `/admin/reports/${report.report_id}`
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}


function ReportCard({
  report,
  onOpen
}) {
  const TargetIcon =
    getTargetIcon(
      report.target_type
    );


  return (
    <article className="admin-report-card">

      <div className="admin-report-card-icon">
        <TargetIcon size={19} />
      </div>


      <div className="admin-report-card-main">

        <div className="admin-report-card-top">

          <div className="admin-report-card-heading">

            <div className="admin-report-card-badges">

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

              <span className="admin-report-target-badge">
                {formatLabel(
                  report.target_type
                )}
              </span>

            </div>


            <h3>
              {formatLabel(
                report.reason
              )}
            </h3>

          </div>


          <button
            type="button"
            className="admin-report-open"
            onClick={onOpen}
          >
            {report.report_status ===
            "resolved"
              ? "View"
              : "Review"}

            <ChevronRight
              size={16}
            />
          </button>

        </div>


        <div className="admin-report-users">

          <div>
            <span>
              Reported by
            </span>

            <strong>
              {report.reporter_username ||
                "Unknown user"}
            </strong>
          </div>


          <ChevronRight
            size={15}
          />


          <div>
            <span>
              Reported user
            </span>

            <strong>
              {report.reported_username ||
                "Unknown user"}
            </strong>
          </div>

        </div>


        {report.description && (
          <p className="admin-report-description">
            {report.description}
          </p>
        )}


        {report.moderation_notes && (
          <div className="admin-report-resolution">
            <ShieldAlert size={15} />

            <div>
              <span>
                Moderation notes
              </span>

              <p>
                {report.moderation_notes}
              </p>
            </div>
          </div>
        )}


        <div className="admin-report-card-footer">

          <span>
            Reported{" "}
            {formatDateTime(
              report.created_at
            )}
          </span>

          {report.reviewer_username && (
            <span>
              Reviewed by{" "}
              <strong>
                {report.reviewer_username}
              </strong>
            </span>
          )}

        </div>

      </div>

    </article>
  );
}


function ReportStat({
  title,
  value,
  icon: Icon
}) {
  return (
    <article className="admin-reports-stat">

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="admin-reports-stat-icon">
        <Icon size={18} />
      </div>

    </article>
  );
}


function StatusBadge({
  status
}) {
  return (
    <span
      className={
        `admin-report-status admin-report-status-${status}`
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
        `admin-report-priority admin-report-priority-${priority}`
      }
    >
      {formatLabel(priority)}
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


function formatLabel(
  value
) {
  if (!value) {
    return "Unknown";
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


export default AdminReportsPage;