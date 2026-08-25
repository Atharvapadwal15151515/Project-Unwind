import {
  ArrowRight,
  Brain,
  Headphones,
  HeartHandshake,
  HeartPulse,
  Move,
  NotebookPen,
  Scan,
  Sprout,
  Timer,
  Waves,
  Wind
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import FavoriteButton
  from "./FavoriteButton";

import "./ToolCard.css";

const iconMap = {
  wind: Wind,
  waves: Waves,
  sprout: Sprout,
  "notebook-pen": NotebookPen,
  "heart-pulse": HeartPulse,
  timer: Timer,
  headphones: Headphones,
  "heart-handshake": HeartHandshake,
  scan: Scan,
  move: Move,
  brain: Brain
};

function ToolCard({
  tool,
  favorite = false,
  onToggleFavorite,
  onOpen
}) {
  const navigate =
    useNavigate();

  if (!tool) {
    return null;
  }

  const Icon =
    iconMap[
      tool.icon
    ] || Sprout;

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
    <article
      className="wellness-tool-card wellness-animate-in"
      onClick={
        handleOpen
      }
    >
      <div className="wellness-tool-card__top">
        <span className="wellness-tool-card__icon">
          <Icon
            size={21}
          />
        </span>

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
      </div>

      <div className="wellness-tool-card__body">
        <span className="wellness-tool-card__duration">
          {tool.duration}
        </span>

        <h3>
          {tool.name}
        </h3>

        <p>
          {tool.description}
        </p>
      </div>

      <button
        type="button"
        className="wellness-tool-card__start"
        onClick={(event) => {
          event.stopPropagation();
          handleOpen();
        }}
      >
        Start

        <ArrowRight
          size={15}
        />
      </button>
    </article>
  );
}

export default ToolCard;