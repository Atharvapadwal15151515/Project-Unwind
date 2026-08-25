import {
  ArrowLeft,
  ArrowRight,
  Clock3
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import useWellnessToolkit
  from "../../../hooks/wellness/useWellnessToolkit";

import "./RecentTools.css";

function RecentTools() {
  const navigate =
    useNavigate();

  const {
    recentTools,
    recordToolOpen
  } = useWellnessToolkit();

  return (
    <main className="recent-tools-page">
      <header className="recent-tools-header">
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
            Your Toolkit
          </span>

          <h1>
            Recently Used
          </h1>
        </div>
      </header>

      {recentTools.length > 0 ? (
        <section className="recent-tools-list">
          {recentTools.map(
            (tool) => (
              <button
                key={
                  `${tool.id}-${tool.usedAt}`
                }
                type="button"
                className="recent-tool-item"
                onClick={() => {
                  recordToolOpen(
                    tool.id
                  );

                  navigate(
                    tool.route
                  );
                }}
              >
                <span className="recent-tool-item__icon">
                  <Clock3
                    size={17}
                  />
                </span>

                <div>
                  <strong>
                    {tool.name}
                  </strong>

                  <span>
                    Used{" "}
                    {new Date(
                      tool.usedAt
                    ).toLocaleString(
                      [],
                      {
                        month:
                          "short",
                        day:
                          "numeric",
                        hour:
                          "2-digit",
                        minute:
                          "2-digit"
                      }
                    )}
                  </span>
                </div>

                <ArrowRight
                  size={16}
                />
              </button>
            )
          )}
        </section>
      ) : (
        <section className="recent-tools-empty">
          <Clock3
            size={26}
          />

          <h2>
            Nothing recent yet
          </h2>

          <p>
            Open a wellness tool and
            it will appear here.
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
      )}
    </main>
  );
}

export default RecentTools;