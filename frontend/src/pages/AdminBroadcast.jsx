import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Megaphone, Users, Store, Globe, Send, History } from "lucide-react";
import PageContainer from "../components/PageContainer";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import styles from "./AdminBroadcast.module.css";

export default function AdminBroadcast() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all"); // 'all', 'users', 'vendors'
  const [sending, setSending] = useState(false);
  
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // In a real scenario, load broadcast history from API
    setHistory([
      { id: 1, subject: "Welcome to our new Dashboard", target: "all", created_at: new Date().toISOString() },
      { id: 2, subject: "Platform Maintenance Notice", target: "vendors", created_at: new Date(Date.now() - 86400000).toISOString() }
    ]);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.push({ message: t("admin.fill_all_fields", "Please fill all fields"), type: "warning" });
      return;
    }

    setSending(true);
    try {
      // In a real app, you would submit to an endpoint like /admin/broadcast
      // await api.post("/admin/broadcast", { subject, message, target });
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.push({ message: t("admin.broadcast_sent", "Broadcast sent successfully!"), type: "success" });
      
      const newHistory = [{ id: Date.now(), subject, target, created_at: new Date().toISOString() }, ...history];
      setHistory(newHistory);
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.push({ message: t("common.error", "Action failed"), type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
         <h1 className={styles.pageTitle}>{t("admin.broadcast_title", "مركز بث الإشعارات (Broadcast)")}</h1>
         <p className={styles.pageSubtitle}>{t("admin.broadcast_subtitle", "إرسال إشعارات ورسائل تنبيهية لجميع المستخدمين أو فئة محددة")}</p>
      </div>

      <div className={styles.grid}>
        
        {/* Composer Form */}
        <form className={styles.card} onSubmit={handleSend}>
           <h2 className={styles.cardTitle}>
              <Megaphone size={20} color="var(--primary)" /> {t("admin.compose_broadcast", "إنشاء إشعار جديد")}
           </h2>

           <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("admin.audience", "الجمهور المستهدف")}</label>
              <div className={styles.radioGroup}>
                 <label className={`${styles.radioCard} ${target === 'all' ? styles.active : ''}`}>
                    <input type="radio" value="all" checked={target === 'all'} onChange={(e) => setTarget(e.target.value)} />
                    <Globe size={18} /> {t("common.all", "الكل")}
                 </label>
                 <label className={`${styles.radioCard} ${target === 'users' ? styles.active : ''}`}>
                    <input type="radio" value="users" checked={target === 'users'} onChange={(e) => setTarget(e.target.value)} />
                    <Users size={18} /> {t("admin.users", "العملاء فقط")}
                 </label>
                 <label className={`${styles.radioCard} ${target === 'vendors' ? styles.active : ''}`}>
                    <input type="radio" value="vendors" checked={target === 'vendors'} onChange={(e) => setTarget(e.target.value)} />
                    <Store size={18} /> {t("admin.vendors", "التجّار فقط")}
                 </label>
              </div>
           </div>

           <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("admin.broadcast_subject", "عنوان الإشعار")}</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="مثال: إطلاق الميزة الجديدة..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
           </div>

           <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("admin.broadcast_message", "نص الرسالة")}</label>
              <textarea 
                className={styles.input} 
                rows="6" 
                placeholder="اكتب رسالتك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
           </div>

           <button type="submit" className={styles.primaryBtn} disabled={sending}>
              <Send size={18} /> {sending ? t("common.loading", "جاري الإرسال...") : t("admin.send_broadcast", "إرسال الإشعار الآن")}
           </button>
        </form>

        {/* History Area */}
        <div className={styles.card}>
           <h2 className={styles.cardTitle}>
              <History size={20} color="var(--text-muted)" /> {t("admin.broadcast_history", "تاريخ الإشعارات")}
           </h2>
           
           <div className={styles.historyList}>
              {history.length === 0 ? (
                 <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>لا يوجد إشعارات سابقة.</p>
              ) : (
                 history.map(item => (
                    <div key={item.id} className={styles.historyItem}>
                       <h4 className={styles.historyTitle} dir="auto">{item.subject}</h4>
                       <div className={styles.historyMeta}>
                          <span className={styles.badge}>
                             {item.target === 'all' ? 'الكل' : item.target === 'users' ? 'العملاء' : 'التجار'}
                          </span>
                          <span className={styles.time}>{new Date(item.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>

      </div>
    </PageContainer>
  );
}
