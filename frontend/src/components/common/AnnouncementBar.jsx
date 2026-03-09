import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { X, Megaphone, Info, AlertTriangle } from 'lucide-react';
import styles from './AnnouncementBar.module.css';

const AnnouncementBar = () => {
  const { config } = useConfig();
  const [isVisible, setIsVisible] = useState(true);

  if (!config?.announcement_active || !isVisible) return null;

  const variantClass = styles[config.announcement_variant || 'info'];
  
  const getIcon = () => {
    switch(config.announcement_variant) {
      case 'warning': return <AlertTriangle size={16} />;
      case 'success': return <Megaphone size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className={`${styles.bar} ${variantClass}`}>
      <div className={styles.content}>
        <span className={styles.icon}>{getIcon()}</span>
        <p className={styles.text}>{config.announcement_text}</p>
      </div>
      <button 
        className={styles.closeBtn} 
        onClick={() => setIsVisible(false)}
        aria-label="Close announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
