import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  HeartHandshake,
  ShieldCheck
} from "lucide-react";
import UnwindLogo from "../common/UnwindLogo";

function AuthLayout({
  children,
  title,
  description
}) {
  return (
    <main className="auth-page">
      <section className="auth-page__visual">
        <div className="auth-page__visual-image" />
        <div className="auth-page__visual-overlay" />

        <Link
          to="/"
          className="auth-page__back"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="auth-page__visual-content">
         <Link
  to="/"
  className="auth-page__brand"
>
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="auth-page__brand-logo"
  />

  <span className="auth-page__brand-text">
    Unwind
  </span>
</Link>
          <motion.div
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.7
            }}
          >
            <small>A calmer digital space</small>

            <h1>
              Your wellbeing deserves
              <em> room to breathe.</em>
            </h1>

            <p>
              Join meaningful conversations, reflect
              privately and connect with people who
              understand.
            </p>
          </motion.div>

          <div className="auth-page__trust">
            <span>
              <ShieldCheck size={17} />
              Privacy focused
            </span>

            <span>
              <HeartHandshake size={17} />
              Built around kindness
            </span>
          </div>
        </div>
      </section>

      <section className="auth-page__form-section">
        <motion.div
          className="auth-form-container"
          initial={{
            opacity: 0,
            x: 35
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className="auth-form-heading">
            <UnwindLogo
  variant="symbol"
  theme="dark"
  className="auth-form-heading__mobile-logo"
/>

            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {children}
        </motion.div>
      </section>
    </main>
  );
}

export default AuthLayout;