import "./AppStates.css";

function AppSkeleton({
  variant = "card",
  count = 1,
  className = ""
}) {
  return (
    <div
      className={`app-skeleton-list ${className}`}
      aria-label="Loading content"
      aria-busy="true"
    >
      {Array.from(
        { length: count },
        (_, index) => (
          <div
            key={index}
            className={`app-skeleton app-skeleton--${variant}`}
          >
            {variant === "card" && (
              <>
                <span className="app-skeleton__icon" />

                <div className="app-skeleton__content">
                  <span className="app-skeleton__title" />
                  <span className="app-skeleton__line" />
                  <span className="app-skeleton__line app-skeleton__line--short" />
                </div>
              </>
            )}

            {variant === "list" && (
              <>
                <span className="app-skeleton__avatar" />

                <div className="app-skeleton__content">
                  <span className="app-skeleton__title" />
                  <span className="app-skeleton__line" />
                </div>
              </>
            )}

            {variant === "stat" && (
              <>
                <span className="app-skeleton__label" />
                <span className="app-skeleton__value" />
                <span className="app-skeleton__line app-skeleton__line--short" />
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default AppSkeleton;