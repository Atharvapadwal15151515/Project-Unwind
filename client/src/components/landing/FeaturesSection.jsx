import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  BookHeart,
  HeartHandshake,
  LockKeyhole,
  MessageCircleHeart,
  Sparkles,
  UsersRound
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: MessageCircleHeart,
    title: "Meaningful conversations",
    description:
      "Share what is on your mind through calm and thoughtful conversations built around emotional safety."
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Supportive communities",
    description:
      "Connect with people who understand similar experiences without the pressure of traditional social media."
  },
  {
    number: "03",
    icon: BookHeart,
    title: "Personal wellness space",
    description:
      "Keep reflections, saved posts and small wellness practices together in one private and peaceful place."
  },
  {
    number: "04",
    icon: LockKeyhole,
    title: "Privacy by design",
    description:
      "You control what you share, who sees it and how you choose to participate in the platform."
  },
  {
    number: "05",
    icon: HeartHandshake,
    title: "Kind interactions",
    description:
      "A community culture built around empathy, respect and conversations that make people feel heard."
  },
  {
    number: "06",
    icon: Sparkles,
    title: "Gentle daily moments",
    description:
      "Use grounding exercises, daily prompts and small reminders that fit naturally into your routine."
  }
];

function FeaturesSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.12
  });

  return (
    <section className="landing-section features-section" id="features">
      <div className="landing-container">
        <motion.div
          className="landing-section-heading landing-section-heading--center"
          ref={ref}
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
            duration: 0.7
          }}
        >
          <div className="landing-eyebrow landing-eyebrow--green">
            <Sparkles size={14} />
            More than another social platform
          </div>

          <h2>
            Everything you need to feel
            <span> supported and connected.</span>
          </h2>

          <p>
            UNWIND combines thoughtful technology with human connection to
            create a healthier online experience.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                className="premium-feature-card"
                key={feature.title}
                initial={{
                  opacity: 0,
                  y: 45,
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
                  duration: 0.55,
                  delay: index * 0.09
                }}
                whileHover={{
                  y: -10,
                  rotateX: 2,
                  rotateY: index % 2 === 0 ? 2 : -2
                }}
              >
                <div className="premium-feature-card__top">
                  <span className="premium-feature-card__icon">
                    <Icon size={22} />
                  </span>

                  <span className="premium-feature-card__number">
                    {feature.number}
                  </span>
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <span className="premium-feature-card__glow" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;