import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './NetworkStatus.module.css';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [show, setShow] = useState(false);
  const [msgType, setMsgType] = useState(null); // 'online' or 'offline'
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMsgType('online');
      setShow(true);
      // Hide after a few seconds when back online
      setTimeout(() => setShow(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMsgType('offline');
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check - only show if offline
    if (!navigator.onLine) {
      setMsgType('offline');
      setShow(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`${styles.networkStatus} ${show ? styles.visible : ''} ${msgType === 'offline' ? styles.offline : styles.online}`}>
      <div className={styles.icon}>
        {msgType === 'offline' ? <WifiOff size={18} /> : <Wifi size={18} />}
      </div>
      <div className={styles.text}>
        {msgType === 'offline' 
          ? t('common.offline_msg', 'أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.') 
          : t('common.online_msg', 'تم استعادة الاتصال بالإنترنت بنجاح.')}
      </div>
      {msgType === 'online' && (
        <button className={styles.closeBtn} onClick={() => setShow(false)}>
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;
