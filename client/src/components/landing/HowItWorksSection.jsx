import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  MessageCircleHeart,
  Sparkles,
  UserRoundPlus,
  UsersRound
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserRoundPlus,
    title: "Create your space",
    description:
      "Build a simple profile and choose the level of privacy that feels comfortable."
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Find your people",
    description:
      "Discover supportive communities based on shared interests and experiences."
  },
  {
    number: "03",
    icon: MessageCircleHeart,
    title: "Connect gently",
    description:
      "Join conversations, share at your own pace and support others with kindness."
  },
  {
    number: "04",
    icon: Sparkles,
    title: "Grow every day",
    description:
      "Use reflections, grounding tools and meaningful connections to support your wellbeing."
  }
];

function HowItWorksSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.18
  });

  return (
    <section
      className="landing-section how-it-works"
      id="how-it-works"
      ref={ref}
    >
      <div className="landing-container">
        <motion.div
          className="landing-section-heading landing-section-heading--center"
          initial={{
            opacity: 0,
            y: 30
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
            duration: 0.65
          }}
        >
          <div className="landing-eyebrow landing-eyebrow--light">
            <Sparkles size={14} />
            Your journey, at your pace
          </div>

          <h2>
            Starting with UNWIND is
            <span> simple and gentle.</span>
          </h2>

          <p>
            There is no pressure to share more than you want. Start small and
            explore when you feel ready.
          </p>
        </motion.div>

        <div className="how-it-works__timeline">
          <motion.div
            className="how-it-works__progress"
            initial={{
              scaleX: 0
            }}
            animate={
              inView
                ? {
                    scaleX: 1
                  }
                : {}
            }
            transition={{
              duration: 1.4,
              delay: 0.4,
              ease: [0.22, 1, 0.36, 1]
            }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.article
                className="how-it-works__step"
                key={step.title}
                initial={{
                  opacity: 0,
                  y: 35
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
                  duration: 0.55,
                  delay: 0.5 + index * 0.14
                }}
                whileHover={{
                  y: -7
                }}
              >
                <div className="how-it-works__icon">
                  <Icon size={22} />
                </div>

                <span className="how-it-works__number">{step.number}</span>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;