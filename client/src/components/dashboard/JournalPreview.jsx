import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  PenLine
} from "lucide-react";

function JournalPreview() {
  return (
    <motion.article
      className="dashboard-widget journal-preview"
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
        delay: 0.3
      }}
    >
      <div className="journal-preview__top">
        <span className="journal-preview__icon">
          <BookHeart size={22} />
        </span>

        <span className="journal-preview__date">
          <CalendarDays size={14} />
          Yesterday
        </span>
      </div>

      <span className="dashboard-widget__eyebrow">
        Private journal
      </span>

      <h2>“What helped me feel more grounded…”</h2>

      <p>
        I noticed that stepping away from my phone for a
        little while gave me room to think more clearly...
      </p>

      <div className="journal-preview__footer">
        <span>
          <PenLine size={14} />
          Saved privately
        </span>

        <Link to="/dashboard/journal">
          Continue writing
          <ArrowRight size={15} />
        </Link>
      </div>
    </motion.article>
  );
}

export default JournalPreview;