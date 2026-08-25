import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      className="dashboard-icon-button theme-toggle"
      onClick={toggleTheme}
      whileHover={{
        scale: 1.06
      }}
      whileTap={{
        scale: 0.92
      }}
      aria-label={
        isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      title={
        isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
    >
      <motion.span
        key={isDark ? "sun" : "moon"}
        initial={{
          opacity: 0,
          rotate: -35,
          scale: 0.7
        }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: 1
        }}
        transition={{
          duration: 0.25
        }}
      >
        {isDark ? (
          <Sun size={19} />
        ) : (
          <Moon size={19} />
        )}
      </motion.span>
    </motion.button>
  );
}

export default ThemeToggle;