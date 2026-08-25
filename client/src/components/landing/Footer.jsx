import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import UnwindLogo from "../common/UnwindLogo";
import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter
} from "react-icons/fa6";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer__main">
          <div className="landing-footer__brand-column">
            <Link
  to="/"
  className="landing-footer__brand"
>
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="landing-footer__brand-logo"
  />

  <span className="landing-footer__brand-text">
    Unwind
  </span>
</Link>

            <p>
              A calmer digital space for reflection, supportive conversations
              and meaningful human connection.
            </p>

            <div className="landing-footer__socials">

  {/* Instagram */}
  <a
    href="YOUR_INSTAGRAM_URL"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="UNWIND on Instagram"
    title="Instagram"
  >
    <FaInstagram size={18} />
  </a>

  {/* Facebook */}
  <a
    href="YOUR_FACEBOOK_URL"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="UNWIND on Facebook"
    title="Facebook"
  >
    <FaFacebookF size={17} />
  </a>

  {/* X / Twitter */}
  <a
    href="YOUR_X_URL"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="UNWIND on X"
    title="X"
  >
    <FaXTwitter size={17} />
  </a>

  {/* Email */}
  <a
    href="mailto:YOUR_EMAIL_ADDRESS"
    aria-label="Email UNWIND"
    title="Email"
  >
    <Mail size={18} />
  </a>

</div>
</div>

          <div className="landing-footer__links">
            <h3>Platform</h3>

            <a href="#features">Features</a>
            <a href="#experience">Experience</a>
            <a href="#stories">Stories</a>
            <Link to="/register">Join UNWIND</Link>
          </div>

          <div className="landing-footer__links">
            <h3>Company</h3>

     <Link to="/info/about">
  About
</Link>

<Link to="/info/values">
  Our values
</Link>

<Link to="/info/careers">
  Careers
</Link>

<Link to="/info/contact">
  Contact
</Link>
          </div>

          <div className="landing-footer__links">
            <h3>Safety</h3>

        <Link to="/info/guidelines">
  Community guidelines
</Link>

<Link to="/info/safety">
  Safety centre
</Link>

<Link to="/terms">
  Terms
</Link>

<Link to="/privacy">
  Privacy policy
</Link>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <p>© {currentYear} UNWIND. All rights reserved.</p>

          <p>
            UNWIND supports general wellbeing and does not replace professional
            mental-health care.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;