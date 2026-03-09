import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BellIcon } from "./Icons";
import * as notificationService from "../../services/notificationService";
import styles from "./Header.module.css";

const NotificationHub = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showHub, setShowHub] = useState(false);
    const hubRef = useRef(null);

    const loadNotifications = async () => {
        try {
            const [notifs, unread] = await Promise.all([
                notificationService.getNotifications(10),
                notificationService.getUnreadCount()
            ]);
            setNotifications(notifs);
            setUnreadCount(unread.count);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (hubRef.current && !hubRef.current.contains(event.target)) {
                setShowHub(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            loadNotifications();
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead();
            loadNotifications();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'order': return '📦';
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'promo': return '🎉';
            default: return 'ℹ️';
        }
    };

    return (
        <div className={styles.notificationWrapper} ref={hubRef}>
            <button 
                className={styles.bellBtn} 
                onClick={() => setShowHub(!showHub)}
                aria-label={t('nav.notifications')}
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                )}
            </button>

            {showHub && (
                <div className={styles.notificationHub}>
                    <div className={styles.hubHeader}>
                        <h3>{t('nav.notifications')}</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
                                {t('common.mark_all_read')}
                            </button>
                        )}
                    </div>
                    <div className={styles.hubList}>
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ''}`}
                                    onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                >
                                    <div className={styles.notifIcon}>{getTypeIcon(n.type)}</div>
                                    <div className={styles.notifContent}>
                                        <p className={styles.notifTitle}>{n.title}</p>
                                        <p className={styles.notifDesc}>{n.content}</p>
                                        <span className={styles.notifTime}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                        {n.link && (
                                            <Link to={n.link} className={styles.notifLink} onClick={() => setShowHub(false)}>
                                                {t('common.view_details')}
                                            </Link>
                                        )}
                                    </div>
                                    {!n.is_read && <span className={styles.unreadDot} />}
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyHub}>
                                {t('vendor.no_notifications') || "No notifications yet"}
                            </div>
                        )}
                    </div>
                    <div className={styles.hubFooter}>
                        <Link to="/inbox" onClick={() => setShowHub(false)}>
                            {t('nav.messages') || "Messages"}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationHub;
