import {
  useEffect,
  useMemo,
  useState
} from "react";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function AnimatedNumber({
  value,
  suffix = "",
  active,
  decimal = false
}) {
  const [
    displayValue,
    setDisplayValue
  ] = useState(0);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const duration = 1300;
    const startTime =
      performance.now();

    let animationFrame;

    const animate = currentTime => {
      const progress =
        Math.min(
          (currentTime - startTime) /
            duration,
          1
        );

      const easedProgress =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      const currentValue =
        value * easedProgress;

      setDisplayValue(
        decimal
          ? currentValue.toFixed(1)
          : Math.floor(currentValue)
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(
            animate
          );
      }
    };

    animationFrame =
      requestAnimationFrame(
        animate
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [
    active,
    decimal,
    value
  ]);

  return (
    <strong>
      {displayValue}
      {suffix}
    </strong>
  );
}

function StatsSection() {
  const [
    stats,
    setStats
  ] = useState({
    totalMembers: 0,
    communityConversations: 0,
    sharedExperiences: 0,
    communityRating: 0
  });

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(false);

  const { ref, inView } =
    useInView({
      triggerOnce: true,
      threshold: 0.3
    });

  /*
  |--------------------------------------------------------------------------
  | Load Landing Statistics
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;

    const loadStats =
      async () => {
        try {
          setLoading(true);
          setError(false);

          const response =
            await fetch(
              `${API_URL}/public/stats`
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Failed to load statistics"
            );
          }

          if (!active) {
            return;
          }

          setStats({
            totalMembers:
              Number(
                result.data
                  ?.totalMembers
              ) || 0,

            communityConversations:
              Number(
                result.data
                  ?.communityConversations
              ) || 0,

            sharedExperiences:
              Number(
                result.data
                  ?.sharedExperiences
              ) || 0,

            communityRating:
              Number(
                result.data
                  ?.communityRating
              ) || 0
          });
        } catch (err) {
          console.error(
            "Landing statistics error:",
            err
          );

          if (active) {
            setError(true);
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

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const statistics =
    useMemo(
      () => [
        {
          value:
            stats.totalMembers,
          suffix: "",
          label:
            "Supportive members"
        },
        {
          value:
            stats.communityConversations,
          suffix: "",
          label:
            "Community conversations"
        },
        {
          value:
            stats.sharedExperiences,
          suffix: "",
          label:
            "Shared experiences"
        },
        {
          value:
            stats.communityRating,
          suffix: "/5",
          label:
            "Community rating",
          decimal: true
        }
      ],
      [stats]
    );

  return (
    <section
      className="stats-section"
      ref={ref}
    >
      <div className="landing-container stats-section__grid">
        {statistics.map(
          (
            statistic,
            index
          ) => (
            <motion.article
              className="stat-card"
              key={
                statistic.label
              }
              initial={{
                opacity: 0,
                y: 25
              }}
              animate={
                inView
                  ? {
                      opacity: 1,
                      y: 0
                    }
                  : {}
              }
              transition={{
                duration: 0.55,
                delay:
                  index * 0.1
              }}
            >
              {loading ? (
                <strong>
                  —
                </strong>
              ) : error ? (
                <strong>
                  —
                </strong>
              ) : (
                <AnimatedNumber
                  value={
                    statistic.value
                  }
                  suffix={
                    statistic.suffix
                  }
                  active={
                    inView
                  }
                  decimal={
                    statistic.decimal
                  }
                />
              )}

              <span>
                {
                  statistic.label
                }
              </span>
            </motion.article>
          )
        )}
      </div>
    </section>
  );
}

export default StatsSection;