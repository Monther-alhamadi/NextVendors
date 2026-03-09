import React from "react";
import { useTranslation } from "react-i18next";
import CustomButton from "./CustomButton";
import styles from "./EmptyState.module.css";

const EmptyState = ({ 
  icon = "👻", 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionLink,
  className = "" 
}) => {
  const { t } = useTranslation();

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title || t('common.no_data')}</h3>
      {description && <p className={styles.description}>{description}</p>}
      
      {(onAction || actionLink) && (
        <div className={styles.action}>
          <CustomButton 
            variant="outline" 
            onClick={onAction}
            to={actionLink}
          >
            {actionLabel}
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
