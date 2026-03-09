import React from "react";
import PropTypes from "prop-types";
import styles from "./PageContainer.module.css";

export default function PageContainer({ children, className = "", maxWidth }) {
  return (
    <div
      className={`${styles.page} ${className}`}
      style={maxWidth ? { maxWidth } : {}}
    >
      {children}
    </div>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  maxWidth: PropTypes.string,
};
