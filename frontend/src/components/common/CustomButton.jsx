import React from "react";
import PropTypes from "prop-types";
import styles from "./CustomButton.module.css";

export default function CustomButton({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  loadingText = "جاري التحميل...",
  icon = null,
  onClick,
  ariaLabel,
  ...props
}) {
  const btnClass = [
    styles.customBtn,
    styles[variant] ? styles[variant] : styles.primary,
    styles[size] ? styles[size] : styles.md,
    disabled || loading ? styles.disabled : "",
  ]
    .join(" ")
    .trim();

  return (
    <button
      className={btnClass}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <span className={styles.loader}>{loadingText}</span>
      ) : (
        <>
          {icon ? (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {children}
        </>
      )}
    </button>
  );
}

CustomButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "outline", "success", "warning"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string,
};
