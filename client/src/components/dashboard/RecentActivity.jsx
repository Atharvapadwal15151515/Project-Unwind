import { motion } from "framer-motion";
import {
  BookOpenText,
  HeartPulse,
  MessageCircleHeart,
  UsersRound
} from "lucide-react";

const activities = [
  {
    id: 1,
    title: "Mood check-in saved",
    description: "You recorded that you were feeling good.",
    time: "Today, 9:30 AM",
    icon: HeartPulse
  },
  {
    id: 2,
    title: "Journal entry created",
    description: "You wrote a private reflection.",
    time: "Yesterday, 10:14 PM",
    icon: BookOpenText
  },
  {
    id: 3,
    title: "Joined a community",
    description: "You joined Student Wellbeing.",
    time: "Yesterday, 4:45 PM",
    icon: UsersRound
  },
  {
    id: 4,
    title: "Companion conversation",
    description: "You completed a supportive chat.",
    time: "Monday, 8:20 PM",
    icon: MessageCircleHeart
  }
];

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
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              className="recent-activity__item"
              key={activity.id}
            >
              <div className="recent-activity__marker">
                <span>
                  <Icon size={16} />
                </span>

                {index < activities.length - 1 && (
                  <i />
                )}
              </div>

              <div className="recent-activity__content">
                <strong>{activity.title}</strong>
                <p>{activity.description}</p>
                <small>{activity.time}</small>
              </div>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}

export default RecentActivity;