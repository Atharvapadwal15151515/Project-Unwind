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
      <div className="notification-redirect-orb notification-redirect-orb--one" />
      <div className="notification-redirect-orb notification-redirect-orb--two" />
      <div className="notification-redirect-orb notification-redirect-orb--three" />

      <section className="notification-redirect-shell">
        <div className="notification-redirect-scene">
          <div className="notification-redirect-ring notification-redirect-ring--outer" />
          <div className="notification-redirect-ring notification-redirect-ring--middle" />
          <div className="notification-redirect-ring notification-redirect-ring--inner" />

          <div className="notification-redirect-bell">
            <Bell
              size={34}
              strokeWidth={1.8}
            />

            <span className="notification-redirect-bell__badge">
              1
            </span>
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


        <div className="notification-redirect-copy">
          <span className="notification-redirect-eyebrow">
            UNWIND NOTIFICATIONS
          </span>

          <h1>
            Your notifications
            moved somewhere better.
          </h1>

          <p>
            We&apos;re taking you to your
            dashboard notification center,
            where everything is easier to
            manage.
          </p>


          <div className="notification-redirect-status">
            <div className="notification-redirect-status__top">
              <span>
                Redirecting automatically
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
            Go to notifications now

            <ArrowRight
              size={17}
            />
          </button>


          <small className="notification-redirect-note">
            You can close this page at
            any time.
          </small>
        </div>
      </section>
    </main>
  );
}


export default NotificationRedirectPage;