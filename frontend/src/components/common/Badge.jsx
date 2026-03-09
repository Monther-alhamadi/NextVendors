import React from "react";
import PropTypes from "prop-types";
import styles from "./Badge.module.css";

export default function Badge({ children, variant = "default", ...props }) {
  const cls = [styles.badge, styles[variant] || ""].join(" ").trim();
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["default", "sale", "new"]),
};
