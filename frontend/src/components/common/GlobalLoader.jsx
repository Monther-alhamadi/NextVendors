import React from 'react';
import styles from './GlobalLoader.module.css';

const GlobalLoader = () => {
  return (
    <div className={styles.loaderMask}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
        <div className={styles.logo}></div>
      </div>
      <div className={styles.text}>Elite Marketplace</div>
    </div>
  );
};

export default GlobalLoader;
