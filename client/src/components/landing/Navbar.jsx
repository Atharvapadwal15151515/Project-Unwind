import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import LandingNotifications from "./LandingNotifications";
import { Menu, X } from "lucide-react";
import LandingSettings
  from "./LandingSettings";
import UnwindLogo from "../common/UnwindLogo";

const navigationLinks = [
  {
    label: "Features",
    href: "#features"
  },
  {
    label: "Experience",
    href: "#experience"
  },
  {
    label: "How it works",
    href: "#how-it-works"
  },
  {
    label: "Stories",
    href: "#stories"
  }
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <motion.header
      className={`landing-navbar ${
        scrolled ? "landing-navbar--scrolled" : ""
      }`}
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <div className="landing-container landing-navbar__inner">
       <Link
  to="/"
  className="landing-navbar__brand"
  onClick={closeMenu}
>
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="landing-navbar__brand-logo"
  />

  <span className="landing-navbar__brand-text">
    Unwind
  </span>
</Link>

        <nav className="landing-navbar__desktop-navigation">
          {navigationLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-navbar__actions">
  <LandingNotifications />

  <LandingSettings />

  <Link
    to="/login"
    className="landing-navbar__login"
  >
    Sign in
  </Link>

  <Link
    to="/register"
    className="landing-button landing-button--primary landing-button--small"
  >
    Join UNWIND
  </Link>
</div>

        <button
          type="button"
          className="landing-navbar__menu-button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="mobile-navigation__backdrop"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.nav
              className="mobile-navigation"
              initial={{
                opacity: 0,
                y: -20,
                scale: 0.96
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                y: -15,
                scale: 0.96
              }}
              transition={{
                duration: 0.25
              }}
            >
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}

              <div className="mobile-navigation__actions">
  <LandingNotifications />

  <LandingSettings />

  <Link
    to="/login"
    className="landing-button landing-button--secondary"
    onClick={closeMenu}
  >
    Sign in
  </Link>

  <Link
    to="/register"
    className="landing-button landing-button--primary"
    onClick={closeMenu}
  >
    Create account
  </Link>
</div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;