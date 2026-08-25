import {
  Heart
} from "lucide-react";

import "./FavoriteButton.css";

function FavoriteButton({
  active = false,
  onClick,
  label = "Favorite"
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "wellness-favorite-button wellness-favorite-button--active"
          : "wellness-favorite-button"
      }
      aria-label={
        active
          ? "Remove from favorites"
          : label
      }
      aria-pressed={active}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      <Heart
        size={16}
        fill={
          active
            ? "currentColor"
            : "none"
        }
      />
    </button>
  );
}

export default FavoriteButton;