import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock3,
  Eye,
  FileBarChart,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Users
} from "lucide-react";

import {
  getAdminAnalyticsOverview
} from "../../services/admin/adminAnalytics.service";

import "./AdminAnalyticsPage.css";


const NUMBER_FORMATTER =
  new Intl.NumberFormat("en-IN");


function formatNumber(value) {
  const numericValue =
    Number(value);

  return NUMBER_FORMATTER.format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  );
}
function formatDuration(
  totalSeconds
) {
  const seconds =
    Number(totalSeconds) || 0;

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60
    );

  const remainingSeconds =
    Math.round(
      seconds % 60
    );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(new Date(value));
}


function createSevenDaySeries(rows = []) {
  const valuesByDate =
    new Map(
      rows.map((row) => [
        String(row.date).slice(0, 10),
        {
          pageviews:
            Number(row.pageviews) || 0,

          visitors:
            Number(row.visitors) || 0
        }
      ])
    );

  return Array.from(
    {
      length: 7
    },
    (_, index) => {
      const date =
        new Date();

      date.setUTCDate(
        date.getUTCDate() -
        (6 - index)
      );

      const key =
        date
          .toISOString()
          .slice(0, 10);

      const values =
        valuesByDate.get(key) || {
          pageviews: 0,
          visitors: 0
        };

      return {
        date: key,

        label:
          new Intl.DateTimeFormat(
            "en-IN",
            {
              weekday: "short"
            }
          ).format(date),

        ...values
      };
    }
  );
}


function AdminAnalyticsPage() {
  const [
    analytics,
    setAnalytics
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


  const loadAnalytics =
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
            await getAdminAnalyticsOverview();

          setAnalytics(data);

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load product analytics."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);


  const chartData =
    useMemo(
      () =>
        createSevenDaySeries(
          analytics?.daily
        ),
      [analytics?.daily]
    );


  if (loading) {
    return (
      <main className="admin-analytics-page">
        <div className="admin-analytics-state">
          <LoaderCircle
            size={28}
            className="admin-analytics-spinner"
          />

          <p>
            Loading product analytics...
          </p>
        </div>
      </main>
    );
  }


  if (
    error &&
    !analytics
  ) {
    return (
      <main className="admin-analytics-page">
        <div className="admin-analytics-state">
          <ShieldAlert size={32} />

          <h2>
            Analytics unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadAnalytics()
            }
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </main>
    );
  }


  const totals =
    analytics?.totals || {};

    const sessions =
  analytics?.sessions || {};

  const topPages =
    analytics?.topPages || [];

  const pageviews =
    Number(totals.pageviews) || 0;

  const visitors =
    Number(
      totals.unique_visitors
    ) || 0;


const totalSessions =
  Number(
    sessions.total_sessions
  ) || 0;

const averageDuration =
  Number(
    sessions.average_duration_seconds
  ) || 0;

const pagesPerSession =
  Number(
    sessions.pages_per_session
  ) || 0;
  const highestPageviews =
    Math.max(
      1,
      ...topPages.map(
        (page) =>
          Number(page.pageviews) || 0
      )
    );


  return (
    <main className="admin-analytics-page">

      <header className="admin-analytics-header">
        <div>
          <span className="admin-analytics-eyebrow">
            PRODUCT INTELLIGENCE
          </span>

          <h1>
            Platform Analytics
          </h1>

          <p>
            A privacy-conscious view of how
            people move through Unwind.
          </p>
        </div>

        <button
          type="button"
          className="admin-analytics-refresh"
          onClick={() =>
            loadAnalytics({
              silent: true
            })
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "admin-analytics-refreshing"
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
          className="admin-analytics-inline-error"
          role="alert"
        >
          <ShieldAlert size={17} />
          {error}
        </div>
      )}


      <section className="admin-analytics-summary">
  <AnalyticsCard
    label="Page views"
    value={
      formatNumber(pageviews)
    }
    caption="Last 30 days"
    icon={Eye}
  />

  <AnalyticsCard
    label="Unique visitors"
    value={
      formatNumber(visitors)
    }
    caption="Last 30 days"
    icon={Users}
  />

  <AnalyticsCard
    label="Total sessions"
    value={
      formatNumber(
        totalSessions
      )
    }
    caption="Individual visits"
    icon={Activity}
  />

  <AnalyticsCard
    label="Average duration"
    value={
      formatDuration(
        averageDuration
      )
    }
    caption="Time spent per session"
    icon={Clock3}
  />

  <AnalyticsCard
    label="Pages per session"
    value={
      pagesPerSession.toFixed(1)
    }
    caption="Average browsing depth"
    icon={FileBarChart}
  />

  <AnalyticsCard
    label="Routes tracked"
    value={
      formatNumber(
        topPages.length
      )
    }
    caption="Popular routes shown"
    icon={BarChart3}
  />
</section>


      <section className="admin-analytics-panels">

        <article className="admin-analytics-panel admin-analytics-traffic">
          <div className="admin-analytics-panel-heading">
            <div>
              <span>
                LAST 7 DAYS
              </span>

              <h2>
                Traffic overview
              </h2>

              <p>
                Daily page views and
                unique visitors.
              </p>
            </div>

            <div className="admin-analytics-legend">
              <span>
                <i className="admin-analytics-dot-pageviews" />
                Page views
              </span>

              <span>
                <i className="admin-analytics-dot-visitors" />
                Visitors
              </span>
            </div>
          </div>

          <TrafficChart
            data={chartData}
          />
        </article>


        <article className="admin-analytics-panel admin-analytics-context">
          <div className="admin-analytics-context-icon">
            <CalendarDays size={22} />
          </div>

          <span>
            REPORTING WINDOW
          </span>

          <strong>
            Last {
              analytics?.periodDays ||
              30
            } days
          </strong>

          <p>
            Updated {
              formatDate(
                analytics?.generatedAt
              )
            }
          </p>

          <div className="admin-analytics-cache-note">
            <span
              className={
                analytics?.cached
                  ? "admin-analytics-cache-dot admin-analytics-cache-dot-cached"
                  : "admin-analytics-cache-dot"
              }
            />

            {analytics?.cached
              ? "Served from secure cache"
              : "Synced with PostHog"}
          </div>
        </article>

      </section>


      <section className="admin-analytics-panel admin-analytics-pages">
        <div className="admin-analytics-panel-heading">
          <div>
            <span>
              CONTENT DISCOVERY
            </span>

            <h2>
              Most visited pages
            </h2>

            <p>
              Routes ranked by page views
              during the reporting window.
            </p>
          </div>

          <BarChart3 size={22} />
        </div>

        {topPages.length === 0 ? (
          <div className="admin-analytics-empty">
            <BarChart3 size={25} />

            <strong>
              No page data yet
            </strong>

            <p>
              Page activity will appear after
              PostHog receives events.
            </p>
          </div>
        ) : (
          <div className="admin-analytics-table-wrap">
            <table className="admin-analytics-table">
              <thead>
                <tr>
                  <th>
                    Page
                  </th>

                  <th>
                    Popularity
                  </th>

                  <th>
                    Visitors
                  </th>

                  <th>
                    Views
                  </th>
                </tr>
              </thead>

              <tbody>
                {topPages.map(
                  (page, index) => {
                    const currentPageviews =
                      Number(
                        page.pageviews
                      ) || 0;

                    const popularity =
                      (
                        currentPageviews /
                        highestPageviews
                      ) * 100;

                    return (
                      <tr
                        key={
                          page.path ||
                          index
                        }
                      >
                        <td>
                          <div className="admin-analytics-page-name">
                            <span>
                              {index + 1}
                            </span>

                            <code>
                              {page.path || "/"}
                            </code>
                          </div>
                        </td>

                        <td>
                          <div className="admin-analytics-popularity">
                            <span
                              style={{
                                width:
                                  `${popularity}%`
                              }}
                            />
                          </div>
                        </td>

                        <td>
                          {formatNumber(
                            page.visitors
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatNumber(
                              currentPageviews
                            )}
                          </strong>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  );
}


function AnalyticsCard({
  label,
  value,
  caption,
  icon: Icon
}) {
  return (
    <article className="admin-analytics-card">
      <div className="admin-analytics-card-top">
        <span>
          {label}
        </span>

        <div>
          <Icon size={19} />
        </div>
      </div>

      <strong>
        {value}
      </strong>

      <p>
        {caption}
      </p>
    </article>
  );
}


function TrafficChart({
  data
}) {
  const [
    hoveredIndex,
    setHoveredIndex
  ] = useState(null);

  const width = 720;
  const height = 250;
  const paddingX = 34;
  const paddingTop = 25;
  const paddingBottom = 42;

  const maximum =
    Math.max(
      1,
      ...data.flatMap(
        (item) => [
          item.pageviews,
          item.visitors
        ]
      )
    );

  const xForIndex =
    (index) =>
      paddingX +
      (
        index /
        Math.max(
          data.length - 1,
          1
        )
      ) *
      (
        width -
        paddingX * 2
      );

  const yForValue =
    (value) =>
      paddingTop +
      (
        1 -
        value / maximum
      ) *
      (
        height -
        paddingTop -
        paddingBottom
      );

  const createPoints =
    (key) =>
      data
        .map(
          (item, index) =>
            `${xForIndex(index)},${yForValue(item[key])}`
        )
        .join(" ");

  const pageviewPoints =
    createPoints("pageviews");

  const visitorPoints =
    createPoints("visitors");

  const areaPoints =
    `${paddingX},${height - paddingBottom} ${pageviewPoints} ${width - paddingX},${height - paddingBottom}`;

  const hoveredItem =
    hoveredIndex === null
      ? null
      : data[hoveredIndex];

  const hoveredX =
    hoveredIndex === null
      ? 0
      : xForIndex(hoveredIndex);

  const tooltipWidth = 154;

  const tooltipX =
    Math.min(
      width -
      paddingX -
      tooltipWidth,

      Math.max(
        paddingX,
        hoveredX -
        tooltipWidth / 2
      )
    );


  return (
    <div className="admin-analytics-chart">
      <svg
        viewBox={
          `0 0 ${width} ${height}`
        }
        role="img"
        aria-label="Seven-day page views and visitor chart"
        onMouseLeave={() =>
          setHoveredIndex(null)
        }
      >
        <defs>
          <linearGradient
            id="admin-analytics-area"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--primary)"
              stopOpacity="0.2"
            />

            <stop
              offset="100%"
              stopColor="var(--primary)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map(
          (ratio) => {
            const y =
              paddingTop +
              ratio *
              (
                height -
                paddingTop -
                paddingBottom
              );

            return (
              <line
                key={ratio}
                x1={paddingX}
                x2={
                  width -
                  paddingX
                }
                y1={y}
                y2={y}
                className="admin-analytics-grid-line"
              />
            );
          }
        )}

        <polygon
          points={areaPoints}
          className="admin-analytics-area"
          fill="url(#admin-analytics-area)"
        />

        <polyline
          points={pageviewPoints}
          className="admin-analytics-line admin-analytics-line-pageviews"
        />

        <polyline
          points={visitorPoints}
          className="admin-analytics-line admin-analytics-line-visitors"
        />

        {data.map(
          (item, index) => (
            <g key={item.date}>
              <circle
                cx={xForIndex(index)}
                cy={
                  yForValue(
                    item.pageviews
                  )
                }
                r="4"
                className="admin-analytics-point admin-analytics-point-pageviews"
              >
                <title>
                  {item.label}: {
                    item.pageviews
                  } page views
                </title>
              </circle>

              <circle
                cx={xForIndex(index)}
                cy={
                  yForValue(
                    item.visitors
                  )
                }
                r="3.5"
                className="admin-analytics-point admin-analytics-point-visitors"
              >
                <title>
                  {item.label}: {
                    item.visitors
                  } visitors
                </title>
              </circle>

              <text
                x={xForIndex(index)}
                y={height - 15}
                textAnchor="middle"
                className="admin-analytics-axis-label"
              >
                {item.label}
              </text>
            </g>
          )
        )}

        {hoveredItem && (
          <g
            className="admin-analytics-tooltip"
            aria-hidden="true"
          >
            <line
              x1={hoveredX}
              x2={hoveredX}
              y1={paddingTop}
              y2={
                height -
                paddingBottom
              }
              className="admin-analytics-hover-line"
            />

            <rect
              x={tooltipX}
              y="7"
              width={tooltipWidth}
              height="69"
              rx="11"
              className="admin-analytics-tooltip-box"
            />

            <text
              x={tooltipX + 12}
              y="27"
              className="admin-analytics-tooltip-date"
            >
              {new Intl.DateTimeFormat(
                "en-IN",
                {
                  day: "numeric",
                  month: "short"
                }
              ).format(
                new Date(
                  `${hoveredItem.date}T00:00:00Z`
                )
              )}
            </text>

            <circle
              cx={tooltipX + 14}
              cy="45"
              r="3.5"
              className="admin-analytics-tooltip-pageview-dot"
            />

            <text
              x={tooltipX + 23}
              y="49"
              className="admin-analytics-tooltip-value"
            >
              {hoveredItem.pageviews} page views
            </text>

            <circle
              cx={tooltipX + 14}
              cy="62"
              r="3.5"
              className="admin-analytics-tooltip-visitor-dot"
            />

            <text
              x={tooltipX + 23}
              y="66"
              className="admin-analytics-tooltip-value"
            >
              {hoveredItem.visitors} visitors
            </text>
          </g>
        )}

        {data.map(
          (item, index) => {
            const slotWidth =
              (
                width -
                paddingX * 2
              ) /
              Math.max(
                data.length - 1,
                1
              );

            return (
              <rect
                key={
                  `hover-${item.date}`
                }
                x={
                  xForIndex(index) -
                  slotWidth / 2
                }
                y="0"
                width={slotWidth}
                height={
                  height -
                  paddingBottom +
                  8
                }
                className="admin-analytics-hover-target"
                tabIndex="0"
                aria-label={
                  `${item.label}: ${item.pageviews} page views and ${item.visitors} visitors`
                }
                onMouseEnter={() =>
                  setHoveredIndex(
                    index
                  )
                }
                onFocus={() =>
                  setHoveredIndex(
                    index
                  )
                }
                onBlur={() =>
                  setHoveredIndex(null)
                }
                onTouchStart={() =>
                  setHoveredIndex(
                    index
                  )
                }
              />
            );
          }
        )}
      </svg>

      <p className="admin-analytics-chart-hint">
        Hover or focus a day for exact values
      </p>
    </div>
  );
}


export default AdminAnalyticsPage;
