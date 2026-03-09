import React from "react";
import styles from "./Skeleton.module.css";

/**
 * Premium Skeleton component for loading states.
 * Supports different variants: 'text', 'rect', 'circle'
 */
const Skeleton = ({ variant = "text", width, height, className = "", style = {} }) => {
  const customStyles = {
    width: width || (variant === "circle" ? "40px" : "100%"),
    height: height || (variant === "text" ? "1em" : "40px"),
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={customStyles}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
