import {
  Brain,
  Headphones,
  Heart,
  Leaf,
  Moon,
  Sprout,
  Target,
  Wind
} from "lucide-react";

import "./CategoryCard.css";

const iconMap = {
  wind: Wind,
  sprout: Sprout,
  brain: Brain,
  heart: Heart,
  target: Target,
  moon: Moon,
  leaf: Leaf,
  headphones: Headphones
};

function CategoryCard({
  category,
  active = false,
  onClick
}) {
  if (!category) {
    return null;
  }

  const Icon =
    iconMap[
      category.icon
    ] || Sprout;

  return (
    <button
      type="button"
      className={
        active
          ? "wellness-category-card wellness-category-card--active wellness-animate-in"
          : "wellness-category-card wellness-animate-in"
      }
      onClick={() =>
        onClick?.(
          category.id
        )
      }
    >
      <span className="wellness-category-card__icon">
        <Icon
          size={19}
        />
      </span>

      <div>
        <strong>
          {category.name}
        </strong>

        <p>
          {category.description}
        </p>
      </div>
    </button>
  );
}

export default CategoryCard;