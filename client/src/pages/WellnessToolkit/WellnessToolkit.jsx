import {
  ArrowRight,
  Clock3,
  Heart,
  History,
  Leaf,
  Sparkles
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  Swiper,
  SwiperSlide
} from "swiper/react";

import "swiper/css";

import gsap from "gsap";

import {
  useGSAP
} from "@gsap/react";

import {
  wellnessCategories
} from "../../data/wellness/categories";

import {
  wellnessGoals
} from "../../data/wellness/emotions";

import useWellnessToolkit
  from "../../hooks/wellness/useWellnessToolkit";

import ToolCard
  from "../../components/wellness/ToolCard";

import CategoryCard
  from "../../components/wellness/CategoryCard";

import MoodSelector
  from "../../components/wellness/MoodSelector";

import RecommendationCard
  from "../../components/wellness/RecommendationCard";

import "./WellnessToolkit.css";

gsap.registerPlugin(
  useGSAP
);

function WellnessToolkit() {
  const navigate =
    useNavigate();

  const pageRef =
    useRef(null);

  const [
    selectedCategory,
    setSelectedCategory
  ] = useState(null);

  const {
    tools,

    selectedGoal,
    setSelectedGoal,

    recommendedTools,

    favoriteTools,
    toggleFavorite,

    recentTools,
    recordToolOpen,

    isFavorite
  } = useWellnessToolkit();

  const reduceMotion =
    useMemo(
      () =>
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches,
      []
    );

  const quickTools =
    useMemo(
      () =>
        tools.filter(
          (tool) =>
            [
              "box-breathing",
              "focus-timer",
              "calm-sounds",
              "gratitude"
            ].includes(
              tool.id
            )
        ),
      [tools]
    );

  const categoryTools =
    useMemo(
      () => {
        if (!selectedCategory) {
          return [];
        }

        return tools.filter(
          (tool) =>
            tool.category ===
            selectedCategory
        );
      },
      [
        tools,
        selectedCategory
      ]
    );

  const selectedGoalLabel =
    useMemo(
      () =>
        wellnessGoals.find(
          (goal) =>
            goal.id ===
            selectedGoal
        ) || null,
      [selectedGoal]
    );

  useGSAP(
    () => {
      if (
        reduceMotion
      ) {
        return;
      }

      gsap.from(
        ".toolkit-hero__content > *",
        {
          opacity: 0,
          y: 18,
          duration: 0.55,
          stagger: 0.07,
          ease:
            "power2.out"
        }
      );

      gsap.from(
        ".toolkit-home-section",
        {
          opacity: 0,
          y: 22,
          duration: 0.55,
          stagger: 0.08,
          delay: 0.12,
          ease:
            "power2.out"
        }
      );
    },
    {
      scope:
        pageRef
    }
  );

  useGSAP(
    () => {
      if (
        reduceMotion ||
        !selectedGoal
      ) {
        return;
      }

      gsap.fromTo(
        ".wellness-recommendation-card",
        {
          opacity: 0,
          y: 14,
          scale: 0.985
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.07,
          ease:
            "power2.out"
        }
      );
    },
    {
      scope:
        pageRef,
      dependencies: [
        selectedGoal
      ]
    }
  );

  const handleToolOpen =
    (toolId) => {
      recordToolOpen(
        toolId
      );
    };

  const handleCategoryClick =
    (categoryId) => {
      setSelectedCategory(
        (
          current
        ) =>
          current ===
          categoryId
            ? null
            : categoryId
      );

      if (
        reduceMotion
      ) {
        return;
      }

      window.setTimeout(
        () => {
          gsap.fromTo(
            ".toolkit-category-results .wellness-tool-card",
            {
              opacity: 0,
              y: 14
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.06,
              ease:
                "power2.out"
            }
          );
        },
        0
      );
    };

  return (
    <main
      ref={pageRef}
      className="toolkit-page"
    >
      {/* =========================================
          HERO
      ========================================== */}

      <section className="toolkit-hero">
        <div className="toolkit-hero__content">
          <span className="toolkit-eyebrow">
            <Leaf
              size={15}
            />

            Wellness Toolkit
          </span>

          <h1>
            What can help
            <br />
            right now?
          </h1>

          <p>
            Small, practical tools for
            difficult moments, quiet
            reflection, rest and focus.
          </p>

          <div className="toolkit-hero__actions">
            <button
              type="button"
              className="toolkit-primary-action"
              onClick={() => {
                document
                  .querySelector(
                    "#toolkit-feeling-section"
                  )
                  ?.scrollIntoView({
                    behavior:
                      reduceMotion
                        ? "auto"
                        : "smooth"
                  });
              }}
            >
              Find a tool

              <ArrowRight
                size={16}
              />
            </button>

            <button
              type="button"
              className="toolkit-secondary-action"
              onClick={() =>
                navigate(
                  "/dashboard/toolkit/activity"
                )
              }
            >
              <History
                size={16}
              />

              Activity
            </button>
          </div>
        </div>

        <div className="toolkit-hero__visual">
          <div className="toolkit-orbit toolkit-orbit--one" />

          <div className="toolkit-orbit toolkit-orbit--two" />

          <div className="toolkit-hero-orb">
            <span>
              <Leaf
                size={31}
              />
            </span>

            <small>
              pause
            </small>

            <strong>
              reset
            </strong>

            <small>
              continue
            </small>
          </div>
        </div>
      </section>

      {/* =========================================
          FEELING SELECTOR
      ========================================== */}

      <section
        id="toolkit-feeling-section"
        className="toolkit-home-section toolkit-feeling-section"
      >
        <header className="toolkit-section-header">
          <div>
            <span>
              Start here
            </span>

            <h2>
              How are you feeling
              right now?
            </h2>
          </div>

          <p>
            Choose what feels closest.
            We&apos;ll surface three
            tools instead of
            overwhelming you with
            options.
          </p>
        </header>

        <MoodSelector
          selectedGoal={
            selectedGoal
          }
          onSelect={
            setSelectedGoal
          }
        />
      </section>

      {/* =========================================
          RECOMMENDATIONS
      ========================================== */}

      <section className="toolkit-home-section">
        <header className="toolkit-section-header">
          <div>
            <span>
              Recommended for you
            </span>

            <h2>
              {selectedGoalLabel
                ? `For ${selectedGoalLabel.label.toLowerCase()} moments`
                : "A gentle place to begin"}
            </h2>
          </div>

          <p>
            {selectedGoalLabel
              ? "These tools are matched to what you selected."
              : "A few useful tools if you're not sure where to start."}
          </p>
        </header>

        <div className="toolkit-desktop-recommendations">
          {recommendedTools.map(
            (
              tool,
              index
            ) => (
              <RecommendationCard
                key={
                  tool.id
                }
                tool={
                  tool
                }
                position={
                  index + 1
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
                  handleToolOpen
                }
              />
            )
          )}
        </div>

        <div className="toolkit-mobile-recommendations">
          <Swiper
            spaceBetween={12}
            slidesPerView={1.08}
          >
            {recommendedTools.map(
              (
                tool,
                index
              ) => (
                <SwiperSlide
                  key={
                    tool.id
                  }
                >
                  <RecommendationCard
                    tool={
                      tool
                    }
                    position={
                      index + 1
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
                      handleToolOpen
                    }
                  />
                </SwiperSlide>
              )
            )}
          </Swiper>
        </div>
      </section>

      {/* =========================================
          QUICK TOOLS
      ========================================== */}

      <section className="toolkit-home-section">
        <header className="toolkit-section-header toolkit-section-header--compact">
          <div>
            <span>
              Quick tools
            </span>

            <h2>
              Start something simple
            </h2>
          </div>
        </header>

        <div className="toolkit-tool-grid toolkit-tool-grid--quick">
          {quickTools.map(
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
                  handleToolOpen
                }
              />
            )
          )}
        </div>
      </section>

      {/* =========================================
          EXPLORE CATEGORIES
      ========================================== */}

      <section className="toolkit-home-section">
        <header className="toolkit-section-header">
          <div>
            <span>
              Explore
            </span>

            <h2>
              Choose what you need
            </h2>
          </div>

          <p>
            Browse tools by purpose.
            Select a category to see
            what&apos;s available.
          </p>
        </header>

        <div className="toolkit-category-grid">
          {wellnessCategories.map(
            (category) => (
              <CategoryCard
                key={
                  category.id
                }
                category={
                  category
                }
                active={
                  selectedCategory ===
                  category.id
                }
                onClick={
                  handleCategoryClick
                }
              />
            )
          )}
        </div>

        {selectedCategory && (
          <div className="toolkit-category-results">
            <div className="toolkit-category-results__heading">
              <strong>
                {
                  wellnessCategories.find(
                    (category) =>
                      category.id ===
                      selectedCategory
                  )?.name
                }
              </strong>

              <button
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    null
                  )
                }
              >
                Clear
              </button>
            </div>

            {categoryTools.length >
            0 ? (
              <div className="toolkit-tool-grid">
                {categoryTools.map(
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
                        handleToolOpen
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="toolkit-empty-inline">
                More tools are coming
                to this category.
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================
          FAVORITES
      ========================================== */}

      {favoriteTools.length >
        0 && (
        <section className="toolkit-home-section">
          <header className="toolkit-section-header toolkit-section-header--compact">
            <div>
              <span>
                Your tools
              </span>

              <h2>
                Favorites
              </h2>
            </div>

            <Heart
              size={19}
            />
          </header>

          <div className="toolkit-tool-grid">
            {favoriteTools.map(
              (tool) => (
                <ToolCard
                  key={
                    tool.id
                  }
                  tool={
                    tool
                  }
                  favorite
                  onToggleFavorite={
                    toggleFavorite
                  }
                  onOpen={
                    handleToolOpen
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* =========================================
          RECENT
      ========================================== */}

      {recentTools.length >
        0 && (
        <section className="toolkit-home-section">
          <header className="toolkit-section-header toolkit-section-header--compact">
            <div>
              <span>
                Continue
              </span>

              <h2>
                Recently used
              </h2>
            </div>

            <Clock3
              size={19}
            />
          </header>

          <div className="toolkit-recent-list">
            {recentTools
              .slice(
                0,
                4
              )
              .map(
                (tool) => (
                  <button
                    key={
                      `${tool.id}-${tool.usedAt}`
                    }
                    type="button"
                    className="toolkit-recent-item"
                    onClick={() => {
                      handleToolOpen(
                        tool.id
                      );

                      navigate(
                        tool.route
                      );
                    }}
                  >
                    <span className="toolkit-recent-item__icon">
                      <Sparkles
                        size={16}
                      />
                    </span>

                    <div>
                      <strong>
                        {tool.name}
                      </strong>

                      <span>
                        {new Date(
                          tool.usedAt
                        ).toLocaleDateString(
                          [],
                          {
                            month:
                              "short",
                            day:
                              "numeric"
                          }
                        )}
                      </span>
                    </div>

                    <ArrowRight
                      size={15}
                    />
                  </button>
                )
              )}
          </div>
        </section>
      )}

      {/* =========================================
          DIFFICULT MOMENT AREA
      ========================================== */}

      <section className="toolkit-home-section toolkit-help-card">
        <div className="toolkit-help-card__icon">
          <Leaf
            size={23}
          />
        </div>

        <div className="toolkit-help-card__copy">
          <span>
            Having a difficult
            moment?
          </span>

          <h2>
            Start with something
            small.
          </h2>

          <p>
            You don&apos;t need to
            solve everything right
            now. Choose one short
            activity and give yourself
            a few minutes.
          </p>
        </div>

        <div className="toolkit-help-card__actions">
          <button
            type="button"
            onClick={() => {
              recordToolOpen(
                "slow-calm-breathing"
              );

              navigate(
                "/dashboard/toolkit/breathing/slow-calm-breathing"
              );
            }}
          >
            Help me breathe
          </button>

          <button
            type="button"
            onClick={() => {
              recordToolOpen(
                "grounding-54321"
              );

              navigate(
                "/dashboard/toolkit/grounding"
              );
            }}
          >
            Ground me
          </button>

          <button
            type="button"
            onClick={() => {
              recordToolOpen(
                "thought-dump"
              );

              navigate(
                "/dashboard/toolkit/thought-dump"
              );
            }}
          >
            Let me write
          </button>
        </div>
      </section>
    </main>
  );
}

export default WellnessToolkit;