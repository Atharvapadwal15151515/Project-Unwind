import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  FileWarning,
  LoaderCircle,
  MessageSquareWarning,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users
} from "lucide-react";

import {
  getAdminDashboard
} from "../../services/admin/adminDashboard.service";

import "./adminDashboardPage.css";


function AdminDashboardPage() {
  const [
    dashboard,
    setDashboard
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


  const loadDashboard =
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

          const data =
            await getAdminDashboard();

          setDashboard(data);

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load the admin dashboard."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  if (loading) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-state">
          <LoaderCircle
            size={28}
            className="admin-dashboard-spinner"
          />

          <p>
            Loading admin dashboard...
          </p>
        </div>
      </main>
    );
  }


  if (
    error &&
    !dashboard
  ) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-state">
          <ShieldAlert size={32} />

          <h2>
            Dashboard unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadDashboard()
            }
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </main>
    );
  }


  const users =
    dashboard?.users || {};

  const reports =
    dashboard?.reports || {};

  const testimonials =
    dashboard?.testimonials || {};

  const restrictions =
    dashboard?.restrictions || {};

  const warnings =
    dashboard?.warnings || {};

  const recentActions =
    dashboard?.recentActions || [];


  return (
    <main className="admin-dashboard-page">

      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-eyebrow">
            UNWIND ADMIN
          </span>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Overview of users,
            moderation and platform
            activity.
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard-refresh"
          onClick={() =>
            loadDashboard({
              silent: true
            })
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "admin-dashboard-refreshing"
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
          className="admin-dashboard-inline-error"
          role="alert"
        >
          <AlertTriangle size={17} />
          {error}
        </div>
      )}


      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>
              Users
            </h2>

            <p>
              Current account overview.
            </p>
          </div>

          <Users size={21} />
        </div>


        <div className="admin-dashboard-grid admin-dashboard-grid-users">

          <DashboardCard
            label="Total Users"
            value={
              users.total_users ?? 0
            }
            icon={Users}
          />

          <DashboardCard
            label="Active Users"
            value={
              users.active_users ?? 0
            }
            icon={CheckCircle2}
          />

          <DashboardCard
            label="Suspended"
            value={
              users.suspended_users ?? 0
            }
            icon={Clock3}
          />

          <DashboardCard
            label="Banned"
            value={
              users.banned_users ?? 0
            }
            icon={Ban}
          />

          <DashboardCard
            label="Admins"
            value={
              users.admin_users ?? 0
            }
            icon={ShieldCheck}
          />

        </div>
      </section>


      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>
              Moderation
            </h2>

            <p>
              Reports and actions requiring
              administrator attention.
            </p>
          </div>

          <ShieldAlert size={21} />
        </div>


        <div className="admin-dashboard-grid">

          <DashboardCard
            label="Pending Reports"
            value={
              reports.pending_reports ?? 0
            }
            icon={FileWarning}
            attention={
              (reports.pending_reports ?? 0) > 0
            }
          />

          <DashboardCard
            label="Under Review"
            value={
              reports.under_review_reports ?? 0
            }
            icon={Activity}
          />

          <DashboardCard
            label="High Priority"
            value={
              reports.high_priority_reports ?? 0
            }
            icon={AlertTriangle}
            attention={
              (reports.high_priority_reports ?? 0) > 0
            }
          />

          <DashboardCard
            label="Critical"
            value={
              reports.critical_reports ?? 0
            }
            icon={ShieldAlert}
            danger={
              (reports.critical_reports ?? 0) > 0
            }
          />

          <DashboardCard
            label="Active Restrictions"
            value={
              restrictions.active_restrictions ??
              0
            }
            icon={Ban}
          />

          <DashboardCard
            label="Warnings"
            value={
              warnings.total_warnings ?? 0
            }
            icon={MessageSquareWarning}
          />

          <DashboardCard
            label="Unacknowledged"
            value={
              warnings.unacknowledged_warnings ??
              0
            }
            icon={AlertTriangle}
            attention={
              (
                warnings.unacknowledged_warnings ??
                0
              ) > 0
            }
          />

        </div>
      </section>


      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>
              Testimonials
            </h2>

            <p>
              Current testimonial review
              status.
            </p>
          </div>

          <Star size={21} />
        </div>


        <div className="admin-dashboard-grid admin-dashboard-grid-testimonials">

          <DashboardCard
            label="Pending"
            value={
              testimonials.pending_testimonials ??
              0
            }
            icon={Clock3}
          />

          <DashboardCard
            label="Approved"
            value={
              testimonials.approved_testimonials ??
              0
            }
            icon={CheckCircle2}
          />

          <DashboardCard
            label="Rejected"
            value={
              testimonials.rejected_testimonials ??
              0
            }
            icon={Ban}
          />

        </div>
      </section>


      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>
              Recent Admin Activity
            </h2>

            <p>
              Latest moderation actions
              performed by administrators.
            </p>
          </div>

          <Activity size={21} />
        </div>


        <div className="admin-dashboard-activity">

          {recentActions.length === 0 ? (
            <div className="admin-dashboard-empty">
              <div className="admin-dashboard-empty-icon">
                <Activity size={23} />
              </div>

              <h3>
                No recent activity
              </h3>

              <p>
                Recent administrative actions
                will appear here.
              </p>
            </div>
          ) : (
            recentActions.map(
              (
                action,
                index
              ) => (
                <div
                  className="admin-dashboard-action"
                  key={
                    action.audit_id ||
                    action.action_id ||
                    index
                  }
                >
                  <div className="admin-dashboard-action-icon">
                    <Activity size={17} />
                  </div>

                  <div>
                    <strong>
                      {action.action ||
                        "Admin action"}
                    </strong>

                    <span>
                      {action.reason ||
                        "Administrative action recorded"}
                    </span>
                  </div>
                </div>
              )
            )
          )}

        </div>
      </section>

    </main>
  );
}


function DashboardCard({
  label,
  value,
  icon: Icon,
  attention = false,
  danger = false
}) {
  const classNames = [
    "admin-dashboard-card",

    attention
      ? "admin-dashboard-card-attention"
      : "",

    danger
      ? "admin-dashboard-card-danger"
      : ""
  ]
    .filter(Boolean)
    .join(" ");


  return (
    <article className={classNames}>
      <div className="admin-dashboard-card-top">
        <span>
          {label}
        </span>

        <div className="admin-dashboard-card-icon">
          <Icon size={19} />
        </div>
      </div>

      <strong className="admin-dashboard-card-value">
        {value}
      </strong>
    </article>
  );
}


export default AdminDashboardPage;