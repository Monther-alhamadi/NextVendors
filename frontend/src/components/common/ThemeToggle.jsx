import React from "react";
import { useTheme } from "../../context/ThemeContext";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
      onClick={toggle}
      className={styles.toggle}
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
