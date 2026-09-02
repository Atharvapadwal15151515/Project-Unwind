const CACHE_TTL_MS =
  5 * 60 * 1000;

let overviewCache = {
  expiresAt: 0,
  data: null
};


function getPostHogConfig() {
  const apiKey =
    process.env
      .POSTHOG_PERSONAL_API_KEY;

  const projectId =
    process.env
      .POSTHOG_PROJECT_ID;

  const apiHost =
    (
      process.env.POSTHOG_API_HOST ||
      "https://us.posthog.com"
    ).replace(/\/$/, "");

  if (!apiKey || !projectId) {
    throw new Error(
      "PostHog analytics is not configured"
    );
  }

  return {
    apiKey,
    projectId,
    apiHost
  };
}


async function runHogQLQuery({
  query,
  name
}) {
  const {
    apiKey,
    projectId,
    apiHost
  } = getPostHogConfig();

  const response =
    await fetch(
      `${apiHost}/api/projects/${projectId}/query/`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          name,

          query: {
            kind: "HogQLQuery",
            query
          }
        }),

        signal:
          AbortSignal.timeout(10000)
      }
    );

  if (!response.ok) {
    const message =
      (await response.text())
        .slice(0, 500);

    throw new Error(
      `PostHog query failed (${response.status}): ${message}`
    );
  }

  return response.json();
}


function rowsToObjects(
  result
) {
  const columns =
    result.columns || [];

  return (
    result.results || []
  ).map((row) =>
    Object.fromEntries(
      columns.map(
        (column, index) => [
          column,
          row[index]
        ]
      )
    )
  );
}


export async function getPostHogOverview() {
  const now =
    Date.now();

  if (
    overviewCache.data &&
    overviewCache.expiresAt > now
  ) {
    return {
      ...overviewCache.data,
      cached: true
    };
  }

  const [
  totalsResult,
  sessionsResult,
  dailyResult,
  pagesResult
] = await Promise.all([
    runHogQLQuery({
      name:
        "Unwind admin analytics totals",

      query: `
        SELECT
          count() AS pageviews,
          uniq(distinct_id) AS unique_visitors
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
      `
    }),
    runHogQLQuery({
      name:
        "Unwind admin session analytics",

      query: `
        SELECT
          count() AS total_sessions,

          round(
            avg(duration_seconds)
          ) AS average_duration_seconds,

          round(
            avg(pageviews),
            1
          ) AS pages_per_session

        FROM (
          SELECT
            properties.$session_id
              AS session_id,

            dateDiff(
              'second',
              min(timestamp),
              max(timestamp)
            ) AS duration_seconds,

            countIf(
              event = '$pageview'
            ) AS pageviews

          FROM events

          WHERE
            timestamp >=
              now() - INTERVAL 30 DAY

            AND properties.$session_id
              IS NOT NULL

            AND NOT startsWith(
              coalesce(
                properties.$pathname,
                ''
              ),
              '/admin'
            )

          GROUP BY session_id
        )
      `
    }),
    runHogQLQuery({
      name:
        "Unwind admin analytics daily traffic",

      query: `
        SELECT
          toDate(timestamp) AS date,
          count() AS pageviews,
          uniq(distinct_id) AS visitors
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY date
        ORDER BY date ASC
      `
    }),

    runHogQLQuery({
      name:
        "Unwind admin analytics popular pages",

      query: `
        SELECT
          properties.$pathname AS path,
          count() AS pageviews,
          uniq(distinct_id) AS visitors
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
          AND properties.$pathname IS NOT NULL
        GROUP BY path
        ORDER BY pageviews DESC
        LIMIT 10
      `
    })
  ]);

  const data = {
    periodDays: 30,

    totals:
      rowsToObjects(
        totalsResult
      )[0] || {
        pageviews: 0,
        unique_visitors: 0
      },
    sessions:
      rowsToObjects(
        sessionsResult
      )[0] || {
        total_sessions: 0,
        average_duration_seconds: 0,
        pages_per_session: 0
      },
    daily:
      rowsToObjects(
        dailyResult
      ),

    topPages:
      rowsToObjects(
        pagesResult
      ),

    generatedAt:
      new Date().toISOString(),

    cached: false
  };

  overviewCache = {
    data,

    expiresAt:
      now + CACHE_TTL_MS
  };

  return data;
}