import { motion } from "framer-motion";
import {
  History
} from "lucide-react";
import AppEmptyState
  from "../common/AppStates/AppEmptyState";


function RecentActivity() {
  return (
    <motion.article
      className="dashboard-widget recent-activity"
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
        delay: 0.34
      }}
    >
      <div className="dashboard-widget__header">
        <div>
          <span className="dashboard-widget__eyebrow">
            Your journey
          </span>

          <h2>Recent activity</h2>
        </div>
      </div>

     <div className="recent-activity__timeline">
  <AppEmptyState
    icon={History}
    title="No recent activity yet"
    description="Your check-ins, reflections and completed activities will appear here as you use Unwind."
    compact
  />
</div>
    </motion.article>
  );
}

export default RecentActivity;