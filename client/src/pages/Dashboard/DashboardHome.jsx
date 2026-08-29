import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageCircleHeart,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import DailyQuote from "../../components/dashboard/DailyQuote";
import WellnessTasks from "../../components/dashboard/WellnessTasks";
import DashboardStats from "../../components/dashboard/DashboardStats";
import CompanionPreview from "../../components/dashboard/CompanionPreview";
import CommunityPreview from "../../components/dashboard/CommunityPreview";

import RecentActivity from "../../components/dashboard/RecentActivity";

function getDisplayName(user) {
  const username =
    user?.username;

  if (
    username &&
    !username.includes("@")
  ) {
    return username;
  }

  const fallbackName =
    user?.display_name ||
    user?.displayName ||
    user?.full_name ||
    user?.fullName;

  if (
    fallbackName &&
    !fallbackName.includes("@")
  ) {
    return fallbackName;
  }

  return "there";
}

function getGreeting() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return "Good morning";
  }

  if (currentHour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="dashboard-home">
      <motion.section
        className="dashboard-welcome-card"
        initial={{
          opacity: 0,
          y: 25
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.55
        }}
      >
        <div className="dashboard-welcome-card__orb dashboard-welcome-card__orb--one" />
        <div className="dashboard-welcome-card__orb dashboard-welcome-card__orb--two" />

        <div className="dashboard-welcome-card__content">
          <div className="dashboard-welcome-card__eyebrow">
            <Sparkles size={15} />
            Your calm space
          </div>

          <h2 className="dashboard-welcome-card__title">
  <span className="dashboard-welcome-card__greeting">
    {getGreeting()},
  </span>

  <span className="dashboard-welcome-card__name">
    {getDisplayName(user)}.
  </span>
</h2>

          <p>
            You do not need to solve everything today.
            Choose one small moment that supports you.
          </p>

          <div className="dashboard-welcome-card__actions">
            <Link
              to="/dashboard/mood"
              className="dashboard-primary-button"
            >
              Check in with yourself
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/dashboard/ai-companion"
              className="dashboard-secondary-button"
            >
              <MessageCircleHeart size={17} />
              Start a conversation
            </Link>
          </div>
        </div>

        <div className="dashboard-welcome-card__visual">
          <div className="dashboard-breathing-visual">
            <span className="dashboard-breathing-visual__outer" />
            <span className="dashboard-breathing-visual__middle" />

            <span className="dashboard-breathing-visual__inner">
              Breathe
            </span>
          </div>
        </div>
      </motion.section>

      <DashboardStats />

      <section className="dashboard-main-grid">
        <div className="dashboard-main-grid__primary">
          
          <WellnessTasks />
          <CommunityPreview />
        </div>

        <div className="dashboard-main-grid__secondary">
          <DailyQuote />
          <CompanionPreview />
          
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}

export default DashboardHome;