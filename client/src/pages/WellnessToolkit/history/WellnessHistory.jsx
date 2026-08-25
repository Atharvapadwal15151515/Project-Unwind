import {
  ArrowLeft,
  Clock3,
  Heart,
  Leaf,
  Trash2
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  clearWellnessHistory,
  getWellnessHistory
} from "../../../utils/wellnessStorage";

import "./WellnessHistory.css";

function WellnessHistory() {
  const navigate =
    useNavigate();

  const [
    history,
    setHistory
  ] = useState(
    () =>
      getWellnessHistory()
  );

  const groupedHistory =
    useMemo(
      () => {
        const groups = {};

        history.forEach(
          (activity) => {
            const date =
              new Date(
                activity.completedAt
              );

            const key =
              date.toDateString();

            if (!groups[key]) {
              groups[key] = [];
            }

            groups[key].push(
              activity
            );
          }
        );

        return groups;
      },
      [history]
    );

  const handleClear =
    () => {
      clearWellnessHistory();

      setHistory([]);
    };

  const formatDate =
    (dateString) => {
      const date =
        new Date(
          dateString
        );

      const today =
        new Date();

      const yesterday =
        new Date();

      yesterday.setDate(
        today.getDate() - 1
      );

      if (
        date.toDateString() ===
        today.toDateString()
      ) {
        return "Today";
      }

      if (
        date.toDateString() ===
        yesterday.toDateString()
      ) {
        return "Yesterday";
      }

      return date.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );
    };

  const formatTime =
    (dateString) => {
      return new Date(
        dateString
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );
    };

  return (
    <main className="wellness-history-page">
      <header className="wellness-history-header">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/toolkit"
            )
          }
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

        <div>
          <span>
            Your Wellness
          </span>

          <h1>
            Activity
          </h1>
        </div>
      </header>

      <section className="wellness-history-hero">
        <div className="wellness-history-hero__icon">
          <Leaf size={26} />
        </div>

        <div>
          <span>
            Wellness activity
          </span>

          <h2>
            Small moments
            still matter.
          </h2>

          <p>
            A simple record of
            the wellness tools
            you've completed.
          </p>
        </div>

        <div className="wellness-history-count">
          <strong>
            {history.length}
          </strong>

          <span>
            activities
          </span>
        </div>
      </section>

      {history.length === 0 ? (
        <section className="wellness-history-empty">
          <div>
            <Heart size={25} />
          </div>

          <h2>
            Nothing here yet
          </h2>

          <p>
            Complete a breathing
            session, grounding
            activity, gratitude
            reflection or another
            wellness tool and it
            will appear here.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard/toolkit"
              )
            }
          >
            Explore Toolkit
          </button>
        </section>
      ) : (
        <>
          <div className="wellness-history-toolbar">
            <p>
              This is a record,
              not a streak. Use
              the Toolkit whenever
              it helps.
            </p>

            <button
              type="button"
              onClick={
                handleClear
              }
            >
              <Trash2
                size={14}
              />

              Clear history
            </button>
          </div>

          <section className="wellness-history-list">
            {Object.entries(
              groupedHistory
            ).map(
              ([
                date,
                activities
              ]) => (
                <div
                  className="wellness-history-day"
                  key={date}
                >
                  <h3>
                    {formatDate(
                      activities[0]
                        .completedAt
                    )}
                  </h3>

                  <div className="wellness-history-day__items">
                    {activities.map(
                      (
                        activity
                      ) => (
                        <article
                          className="wellness-history-item"
                          key={
                            activity.id
                          }
                        >
                          <div className="wellness-history-item__icon">
                            <Leaf
                              size={17}
                            />
                          </div>

                          <div className="wellness-history-item__content">
                            <strong>
                              {
                                activity.toolName ||
                                "Wellness activity"
                              }
                            </strong>

                            <span>
                              {
                                activity.type ||
                                "Completed"
                              }
                            </span>
                          </div>

                          <div className="wellness-history-item__time">
                            <Clock3
                              size={13}
                            />

                            {formatTime(
                              activity
                                .completedAt
                            )}
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default WellnessHistory;