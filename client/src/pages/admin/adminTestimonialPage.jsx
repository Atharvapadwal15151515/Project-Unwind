import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CheckCircle2,
  CircleX,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Search,
  Star,
  UserRound,
  X
} from "lucide-react";

import {
  getAdminTestimonials,
  approveAdminTestimonial,
  rejectAdminTestimonial
} from "../../services/admin/adminTestimonial.service";

import "./adminTestimonialPage.css";


function AdminTestimonialsPage() {
  const [
    testimonials,
    setTestimonials
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
    status,
    setStatus
  ] = useState("");

  const [
    busyId,
    setBusyId
  ] = useState(null);

  const [
    moderationNotes,
    setModerationNotes
  ] = useState({});


  const loadTestimonials =
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
            await getAdminTestimonials({
              status:
                status || undefined
            });

          setTestimonials(
            result.testimonials || []
          );

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load testimonials."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [status]
    );


  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);


  const visibleTestimonials =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return testimonials;
      }

      return testimonials.filter(
        (testimonial) => {
          return [
            testimonial.display_name,
            testimonial.testimonial_text,
            testimonial.status
          ]
            .some(
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
      testimonials,
      search
    ]);


  async function handleApprove(
    testimonialId
  ) {
    try {
      setBusyId(
        testimonialId
      );

      setError("");

      await approveAdminTestimonial(
        testimonialId,
        moderationNotes[
          testimonialId
        ] || ""
      );

      await loadTestimonials({
        silent: true
      });

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Unable to approve testimonial."
      );

    } finally {
      setBusyId(null);
    }
  }


  async function handleReject(
    testimonialId
  ) {
    try {
      setBusyId(
        testimonialId
      );

      setError("");

      await rejectAdminTestimonial(
        testimonialId,
        moderationNotes[
          testimonialId
        ] || ""
      );

      await loadTestimonials({
        silent: true
      });

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Unable to reject testimonial."
      );

    } finally {
      setBusyId(null);
    }
  }


  const pendingCount =
    testimonials.filter(
      (item) =>
        item.status === "pending"
    ).length;

  const approvedCount =
    testimonials.filter(
      (item) =>
        item.status === "approved"
    ).length;

  const rejectedCount =
    testimonials.filter(
      (item) =>
        item.status === "rejected"
    ).length;


  return (
    <main className="admin-testimonials-page">

      <div className="admin-testimonials-container">

        <header className="admin-testimonials-header">

          <div>
            <span className="admin-testimonials-eyebrow">
              CONTENT REVIEW
            </span>

            <h1>
              Testimonials
            </h1>

            <p>
              Review testimonials before
              they appear publicly.
            </p>
          </div>


          <button
            type="button"
            className="admin-testimonials-refresh"
            onClick={() =>
              loadTestimonials({
                silent: true
              })
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-testimonials-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </header>


        {error && (
          <div className="admin-testimonials-error">
            <CircleX size={17} />
            {error}
          </div>
        )}


        <section className="admin-testimonials-stats">

          <StatCard
            label="Total"
            value={
              testimonials.length
            }
            icon={Star}
          />

          <StatCard
            label="Pending"
            value={pendingCount}
            icon={Clock3}
          />

          <StatCard
            label="Approved"
            value={approvedCount}
            icon={CheckCircle2}
          />

          <StatCard
            label="Rejected"
            value={rejectedCount}
            icon={CircleX}
          />

        </section>


        <section className="admin-testimonials-toolbar">

          <div className="admin-testimonials-search">
            <Search size={16} />

            <input
              type="search"
              placeholder="Search testimonials..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={15} />
              </button>
            )}
          </div>


          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            <option value="">
              All statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>
          </select>

        </section>


        <section className="admin-testimonials-list">

          {loading ? (
            <div className="admin-testimonials-state">
              <LoaderCircle
                size={28}
                className="admin-testimonials-spin"
              />

              <p>
                Loading testimonials...
              </p>
            </div>
          ) : visibleTestimonials.length === 0 ? (
            <div className="admin-testimonials-state">
              <Star size={30} />

              <h3>
                No testimonials found
              </h3>

              <p>
                No testimonials match the
                current filter.
              </p>
            </div>
          ) : (
            visibleTestimonials.map(
              (testimonial) => (
                <TestimonialCard
                  key={
                    testimonial.testimonial_id
                  }
                  testimonial={
                    testimonial
                  }
                  notes={
                    moderationNotes[
                      testimonial
                        .testimonial_id
                    ] || ""
                  }
                  setNotes={(value) =>
                    setModerationNotes(
                      (current) => ({
                        ...current,

                        [testimonial
                          .testimonial_id]:
                          value
                      })
                    )
                  }
                  busy={
                    busyId ===
                    testimonial
                      .testimonial_id
                  }
                  onApprove={() =>
                    handleApprove(
                      testimonial
                        .testimonial_id
                    )
                  }
                  onReject={() =>
                    handleReject(
                      testimonial
                        .testimonial_id
                    )
                  }
                />
              )
            )
          )}

        </section>

      </div>

    </main>
  );
}


function TestimonialCard({
  testimonial,
  notes,
  setNotes,
  busy,
  onApprove,
  onReject
}) {
  const isPending =
    testimonial.status ===
    "pending";


  return (
    <article className="admin-testimonial-card">

      <div className="admin-testimonial-card-top">

        <div className="admin-testimonial-author">

          <div className="admin-testimonial-avatar">
            <UserRound size={18} />
          </div>

          <div>
            <strong>
              {testimonial.is_anonymous
                ? "Anonymous"
                : testimonial.display_name ||
                  "Unnamed"}
            </strong>

            <span>
              {testimonial.is_anonymous
                ? "Submitted anonymously"
                : "Public testimonial"}
            </span>
          </div>

        </div>


        <StatusBadge
          status={
            testimonial.status
          }
        />

      </div>


      <div className="admin-testimonial-rating">

        {Array.from(
          {
            length: 5
          }
        ).map(
          (_, index) => (
            <Star
              key={index}
              size={16}
              fill={
                index <
                Number(
                  testimonial.rating ||
                  0
                )
                  ? "currentColor"
                  : "none"
              }
            />
          )
        )}

        <span>
          {testimonial.rating ||
            "No rating"}
        </span>

      </div>


      <blockquote>
        “{testimonial.testimonial_text}”
      </blockquote>


      <div className="admin-testimonial-meta">

        <span>
          Submitted{" "}
          {formatDateTime(
            testimonial.created_at
          )}
        </span>

        {testimonial.reviewer_username && (
          <span>
            Reviewed by{" "}
            <strong>
              {
                testimonial
                  .reviewer_username
              }
            </strong>
          </span>
        )}

      </div>


      {testimonial.moderation_notes && (
        <div className="admin-testimonial-existing-notes">

          <span>
            Moderation Notes
          </span>

          <p>
            {
              testimonial
                .moderation_notes
            }
          </p>

        </div>
      )}


      {isPending && (
        <div className="admin-testimonial-review">

          <label>
            <span>
              Moderation Notes
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Optional review notes..."
              rows={3}
              disabled={busy}
            />
          </label>


          <div className="admin-testimonial-actions">

            <button
              type="button"
              className="admin-testimonial-reject"
              onClick={onReject}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle
                  size={16}
                  className="admin-testimonials-spin"
                />
              ) : (
                <CircleX size={16} />
              )}

              Reject
            </button>


            <button
              type="button"
              className="admin-testimonial-approve"
              onClick={onApprove}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle
                  size={16}
                  className="admin-testimonials-spin"
                />
              ) : (
                <CheckCircle2
                  size={16}
                />
              )}

              Approve
            </button>

          </div>

        </div>
      )}

    </article>
  );
}


function StatCard({
  label,
  value,
  icon: Icon
}) {
  return (
    <article className="admin-testimonials-stat">

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="admin-testimonials-stat-icon">
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
        `admin-testimonial-status admin-testimonial-status-${status}`
      }
    >
      {formatLabel(status)}
    </span>
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


export default AdminTestimonialsPage;