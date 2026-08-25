import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  MessageCircleHeart,
  Sparkles
} from "lucide-react";

function CompanionPreview() {
  return (
    <motion.article
      className="dashboard-widget companion-preview"
      initial={{
        opacity: 0,
        y: 25
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay: 0.22
      }}
    >
      <div className="companion-preview__background">
        <span />
        <span />
        <span />
      </div>

      <div className="companion-preview__content">
        <div className="companion-preview__badge">
          <Sparkles size={14} />
          Private companion
        </div>

        <div className="companion-preview__icon">
          <Bot size={28} />
        </div>

        <h2>A quiet place to talk things through.</h2>

        <p>
          Share what is on your mind and receive calm,
          supportive guidance without judgement.
        </p>

        <Link
          to="/dashboard/ai-companion"
          className="companion-preview__button"
        >
          <MessageCircleHeart size={17} />
          Start a conversation
          <ArrowRight size={16} />
        </Link>
      </div>
    </motion.article>
  );
}

export default CompanionPreview;