import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Get Dashboard Statistics
|--------------------------------------------------------------------------
*/

export async function getDashboardStats(
  userId
) {
  const result =
    await pool.query(
      `
        WITH active_dates AS (

          /* Mood activity */
          SELECT
            logged_at::date AS activity_date
          FROM mood_entries
          WHERE
            user_id = $1
            AND deleted_at IS NULL

          UNION

          /* Journal activity */
          SELECT
            entry_date AS activity_date
          FROM journal_entries
          WHERE
            user_id = $1
            AND is_deleted = FALSE
            AND completed_at IS NOT NULL

          UNION

          /* Habit activity */
          SELECT
            log_date AS activity_date
          FROM habit_logs
          WHERE
            user_id = $1
            AND deleted_at IS NULL
            AND completed_at IS NOT NULL
        ),

        latest_activity AS (
          SELECT
            MAX(activity_date)
              AS latest_date
          FROM active_dates
        ),

        numbered_dates AS (
          SELECT
            activity_date,

            ROW_NUMBER() OVER (
              ORDER BY
                activity_date DESC
            ) AS row_number
          FROM active_dates
        ),

        streak_groups AS (
          SELECT
            activity_date,

            activity_date +
              row_number::integer
              AS streak_group
          FROM numbered_dates
        ),

        current_streak AS (
          SELECT
            CASE
              WHEN
                latest_date IS NULL
              THEN 0

              WHEN
                latest_date <
                CURRENT_DATE - 1
              THEN 0

              ELSE (
                SELECT
                  COUNT(*)::INTEGER
                FROM streak_groups
                WHERE streak_group = (
                  SELECT
                    streak_group
                  FROM streak_groups
                  WHERE
                    activity_date =
                    latest_date
                  LIMIT 1
                )
              )
            END AS streak
          FROM latest_activity
        ),

        active_this_month AS (
          SELECT
            COUNT(
              DISTINCT activity_date
            )::INTEGER AS days_active
          FROM active_dates
          WHERE
            activity_date >=
              DATE_TRUNC(
                'month',
                CURRENT_DATE
              )::date

            AND
            activity_date <=
              CURRENT_DATE
        ),

        current_mood AS (
  SELECT
    mood_label,
    mood_score
  FROM mood_entries
  WHERE
    user_id = $1
    AND deleted_at IS NULL
  ORDER BY
    logged_at DESC
  LIMIT 1
),

        journal_count AS (
          SELECT
            COUNT(*)::INTEGER
              AS total
          FROM journal_entries
          WHERE
            user_id = $1

            AND
            is_deleted = FALSE

            AND
            completed_at IS NOT NULL
        )

        SELECT
          cs.streak
            AS current_streak,

          am.days_active
            AS days_active,

        cm.mood_label
  AS current_mood,

cm.mood_score
  AS current_mood_score,

          jc.total
            AS journal_entries

        FROM current_streak cs
        CROSS JOIN
          active_this_month am
       LEFT JOIN
  current_mood cm
  ON TRUE
        CROSS JOIN
          journal_count jc
      `,
      [
        userId
      ]
    );

  const stats =
    result.rows[0];

  return {
    currentStreak:
      Number(
        stats?.current_streak
      ) || 0,

    daysActive:
      Number(
        stats?.days_active
      ) || 0,

   currentMood:
  stats?.current_mood ||
  null,

currentMoodScore:
  Number(
    stats?.current_mood_score
  ) || 0,

    journalEntries:
      Number(
        stats?.journal_entries
      ) || 0
  };
}