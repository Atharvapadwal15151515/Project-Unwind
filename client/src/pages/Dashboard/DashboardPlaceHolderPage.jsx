import { motion } from "framer-motion";
import {
  ArrowLeft,
  Construction,
  Sparkles
} from "lucide-react";
import {
  Link
} from "react-router-dom";

function DashboardPlaceholderPage({
  title,
  description
}) {
  return (
    <motion.section
      className="dashboard-placeholder"
      initial={{
        opacity: 0,
        scale: 0.97
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
    >
      <div className="dashboard-placeholder__icon">
        <Construction size={28} />
      </div>

      <span>
        <Sparkles size={14} />
        Coming in Phase 3
      </span>

      <h2>{title}</h2>
      <p>{description}</p>

      <Link
        to="/dashboard"
        className="dashboard-primary-button"
      >
        <ArrowLeft size={17} />
        Return to dashboard
      </Link>
    </motion.section>
  );
}

export default DashboardPlaceholderPage;