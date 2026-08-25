import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleCheckBig,
  Headphones,
  Leaf,
  Play,
  Sparkles
} from "lucide-react";

const benefits = [
  {
    title: "Choose how you participate",
    description:
      "Share publicly, talk in communities or keep your reflections completely private."
  },
  {
    title: "Connect without social pressure",
    description:
      "Build genuine relationships without popularity contests, comparisons or noisy feeds."
  },
  {
    title: "Find support when you need it",
    description:
      "Enter welcoming conversations centred around understanding, respect and mutual care."
  }
];

function ExperienceSection() {
  const shouldReduceMotion = useReducedMotion();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  return (
    <section
      className="landing-section experience-section"
      id="experience"
      ref={ref}
    >
      <div className="landing-container experience-section__grid">
        <motion.div
          className="experience-visual"
          initial={{
            opacity: 0,
            x: -70
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  x: 0
                }
              : {}
          }
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className="experience-visual__video">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/images/wellness-nature.jpg"
            >
              <source src="/videos/calming-nature.mp4" type="video/mp4" />
            </video>

            <div className="experience-visual__overlay" />

            <div className="experience-visual__caption">
              <button type="button" aria-label="Play calming experience">
                <Play size={18} fill="currentColor" />
              </button>

              <div>
                <span>A moment for yourself</span>
                <strong>Breathe. Pause. Begin again.</strong>
              </div>
            </div>
          </div>

          <motion.div
            className="experience-audio"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -9, 0]
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="experience-audio__icon">
              <Headphones size={19} />
            </span>

            <div className="experience-audio__information">
              <small>Now playing</small>
              <strong>Evening calm</strong>

              <div className="experience-audio__bars">
                {Array.from({ length: 16 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            </div>

            <button type="button" aria-label="Play evening calm">
              <Play size={13} fill="currentColor" />
            </button>
          </motion.div>

          <motion.div
            className="experience-reflection"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, 9, 0]
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Leaf size={18} />

            <div>
              <small>Daily reflection</small>
              <strong>“I gave myself space today.”</strong>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="experience-content"
          initial={{
            opacity: 0,
            x: 70
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  x: 0
                }
              : {}
          }
          transition={{
            duration: 0.8,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className="landing-eyebrow landing-eyebrow--green">
            <Sparkles size={14} />
            Designed around your wellbeing
          </div>

          <h2>
            A digital space that feels
            <span> more human.</span>
          </h2>

          <p className="experience-content__description">
            Social platforms often ask you to perform. UNWIND gives you room to
            pause, express yourself honestly and build genuine connections at
            your own pace.
          </p>

          <div className="experience-content__benefits">
            {benefits.map((benefit, index) => (
              <motion.article
                key={benefit.title}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={
                  inView
                    ? {
                        opacity: 1,
                        y: 0
                      }
                    : {}
                }
                transition={{
                  duration: 0.5,
                  delay: 0.35 + index * 0.12
                }}
              >
                <span>
                  <CircleCheckBig size={20} />
                </span>

                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <Link to="/register" className="landing-text-link">
            Discover your UNWIND space
            <ArrowRight size={17} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default ExperienceSection;