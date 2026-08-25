import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, Check, Sparkles } from "lucide-react";

function CtaSection() {
  const {
  isAuthenticated,
  initializing
} = useAuth();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3
  });

  return (
    <section className="cta-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          className="cta-card"
          initial={{
            opacity: 0,
            y: 50,
            scale: 0.96
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  y: 0,
                  scale: 1
                }
              : {}
          }
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <motion.div
            className="cta-card__orb cta-card__orb--one"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <motion.div
            className="cta-card__orb cta-card__orb--two"
            animate={{
              scale: [1, 0.9, 1],
              y: [0, -35, 0]
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="cta-card__content">
            <span className="cta-card__icon">
              <Sparkles size={21} />
            </span>

            <small>Your space is ready</small>

            <h2>
              Give yourself somewhere
              <span> to breathe.</span>
            </h2>

            <p>
              Join UNWIND and begin building a calmer, more supportive digital
              experience around your wellbeing.
            </p>

            <div className="cta-card__actions">
  <motion.div
    whileHover={{
      scale: 1.04
    }}
    whileTap={{
      scale: 0.96
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
          : "Create your free account"}

      <ArrowRight size={18} />
    </Link>
  </motion.div>

  {!isAuthenticated && !initializing && (
    <Link
      to="/login"
      className="landing-button landing-button--outline-light landing-button--large"
    >
      I already have an account
    </Link>
  )}
</div>
            <div className="cta-card__assurance">
              <span>
                <Check size={14} />
                Free to join
              </span>

              <span>
                <Check size={14} />
                No pressure
              </span>

              <span>
                <Check size={14} />
                Your privacy, your choice
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CtaSection;