import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  getAdminUsers
} from "../../services/admin/adminUser.service";

import "./AdminUsersPage.css";


function AdminUsersPage() {
  const navigate =
    useNavigate();

  const [
    users,
    setUsers
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
    statusFilter,
    setStatusFilter
  ] = useState("all");

  const [
    roleFilter,
    setRoleFilter
  ] = useState("all");


  const loadUsers =
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
            await getAdminUsers();

          setUsers(
            result?.users || []
          );

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load users."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  const filteredUsers =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return users.filter(
          (user) => {
            const matchesSearch =
              !normalizedSearch ||
              user.username
                ?.toLowerCase()
                .includes(
                  normalizedSearch
                ) ||
              user.email
                ?.toLowerCase()
                .includes(
                  normalizedSearch
                );

            const matchesStatus =
              statusFilter === "all" ||
              user.account_status ===
                statusFilter;

            const matchesRole =
              roleFilter === "all" ||
              user.role ===
                roleFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesRole
            );
          }
        );
      },
      [
        users,
        search,
        statusFilter,
        roleFilter
      ]
    );


  const activeFilterCount =
    Number(
      statusFilter !== "all"
    ) +
    Number(
      roleFilter !== "all"
    );


  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
  }


  if (loading) {
    return (
      <main className="admin-users-page">
        <div className="admin-users-state">
          <LoaderCircle
            size={28}
            className="admin-users-spinner"
          />

          <p>
            Loading users...
          </p>
        </div>
      </main>
    );
  }


  if (
    error &&
    users.length === 0
  ) {
    return (
      <main className="admin-users-page">
        <div className="admin-users-state">
          <AlertTriangle size={32} />

          <h2>
            Unable to load users
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadUsers()
            }
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </main>
    );
  }


  return (
    <main className="admin-users-page">

      <header className="admin-users-header">
        <div>
          <span className="admin-users-eyebrow">
            USER MANAGEMENT
          </span>

          <h1>
            Users
          </h1>

          <p>
            View user accounts,
            moderation history and
            account status.
          </p>
        </div>

        <button
          type="button"
          className="admin-users-refresh"
          onClick={() =>
            loadUsers({
              silent: true
            })
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "admin-users-refreshing"
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
          className="admin-users-error"
          role="alert"
        >
          <AlertTriangle size={17} />
          {error}
        </div>
      )}


      <section className="admin-users-summary">

        <SummaryCard
          label="Total Users"
          value={users.length}
          icon={Users}
        />

        <SummaryCard
          label="Active"
          value={
            users.filter(
              (user) =>
                user.account_status ===
                "active"
            ).length
          }
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Suspended"
          value={
            users.filter(
              (user) =>
                user.account_status ===
                "suspended"
            ).length
          }
          icon={Clock3}
        />

        <SummaryCard
          label="Banned"
          value={
            users.filter(
              (user) =>
                user.account_status ===
                "banned"
            ).length
          }
          icon={Ban}
        />

        <SummaryCard
          label="Admins"
          value={
            users.filter(
              (user) =>
                user.role === "admin"
            ).length
          }
          icon={ShieldCheck}
        />

      </section>


      <section className="admin-users-panel">

        <div className="admin-users-toolbar">

          <div className="admin-users-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search username or email..."
              aria-label="Search users"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>


          <div className="admin-users-filters">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter by account status"
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="suspended">
                Suspended
              </option>

              <option value="banned">
                Banned
              </option>
            </select>


            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              aria-label="Filter by role"
            >
              <option value="all">
                All roles
              </option>

              <option value="user">
                Users
              </option>

              <option value="admin">
                Admins
              </option>
            </select>


            {(activeFilterCount > 0 ||
              search) && (
              <button
                type="button"
                className="admin-users-clear"
                onClick={
                  clearFilters
                }
              >
                <X size={15} />
                Clear
              </button>
            )}

          </div>
        </div>


        <div className="admin-users-result-info">
          <span>
            {filteredUsers.length}
            {" "}
            {filteredUsers.length === 1
              ? "user"
              : "users"}
          </span>

          {filteredUsers.length !==
            users.length && (
            <span>
              of {users.length}
            </span>
          )}
        </div>


        {filteredUsers.length === 0 ? (
          <div className="admin-users-empty">
            <UserRound size={27} />

            <h3>
              No users found
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>
          </div>
        ) : (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Reports</th>
                  <th>Warnings</th>
                  <th>Restrictions</th>
                  <th>Last Login</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(
                  (user) => (
                    <UserRow
                      key={
                        user.user_id
                      }
                      user={user}
                      onOpen={() =>
                        navigate(
                          `/admin/users/${user.user_id}`
                        )
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      </section>

    </main>
  );
}


function SummaryCard({
  label,
  value,
  icon: Icon
}) {
  return (
    <article className="admin-users-summary-card">
      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="admin-users-summary-icon">
        <Icon size={19} />
      </div>
    </article>
  );
}


function UserRow({
  user,
  onOpen
}) {
  const status =
    user.account_status ||
    "unknown";

  const lastLogin =
    formatDate(
      user.last_login_at
    );


  return (
    <tr
      className="admin-users-row"
      onClick={onOpen}
    >
      <td>
        <div className="admin-users-identity">

          <div className="admin-users-avatar">
            {getInitial(
              user.username
            )}
          </div>

          <div className="admin-users-identity-text">
            <div className="admin-users-name-line">
              <strong>
                {user.username ||
                  "Unknown user"}
              </strong>

              {user.email_verified ? (
                <CheckCircle2
                  size={14}
                  className="admin-users-verified"
                  aria-label="Email verified"
                />
              ) : (
                <span className="admin-users-unverified">
                  Unverified
                </span>
              )}
            </div>

            <span>
              {user.email}
            </span>
          </div>

        </div>
      </td>


      <td>
        <StatusBadge
          status={status}
        />
      </td>


      <td>
        <span
          className={
            user.role === "admin"
              ? "admin-users-role admin-users-role-admin"
              : "admin-users-role"
          }
        >
          {user.role === "admin" && (
            <ShieldCheck size={13} />
          )}

          {capitalize(
            user.role
          )}
        </span>
      </td>


      <td>
        <Metric
          value={
            user.reports_received
          }
          warning={
            Number(
              user.reports_received
            ) > 0
          }
        />
      </td>


      <td>
        <Metric
          value={
            user.warning_count
          }
          warning={
            Number(
              user.warning_count
            ) > 0
          }
        />
      </td>


      <td>
        <Metric
          value={
            user.active_restrictions
          }
          warning={
            Number(
              user.active_restrictions
            ) > 0
          }
        />
      </td>


      <td>
        <span className="admin-users-date">
          {lastLogin}
        </span>
      </td>


      <td>
        <button
          type="button"
          className="admin-users-open"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          aria-label={
            `View ${user.username}`
          }
        >
          <ChevronRight
            size={18}
          />
        </button>
      </td>
    </tr>
  );
}


function StatusBadge({
  status
}) {
  return (
    <span
      className={
        `admin-users-status admin-users-status-${status}`
      }
    >
      {capitalize(status)}
    </span>
  );
}


function Metric({
  value,
  warning
}) {
  const normalizedValue =
    Number(value) || 0;

  return (
    <span
      className={
        warning
          ? "admin-users-metric admin-users-metric-warning"
          : "admin-users-metric"
      }
    >
      {normalizedValue}
    </span>
  );
}


function formatDate(
  date
) {
  if (!date) {
    return "Never";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(parsedDate);
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
  username
) {
  if (!username) {
    return "?";
  }

  return username
    .trim()
    .charAt(0)
    .toUpperCase();
}


export default AdminUsersPage;