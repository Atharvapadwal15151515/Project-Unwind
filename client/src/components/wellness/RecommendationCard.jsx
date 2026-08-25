import {
  ArrowRight
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import FavoriteButton
  from "./FavoriteButton";

import "./RecommendationCard.css";

function RecommendationCard({
  tool,
  position = 1,
  favorite = false,
  onToggleFavorite,
  onOpen
}) {
  const navigate =
    useNavigate();

  if (!tool) {
    return null;
  }

  const handleOpen =
    () => {
      onOpen?.(
        tool.id
      );

      navigate(
        tool.route
      );
    };

  return (
    <article className="wellness-recommendation-card wellness-animate-in">
      <div className="wellness-recommendation-card__number">
        {String(
          position
        ).padStart(
          2,
          "0"
        )}
      </div>

      <div className="wellness-recommendation-card__content">
        <span>
          {tool.duration}
        </span>

        <h3>
          {tool.name}
        </h3>

        <p>
          {tool.description}
        </p>

        <button
          type="button"
          onClick={
            handleOpen
          }
        >
          Try this tool

          <ArrowRight
            size={14}
          />
        </button>
      </div>

      <FavoriteButton
        active={
          favorite
        }
        onClick={() =>
          onToggleFavorite?.(
            tool.id
          )
        }
      />
    </article>
  );
}

export default RecommendationCard;