import {
  useRef
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Home,
  Sparkles
} from "lucide-react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../../context/AuthContext";

import unwindLogo
  from "../../assets/brand/unwind-dark-full.png";

import "./NotFoundPage.css";


function NotFoundPage() {
  const navigate =
    useNavigate();

  const sceneRef =
    useRef(null);

  const {
    user
  } = useAuth();


  const handlePointerMove =
    (event) => {
      const scene =
        sceneRef.current;

      if (!scene) {
        return;
      }

      const bounds =
        scene.getBoundingClientRect();

      const pointerX =
        (
          event.clientX -
          bounds.left
        ) / bounds.width;

      const pointerY =
        (
          event.clientY -
          bounds.top
        ) / bounds.height;

      const rotateY =
        (
          pointerX -
          0.5
        ) * 14;

      const rotateX =
        (
          0.5 -
          pointerY
        ) * 12;

      scene.style.setProperty(
        "--scene-rotate-x",
        `${rotateX}deg`
      );

      scene.style.setProperty(
        "--scene-rotate-y",
        `${rotateY}deg`
      );
    };


  const handlePointerLeave =
    () => {
      const scene =
        sceneRef.current;

      if (!scene) {
        return;
      }

      scene.style.setProperty(
        "--scene-rotate-x",
        "0deg"
      );

      scene.style.setProperty(
        "--scene-rotate-y",
        "0deg"
      );
    };


  const destination =
    user
      ? "/dashboard"
      : "/";

  const destinationLabel =
    user
      ? "Return to dashboard"
      : "Return home";


  return (
    <main className="not-found-page">

      <div
        className="not-found-page__glow not-found-page__glow--one"
        aria-hidden="true"
      />

      <div
        className="not-found-page__glow not-found-page__glow--two"
        aria-hidden="true"
      />

      <nav className="not-found-page__nav">
        <Link
          to={destination}
          aria-label="Return to Unwind"
        >
          <img
            src={unwindLogo}
            alt="Unwind"
          />
        </Link>
      </nav>


      <section className="not-found-page__layout">

        <div className="not-found-page__content">

          <span className="not-found-page__eyebrow">
            <Compass size={15} />

            Lost in thought
          </span>


          <h1>
            This path seems to have
            <span> drifted away.</span>
          </h1>


          <p>
            The page may have moved, the link
            may be incomplete, or perhaps this
            path was never meant to exist.
          </p>


          <div className="not-found-page__actions">

            <Link
              to={destination}
              className="not-found-page__primary"
            >
              <Home size={17} />

              {destinationLabel}

              <ArrowRight size={16} />
            </Link>


            <button
              type="button"
              className="not-found-page__secondary"
              onClick={() =>
                navigate(-1)
              }
            >
              <ArrowLeft size={17} />

              Go back
            </button>

          </div>


          <span className="not-found-page__support">
            <Sparkles size={14} />

            Take a breath. You are still
            within Unwind.
          </span>

        </div>


        <div
          ref={sceneRef}
          className="not-found-scene"
          onPointerMove={
            handlePointerMove
          }
          onPointerLeave={
            handlePointerLeave
          }
          aria-label="Three dimensional 404 illustration"
        >

          <div className="not-found-scene__world">

            <div
              className="not-found-scene__orbit not-found-scene__orbit--outer"
              aria-hidden="true"
            />

            <div
              className="not-found-scene__orbit not-found-scene__orbit--inner"
              aria-hidden="true"
            />


            <div className="not-found-scene__number">
              <span
                className="not-found-scene__digit not-found-scene__digit--first"
                data-character="4"
              >
                4
              </span>

              <span className="not-found-scene__zero">
                <span className="not-found-scene__zero-ring" />

                <span className="not-found-scene__zero-center">
                  <Compass size={31} />
                </span>
              </span>

              <span
                className="not-found-scene__digit not-found-scene__digit--last"
                data-character="4"
              >
                4
              </span>
            </div>


            <div
              className="not-found-scene__floating-card not-found-scene__floating-card--one"
              aria-hidden="true"
            >
              <span />
              <span />
            </div>

            <div
              className="not-found-scene__floating-card not-found-scene__floating-card--two"
              aria-hidden="true"
            >
              <span />
              <span />
            </div>


            <span
              className="not-found-scene__particle not-found-scene__particle--one"
              aria-hidden="true"
            />

            <span
              className="not-found-scene__particle not-found-scene__particle--two"
              aria-hidden="true"
            />

            <span
              className="not-found-scene__particle not-found-scene__particle--three"
              aria-hidden="true"
            />

          </div>

        </div>

      </section>

    </main>
  );
}


export default NotFoundPage;