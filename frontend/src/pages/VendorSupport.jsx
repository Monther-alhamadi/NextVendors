import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, MailPlus, AlertCircle, RefreshCw } from "lucide-react";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import Skeleton from "../components/common/Skeleton";
import styles from "./VendorSupport.module.css";

export default function VendorSupport() {
  const { t } = useTranslation();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  
  // New Ticket State
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "General Inquiry", priority: "medium", initial_message: "" });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await api.get("/support/tickets");
      setTickets(res.data || []);
      if (selectedTicket) {
        const updated = res.data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (e) {
      console.error("Failed to load tickets", e);
      toast.push({ message: t("common.error_loading_data", "Failed to load support tickets"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!reply.trim() || !selectedTicket) return;
    try {
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, { content: reply, is_internal: false });
      setReply("");
      toast.push({ message: "Message sent", type: "success" });
      loadTickets();
    } catch (e) {
      toast.push({ message: t("common.error", "Failed to send reply"), type: "error" });
    }
  }

  async function handleSubmitNewTicket() {
    if (!form.subject || !form.initial_message) {
      toast.push({ message: "Please fill the required fields", type: "error" });
      return;
    }
    try {
      const res = await api.post("/support/tickets", form);
      setShowNew(false);
      setForm({ subject: "", category: "General Inquiry", priority: "medium", initial_message: "" });
      toast.push({ message: "Ticket created successfully", type: "success" });
      loadTickets();
      setSelectedTicket(res.data);
    } catch (e) {
      toast.push({ message: "Failed to create ticket", type: "error" });
    }
  }

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return styles.statusOpen;
      case 'closed': return styles.statusClosed;
      case 'pending': return styles.statusPending;
      default: return styles.statusOpen;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      case 'low': return styles.priorityLow;
      default: return styles.priorityLow;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('vendor.support_center', 'مركز دعم الشركاء')}</h1>
          <p className={styles.pageSubtitle}>{t('vendor.support_subtitle', 'تواصل مباشرة مع إدارة المنصة لحل المشاكل أو الاستفسارات')}</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.actionBtn} onClick={loadTickets} title="تحديث">
             <RefreshCw size={18} />
           </button>
           <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={() => setShowNew(true)}>
             + {t('vendor.new_ticket', 'تذكرة جديدة')}
           </button>
        </div>
      </header>
      
      <div className={styles.supportGrid}>
        
        {/* Ticket List */}
        <div className={styles.ticketListPanel}>
          <div className={styles.ticketListHeader}>
            <span className={styles.ticketListTitle}>{t('vendor.my_tickets', 'تذاكري')}</span>
            <span className={styles.ticketCount}>{tickets.length}</span>
          </div>
          <div className={styles.ticketsScroll}>
            {loading ? (
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} height="70px" />)}
              </div>
            ) : tickets.length === 0 ? (
               <div className={styles.emptyList}>
                 <AlertCircle size={32} color="var(--text-muted)" style={{marginBottom: '0.5rem'}} />
                 لا توجد تذاكر دعم سابقة
               </div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`${styles.ticketItem} ${selectedTicket?.id === ticket.id ? styles.active : ''}`}
                >
                  <div className={styles.ticketTitleRow}>
                    <span className={styles.ticketSubject}>{ticket.subject}</span>
                    <span className={`${styles.statusBadge} ${getStatusClass(ticket.status)}`}>
                        {t(`orders.status_${ticket.status}`, ticket.status)}
                    </span>
                  </div>
                  <div className={styles.ticketMetaRow}>
                      <span>#{ticket.id} • {t(`vendor.category_${ticket.category}`, ticket.category)}</span>
                      <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messaging Area */}
        <div className={styles.chatPanel}>
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className={styles.chatHeader}>
                <div className={styles.chatTitleArea}>
                  <div className={styles.chatSubjectRow}>
                     <h2 className={styles.chatSubject}>{selectedTicket.subject}</h2>
                     <span className={`${styles.priorityBadge} ${getPriorityClass(selectedTicket.priority)}`}>
                         {t(`vendor.priority_${selectedTicket.priority}`, selectedTicket.priority)}
                     </span>
                  </div>
                  <p className={styles.chatMeta}>
                    {t('vendor.ticket_number', 'تذكرة #')}{selectedTicket.id}
                  </p>
                </div>
              </div>

              {/* Chat Area */}
              <div className={styles.chatArea}>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map(m => {
                    const isAdmin = m.sender_id === 1; // Assuming 1 is admin/system
                    return (
                    <div key={m.id} className={`${styles.messageWrapper} ${isAdmin ? styles.other : styles.self}`}>
                      <div className={styles.messageBubble}>
                          {m.content}
                      </div>
                      <span className={styles.messageTime}>
                          {isAdmin ? t('vendor.admin_reply', 'الإدارة') : t('vendor.you', 'أنت')} • {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                  )})
                ) : (
                  <p className={styles.emptyList}>{t('vendor.no_messages', 'لا توجد رسائل')}</p>
                )}
              </div>

              {/* Input Area */}
              {selectedTicket.status !== 'closed' ? (
                <div className={styles.inputArea}>
                  <div className={styles.inputWrapper}>
                    <textarea 
                      className={styles.replyInput}
                      placeholder={t('vendor.reply_placeholder', 'اكتب ردك هنا...')}
                      rows="2"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                    <button 
                      onClick={handleReply} 
                      className={styles.sendBtn}
                      disabled={!reply.trim()}
                      title="Send Reply"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.closedNotice}>
                  {t('vendor.ticket_closed_notice', 'تم إغلاق هذه التذكرة. لا يمكنك إضافة رسائل جديدة.')}
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <MailPlus size={40} color="var(--text-muted)" />
              </div>
              <p className={styles.emptyTitle}>{t('vendor.select_ticket', 'اختر تذكرة')}</p>
              <p className={styles.emptySubtitle}>{t('vendor.select_ticket_desc', 'انقر على أي تذكرة من القائمة لعرض المحادثة أو قم بفتح تذكرة جديدة.')}</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{t('vendor.open_new_ticket', 'فتح تذكرة دعم مخصصة')}</h2>
            
            <div className={styles.formGroup}>
              <label>{t('vendor.subject', 'موضوع المشكلة')}</label>
              <input 
                type="text" 
                className={styles.inputField}
                value={form.subject}
                onChange={(e) => setForm({...form, subject: e.target.value})}
                placeholder={t('vendor.subject_placeholder', 'مثال: مشكلة في حساب عمولة طلب معين')}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>{t('vendor.category', 'القسم')}</label>
                <select 
                  className={styles.inputField}
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  <option value="General Inquiry">استفسار عام</option>
                  <option value="Financial">مسألة مالية / عمولة</option>
                  <option value="Technical Bug">خلل تقني</option>
                  <option value="Feature Request">اقتراح ميزة</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>{t('vendor.priority', 'الأهمية')}</label>
                <select 
                  className={styles.inputField}
                  value={form.priority}
                  onChange={(e) => setForm({...form, priority: e.target.value})}
                >
                  <option value="low">عادية</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عاجلة</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>{t('vendor.message', 'التفاصيل')}</label>
              <textarea 
                className={`${styles.inputField} ${styles.textareaField}`}
                value={form.initial_message}
                onChange={(e) => setForm({...form, initial_message: e.target.value})}
                placeholder={t('vendor.message_placeholder', 'يرجى وصف المشكلة بوضوح للتمكن من مساعدتك...')}
              />
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setShowNew(false)} className={styles.cancelBtn}>
                {t('common.cancel', 'إلغاء')}
              </button>
              <button onClick={handleSubmitNewTicket} className={styles.submitBtn}>
                {t('vendor.submit_ticket', 'إرسال التذكرة')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
