import {
  useEffect,
  useMemo,
  useState
} from "react";

import { motion } from "framer-motion";

import {
  BookOpenText,
  CalendarCheck2,
  Flame,
  TrendingUp
} from "lucide-react";

import api from "../../services/api";

function AnimatedStatistic({
  value,
  suffix,
  decimal,
  delay
}) {
  const [
    displayValue,
    setDisplayValue
  ] = useState(
    decimal
      ? "0.0"
      : 0
  );

  useEffect(() => {
    const duration = 900;

    const timeout =
      setTimeout(() => {
        const startTime =
          performance.now();

        let animationFrame;

        const updateValue =
          currentTime => {
            const progress =
              Math.min(
                (
                  currentTime -
                  startTime
                ) / duration,
                1
              );

            const eased =
              1 -
              Math.pow(
                1 - progress,
                3
              );

            const currentValue =
              value * eased;

            setDisplayValue(
              decimal
                ? currentValue.toFixed(
                    1
                  )
                : Math.round(
                    currentValue
                  )
            );

            if (
              progress < 1
            ) {
              animationFrame =
                requestAnimationFrame(
                  updateValue
                );
            }
          };

        animationFrame =
          requestAnimationFrame(
            updateValue
          );

        return () => {
          cancelAnimationFrame(
            animationFrame
          );
        };
      }, delay * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    decimal,
    delay,
    value
  ]);

  return (
    <strong>
      {displayValue}
      {suffix}
    </strong>
  );
}

function DashboardStats() {
const [stats, setStats] = useState({
  currentStreak: 0,
  daysActive: 0,
  currentMood: null,
  currentMoodScore: 0,
  journalEntries: 0
});

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  useEffect(() => {
    let active = true;

    const loadStats =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
  await api.get(
    "/dashboard/stats"
  );

          if (!active) {
            return;
          }
const data =
  response.data?.data || {};

setStats({
  currentStreak:
    Number(
      data.currentStreak
    ) || 0,

  daysActive:
    Number(
      data.daysActive
    ) || 0,

 currentMood:
  data.currentMood ||
  null,

currentMoodScore:
  Number(
    data.currentMoodScore
  ) || 0,

  journalEntries:
    Number(
      data.journalEntries
    ) || 0
});
        } catch (err) {
          console.error(
            "Dashboard stats error:",
            err
          );

          if (active) {
            setError(
              "Unable to load dashboard statistics."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  const statistics =
    useMemo(
      () => [
        {
          key: "streak",
          label:
            "Current streak",
          value:
            stats.currentStreak,
          suffix: " days",
          icon: Flame,
          description:
            "Keep showing up gently"
        },

        {
          key: "active",
          label:
            "Days active",
          value:
            stats.daysActive,
          suffix: "",
          icon:
            CalendarCheck2,
          description:
            "This month"
        },

        {
  key: "mood",
  label: "Current mood",
  value: stats.currentMoodScore,
  suffix: "/5",
  icon: TrendingUp,
  description:
    stats.currentMood
      ? `Feeling ${stats.currentMood}`
      : "No mood check-in yet"
},

        {
          key: "journal",
          label:
            "Journal entries",
          value:
            stats.journalEntries,
          suffix: "",
          icon:
            BookOpenText,
          description:
            "Private reflections"
        }
      ],
      [stats]
    );

  return (
    <section className="dashboard-stats">
      {statistics.map(
        (
          statistic,
          index
        ) => {
          const Icon =
            statistic.icon;

          return (
            <motion.article
              className="dashboard-stat-card"
              key={
                statistic.key
              }
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.45,
                delay:
                  0.08 *
                  index
              }}
              whileHover={{
                y: -5
              }}
            >
              <div className="dashboard-stat-card__top">
                <span>
                  <Icon
                    size={19}
                  />
                </span>

                <small>
                  {
                    statistic.label
                  }
                </small>
              </div>

              {loading ? (
                <strong>
                  —
                </strong>
              ) : error ? (
                <strong>
                  —
                </strong>
              ) : (
                <AnimatedStatistic
                  value={
                    statistic.value
                  }
                  suffix={
                    statistic.suffix
                  }
                  decimal={
                    statistic.decimal
                  }
                  delay={
                    0.08 *
                    index
                  }
                />
              )}

              <p>
                {
                  statistic.description
                }
              </p>
            </motion.article>
          );
        }
      )}
    </section>
  );
}

export default DashboardStats;