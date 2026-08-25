import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";

import {
  getAdminAuditLogs
} from "../../services/admin/adminAudit.service";

import "./adminAuditLogsPage.css";


function AdminAuditLogsPage() {
  const [
    logs,
    setLogs
  ] = useState([]);

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
    actionFilter,
    setActionFilter
  ] = useState("");

  const [
    targetFilter,
    setTargetFilter
  ] = useState("");

  const [
    expandedLogId,
    setExpandedLogId
  ] = useState(null);


  const loadLogs =
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
            await getAdminAuditLogs({
              action:
                actionFilter ||
                undefined,

              targetType:
                targetFilter ||
                undefined,

              limit: 50,
              offset: 0
            });

          setLogs(
            result?.logs || []
          );

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load audit logs."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        actionFilter,
        targetFilter
      ]
    );


  useEffect(() => {
    loadLogs();
  }, [loadLogs]);


  const visibleLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return logs;
      }

      return logs.filter(
        (log) => {
          const values = [
            log.admin_username,
            log.admin_email,
            log.action,
            log.target_type,
            log.target_id,
            log.reason
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
      logs,
      search
    ]);


  const uniqueActions =
    useMemo(() => {
      return [
        ...new Set(
          logs
            .map(
              (log) =>
                log.action
            )
            .filter(Boolean)
        )
      ];
    }, [logs]);


  const uniqueTargets =
    useMemo(() => {
      return [
        ...new Set(
          logs
            .map(
              (log) =>
                log.target_type
            )
            .filter(Boolean)
        )
      ];
    }, [logs]);


  return (
    <main className="admin-audit-page">

      <div className="admin-audit-container">

        <header className="admin-audit-header">

          <div>
            <span className="admin-audit-eyebrow">
              ADMIN ACCOUNTABILITY
            </span>

            <h1>
              Audit Logs
            </h1>

            <p>
              Review administrative actions
              performed across Unwind.
            </p>
          </div>


          <button
            type="button"
            className="admin-audit-refresh"
            onClick={() =>
              loadLogs({
                silent: true
              })
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-audit-spin"
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
            className="admin-audit-error"
            role="alert"
          >
            <AlertTriangle
              size={17}
            />

            {error}
          </div>
        )}


        <section className="admin-audit-summary">

          <SummaryCard
            label="Loaded Logs"
            value={logs.length}
            icon={Activity}
          />

          <SummaryCard
            label="Administrators"
            value={
              new Set(
                logs.map(
                  (log) =>
                    log.admin_id
                )
              ).size
            }
            icon={ShieldCheck}
          />

          <SummaryCard
            label="Action Types"
            value={
              uniqueActions.length
            }
            icon={FileText}
          />

        </section>


        <section className="admin-audit-toolbar">

          <div className="admin-audit-search">

            <Search size={16} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search admin, reason, target..."
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


          <div className="admin-audit-filters">

            <select
              value={
                actionFilter
              }
              onChange={(event) =>
                setActionFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All actions
              </option>

              {uniqueActions.map(
                (action) => (
                  <option
                    key={action}
                    value={action}
                  >
                    {formatLabel(
                      action
                    )}
                  </option>
                )
              )}
            </select>


            <select
              value={
                targetFilter
              }
              onChange={(event) =>
                setTargetFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All targets
              </option>

              {uniqueTargets.map(
                (target) => (
                  <option
                    key={target}
                    value={target}
                  >
                    {formatLabel(
                      target
                    )}
                  </option>
                )
              )}
            </select>

          </div>

        </section>


        <section className="admin-audit-panel">

          <div className="admin-audit-panel-header">
            <div>
              <h2>
                Administrative Activity
              </h2>

              <p>
                {visibleLogs.length}
                {" "}
                {visibleLogs.length === 1
                  ? "record"
                  : "records"}
              </p>
            </div>
          </div>


          {loading ? (
            <div className="admin-audit-state">

              <LoaderCircle
                size={28}
                className="admin-audit-spin"
              />

              <p>
                Loading audit logs...
              </p>

            </div>
          ) : visibleLogs.length === 0 ? (
            <div className="admin-audit-state">

              <Activity size={30} />

              <h3>
                No audit logs found
              </h3>

              <p>
                Administrative actions will
                appear here.
              </p>

            </div>
          ) : (
            <div className="admin-audit-list">

              {visibleLogs.map(
                (log) => (
                  <AuditLogCard
                    key={
                      log.audit_id
                    }
                    log={log}
                    expanded={
                      expandedLogId ===
                      log.audit_id
                    }
                    onToggle={() =>
                      setExpandedLogId(
                        (
                          current
                        ) =>
                          current ===
                          log.audit_id
                            ? null
                            : log.audit_id
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


function AuditLogCard({
  log,
  expanded,
  onToggle
}) {
  return (
    <article className="admin-audit-card">

      <div className="admin-audit-card-main">

        <div className="admin-audit-card-icon">
          <Activity size={18} />
        </div>


        <div className="admin-audit-card-content">

          <div className="admin-audit-card-heading">

            <div>
              <strong>
                {formatLabel(
                  log.action
                )}
              </strong>

              <span>
                {formatLabel(
                  log.target_type
                )}
              </span>
            </div>


            <button
              type="button"
              className="admin-audit-expand"
              onClick={onToggle}
              aria-label={
                expanded
                  ? "Collapse audit log"
                  : "Expand audit log"
              }
            >
              {expanded ? (
                <ChevronUp
                  size={18}
                />
              ) : (
                <ChevronDown
                  size={18}
                />
              )}
            </button>

          </div>


          <div className="admin-audit-admin">

            <UserRound size={14} />

            <span>
              Performed by
            </span>

            <strong>
              {log.admin_username ||
                "Unknown admin"}
            </strong>

          </div>


          <p className="admin-audit-reason">
            {log.reason ||
              "No reason recorded."}
          </p>


          <div className="admin-audit-meta">

            <span>
              <Clock3 size={13} />

              {formatDateTime(
                log.created_at
              )}
            </span>

            <span>
              Target ID:
              {" "}
              <code>
                {log.target_id}
              </code>
            </span>

          </div>


          {expanded && (
            <div className="admin-audit-details">

              <AuditDetail
                label="Admin Email"
                value={
                  log.admin_email ||
                  "—"
                }
              />

              <AuditDetail
                label="Action"
                value={
                  formatLabel(
                    log.action
                  )
                }
              />

              <AuditDetail
                label="Target Type"
                value={
                  formatLabel(
                    log.target_type
                  )
                }
              />

              <AuditDetail
                label="IP Address"
                value={
                  log.ip_address ||
                  "Not recorded"
                }
              />


              <JsonBlock
                title="Previous Value"
                value={
                  log.old_value
                }
              />

              <JsonBlock
                title="New Value"
                value={
                  log.new_value
                }
              />

              <JsonBlock
                title="Metadata"
                value={
                  log.metadata
                }
              />

            </div>
          )}

        </div>

      </div>

    </article>
  );
}


function SummaryCard({
  label,
  value,
  icon: Icon
}) {
  return (
    <article className="admin-audit-summary-card">

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>


      <div className="admin-audit-summary-icon">
        <Icon size={18} />
      </div>

    </article>
  );
}


function AuditDetail({
  label,
  value
}) {
  return (
    <div className="admin-audit-detail">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function JsonBlock({
  title,
  value
}) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value ===
      "object" &&
    Object.keys(value).length === 0
  ) {
    return null;
  }


  return (
    <div className="admin-audit-json">

      <span>
        {title}
      </span>

      <pre>
        {JSON.stringify(
          value,
          null,
          2
        )}
      </pre>

    </div>
  );
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


export default AdminAuditLogsPage;