import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowRight,
  Check,
  Heart,
  MessageCircleMore,
  Play,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
const {
  isAuthenticated,
  initializing
} = useAuth();
  const scrollToExperience = () => {
    document
      .getElementById("experience")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="premium-hero">
      <div
  className="premium-hero__media"
  aria-hidden="true"
>
  <img
    src="/images/hero-poster.jpg"
    alt=""
  />

  <div className="premium-hero__overlay" />
</div>

      <motion.div
        className="premium-hero__orb premium-hero__orb--one"
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [0, 45, 0],
                y: [0, -25, 0],
                scale: [1, 1.12, 1]
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="premium-hero__orb premium-hero__orb--two"
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [0, -30, 0],
                y: [0, 35, 0],
                scale: [1, 0.9, 1]
              }
        }
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="landing-container premium-hero__inner">
        <motion.div
          className="premium-hero__content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="landing-eyebrow" variants={itemVariants}>
            <span>
              <Sparkles size={14} />
            </span>

            Mental wellness designed around you
          </motion.div>

          <motion.h1 variants={itemVariants}>
            Find space to pause,
            <span> connect and heal.</span>
          </motion.h1>

          <motion.p
            className="premium-hero__description"
            variants={itemVariants}
          >
            UNWIND is a private mental-wellness community for meaningful
            conversations, gentle self-reflection and supportive human
            connection.
          </motion.p>

          <motion.div
            className="premium-hero__actions"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{
                scale: 1.03
              }}
              whileTap={{
                scale: 0.97
              }}
            >
             <Link
  to={
    isAuthenticated
      ? "/dashboard"
      : "/register"
  }
  className="landing-button landing-button--light landing-button--large"
  aria-disabled={initializing}
  onClick={(event) => {
    if (initializing) {
      event.preventDefault();
    }
  }}
>
  {initializing
    ? "Checking your session..."
    : isAuthenticated
      ? "Continue your journey"
      : "Begin your journey"}

  <ArrowRight size={18} />
</Link>
            </motion.div>

            <motion.button
              type="button"
              className="landing-button landing-button--glass landing-button--large"
              onClick={scrollToExperience}
              whileHover={{
                scale: 1.03
              }}
              whileTap={{
                scale: 0.97
              }}
            >
              <span className="premium-hero__play">
                <Play size={14} fill="currentColor" />
              </span>

              See the experience
            </motion.button>
          </motion.div>

          <motion.div
            className="premium-hero__assurance"
            variants={itemVariants}
          >
            <span>
              <Check size={14} />
              No judgement
            </span>

            <span>
              <Check size={14} />
              Privacy focused
            </span>

            <span>
              <Check size={14} />
              Free to join
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className="premium-hero__visual"
          initial={{
            opacity: 0,
            x: 70,
            scale: 0.92
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1
          }}
          transition={{
            duration: 0.95,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <motion.div
            className="wellness-dashboard"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -8, 0]
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="wellness-dashboard__header">
              <div className="wellness-dashboard__profile">
                <span className="wellness-dashboard__avatar">P</span>

                <div>
                  <small>Good evening</small>
                  <strong>Take a moment to unwind</strong>
                </div>
              </div>

              <button type="button" aria-label="Open wellness suggestions">
                <Sparkles size={18} />
              </button>
            </div>

            <div className="wellness-dashboard__check-in">
              <small>Daily check-in</small>
              <h2>How are you feeling today?</h2>

              <div className="wellness-dashboard__moods">
                {["😔", "😐", "🙂", "😊", "✨"].map((mood, index) => (
                  <motion.button
                    type="button"
                    key={mood}
                    className={
                      index === 3
                        ? "wellness-dashboard__mood--active"
                        : ""
                    }
                    whileHover={{
                      y: -5,
                      scale: 1.08
                    }}
                    whileTap={{
                      scale: 0.92
                    }}
                  >
                    {mood}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="wellness-dashboard__cards">
              <div className="dashboard-card">
                <span className="dashboard-card__icon">
                  <Heart size={18} />
                </span>

                <small>Guided reset</small>
                <strong>2-minute breathing</strong>

                <div className="dashboard-card__breathing">
                  <span />
                </div>
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card__icon">
                  <MessageCircleMore size={18} />
                </span>

                <small>Community</small>
                <strong>18 new conversations</strong>

                <div className="dashboard-card__avatars">
                  <span>A</span>
                  <span>M</span>
                  <span>S</span>
                  <span>+9</span>
                </div>
              </div>
            </div>

            <div className="wellness-dashboard__privacy">
              <span>
                <ShieldCheck size={20} />
              </span>

              <div>
                <strong>Your space stays yours</strong>
                <p>You decide what you share and who can see it.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-floating-card hero-floating-card--active"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -12, 0]
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="hero-floating-card__status" />

            <div>
              <strong>Community active</strong>
              <small>People are connecting now</small>
            </div>
          </motion.div>

          <motion.div
            className="hero-floating-card hero-floating-card--privacy"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, 11, 0]
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
          >
            <ShieldCheck size={18} />

            <div>
              <strong>Privacy first</strong>
              <small>Your wellbeing matters</small>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;