import {
  ArrowRight,
  Bell,
  Sparkles
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./NotificationRedirectPage.css";


const REDIRECT_SECONDS = 5;


function NotificationRedirectPage() {
  const navigate =
    useNavigate();

  const [
    secondsLeft,
    setSecondsLeft
  ] = useState(
    REDIRECT_SECONDS
  );


  useEffect(() => {
    const countdown =
      window.setInterval(
        () => {
          setSecondsLeft(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );
        },
        1000
      );


    const redirect =
      window.setTimeout(
        () => {
          navigate(
            "/dashboard/notifications",
            {
              replace: true
            }
          );
        },
        REDIRECT_SECONDS *
          1000
      );


    return () => {
      window.clearInterval(
        countdown
      );

      window.clearTimeout(
        redirect
      );
    };
  }, [
    navigate
  ]);


  const goNow = () => {
    navigate(
      "/dashboard/notifications",
      {
        replace: true
      }
    );
  };


  return (
    <main className="notification-redirect-page">

      {/* Ambient background */}

      <div className="notification-redirect-orb notification-redirect-orb--one" />

      <div className="notification-redirect-orb notification-redirect-orb--two" />

      <div className="notification-redirect-orb notification-redirect-orb--three" />


      <section className="notification-redirect-shell">

        {/* Animated visual */}

        <div className="notification-redirect-scene">

          <div className="notification-redirect-ring notification-redirect-ring--outer" />

          <div className="notification-redirect-ring notification-redirect-ring--middle" />

          <div className="notification-redirect-ring notification-redirect-ring--inner" />


          <div className="notification-redirect-bell">

            <Bell
              size={34}
              strokeWidth={1.8}
            />

          </div>


          <Sparkles
            className="notification-redirect-sparkle notification-redirect-sparkle--one"
            size={18}
          />

          <Sparkles
            className="notification-redirect-sparkle notification-redirect-sparkle--two"
            size={14}
          />

          <Sparkles
            className="notification-redirect-sparkle notification-redirect-sparkle--three"
            size={12}
          />

        </div>


        {/* Main content */}

        <div className="notification-redirect-copy">

          <span className="notification-redirect-eyebrow">
            UNWIND NOTIFICATIONS
          </span>


          <h1>
            Taking you to your
            notification center.
          </h1>


          <p>
            You&apos;ll be redirected to your
            dashboard, where you can review
            recent updates, account notices,
            moderation decisions, reminders,
            and community activity.
          </p>


          <div className="notification-redirect-status">

            <div className="notification-redirect-status__top">

              <span>
                Opening notification center
              </span>

              <strong>
                {secondsLeft}s
              </strong>

            </div>


            <div className="notification-redirect-progress">
              <span />
            </div>

          </div>


          <button
            type="button"
            className="notification-redirect-button"
            onClick={
              goNow
            }
          >
            View notifications now

            <ArrowRight
              size={17}
            />
          </button>


          <small className="notification-redirect-note">
            Some notifications may contain
            important account or community
            updates.
          </small>

        </div>

      </section>

    </main>
  );
}


export default NotificationRedirectPage;