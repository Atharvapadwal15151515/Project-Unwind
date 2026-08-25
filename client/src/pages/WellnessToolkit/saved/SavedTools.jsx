import {
  ArrowLeft,
  Heart
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import ToolCard
  from "../../../components/wellness/ToolCard";

import useWellnessToolkit
  from "../../../hooks/wellness/useWellnessToolkit";

import "./SavedTools.css";

function SavedTools() {
  const navigate =
    useNavigate();

  const {
    favoriteTools,
    toggleFavorite,
    recordToolOpen,
    isFavorite
  } = useWellnessToolkit();

  return (
    <main className="saved-tools-page">
      <header className="saved-tools-header">
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
            Saved Tools
          </h1>
        </div>
      </header>

      <section className="saved-tools-hero">
        <div>
          <Heart
            size={25}
          />
        </div>

        <span>
          Favorites
        </span>

        <h2>
          Your go-to tools,
          all in one place.
        </h2>

        <p>
          Save tools that feel useful
          so they're easier to find
          when you need them again.
        </p>
      </section>

      {favoriteTools.length >
      0 ? (
        <section className="saved-tools-grid">
          {favoriteTools.map(
            (tool) => (
              <ToolCard
                key={
                  tool.id
                }
                tool={
                  tool
                }
                favorite={
                  isFavorite(
                    tool.id
                  )
                }
                onToggleFavorite={
                  toggleFavorite
                }
                onOpen={
                  recordToolOpen
                }
              />
            )
          )}
        </section>
      ) : (
        <section className="saved-tools-empty">
          <Heart
            size={25}
          />

          <h2>
            No saved tools yet
          </h2>

          <p>
            Tap the heart on a wellness
            tool to keep it here.
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

export default SavedTools;