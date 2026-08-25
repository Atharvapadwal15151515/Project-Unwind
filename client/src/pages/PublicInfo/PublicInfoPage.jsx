import {
  ArrowLeft,
  Mail,
  ShieldCheck
} from "lucide-react";

import {
  Link,
  Navigate,
  useNavigate,
  useParams
} from "react-router-dom";
import UnwindLogo
  from "../../components/common/UnwindLogo";
import {
  publicInfoContent
} from "./publicInfoContent";

import "./PublicInfoPage.css";

function PublicInfoPage() {
  const navigate =
    useNavigate();

  const {
    pageKey
  } = useParams();

  const page =
    publicInfoContent[
      pageKey
    ];

  if (!page) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <main className="public-info-page">
      <nav className="public-info-nav">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

        <Link
  to="/"
  className="public-info-brand"
>
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="public-info-brand__logo"
  />

  <span>
    Unwind
  </span>
</Link>
      </nav>

      <header className="public-info-hero">

  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="public-info-hero__logo"
  />

  <span>
    {page.eyebrow}
  </span>

  <h1>
    {page.title}
  </h1>

  <p>
    {page.intro}
  </p>

</header>

      <section className="public-info-content">
        {page.sections.map(
          (
            section,
            index
          ) => (
            <article
              key={
                section.title
              }
              className="public-info-section"
            >
              <span>
                {String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <div>
                <h2>
                  {
                    section.title
                  }
                </h2>

                {section.paragraphs.map(
                  (
                    paragraph,
                    paragraphIndex
                  ) => (
                    <p
                      key={
                        paragraphIndex
                      }
                    >
                      {
                        paragraph
                      }
                    </p>
                  )
                )}
              </div>
            </article>
          )
        )}

        {page.contactEmail && (
          <a
            className="public-info-contact"
            href={`mailto:${page.contactEmail}`}
          >
            <Mail
              size={18}
            />

            <div>
              <span>
                Email UNWIND
              </span>

              <strong>
                {
                  page.contactEmail
                }
              </strong>
            </div>
          </a>
        )}
      </section>

      <footer className="public-info-footer">
        <Link to="/terms">
          Terms
        </Link>

        <Link to="/privacy">
          Privacy
        </Link>

        <Link to="/">
          Return to UNWIND
        </Link>
      </footer>
    </main>
  );
}

export default PublicInfoPage;