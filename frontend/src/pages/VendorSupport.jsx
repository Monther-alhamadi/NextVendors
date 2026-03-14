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
      toast.push({ message: t("common.error_loading_data"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!reply.trim() || !selectedTicket) return;
    try {
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, { message: reply });
      setReply("");
      loadTickets();
    } catch (e) {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  async function handleSubmitNewTicket() {
    if (!form.subject.trim() || !form.initial_message.trim()) return;
    try {
      await api.post("/support/tickets", form);
      setShowNew(false);
      setForm({ subject: "", category: "General Inquiry", priority: "medium", initial_message: "" });
      loadTickets();
      toast.push({ message: t("common.save_success"), type: "success" });
    } catch (e) {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  function getStatusClass(status) {
    if (status === "pending") return styles.statusPending;
    if (status === "processing") return styles.statusProcessing;
    if (status === "completed") return styles.statusCompleted;
    return styles.statusDefault;
  }

  function getPriorityClass(priority) {
    if (priority === "high") return styles.priorityHigh;
    if (priority === "medium") return styles.priorityMedium;
    return styles.priorityLow;
  }

  return (
    <PageContainer>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{t("admin.support_title")}</h1>
          <p className={styles.subtitle}>{t("admin.all_tickets")}</p>
        </div>
        <div className={styles.headerActions}>
           <button onClick={loadTickets} className={styles.actionBtn} title={t("common.refresh")}>
              <RefreshCw size={18} />
           </button>
           <button onClick={() => setShowNew(true)} className={`${styles.actionBtn} ${styles.primaryBtn}`}>
              <MailPlus size={18} /> {t("vendor.add_new")}
           </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar: Tickets List */}
        <div className={styles.sidebar}>
          <div className={styles.ticketList}>
            {loading && tickets.length === 0 ? (
              <Skeleton count={5} height={80} />
            ) : tickets.length === 0 ? (
              <div className={styles.empty}>
                <AlertCircle size={40} opacity={0.3} />
                <p>{t("common.no_data")}</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`${styles.ticketItem} ${selectedTicket?.id === ticket.id ? styles.active : ""}`}
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
                  <div className={styles.chatMeta}>
                    {t("common.status")}: {t(`orders.status_${selectedTicket.status}`, selectedTicket.status)}
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className={styles.messagesContainer}>
                {selectedTicket.messages?.map((msg, idx) => {
                  const isVendor = !msg.is_admin;
                  return (
                    <div key={idx} className={`${styles.messageWrapper} ${isVendor ? styles.self : styles.other}`}>
                      <div className={styles.messageBubble}>
                        <p>{msg.message}</p>
                        <span className={styles.messageTime}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className={styles.chatInput}>
                <textarea
                  className={styles.inputField}
                  placeholder={t("admin.reply_placeholder")}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button className={styles.sendBtn} onClick={handleReply} disabled={!reply.trim()}>
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.chatEmpty}>
               <AlertCircle size={48} opacity={0.2} />
               <p>{t("admin.all_tickets")}</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNew && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{t("vendor.add_new")}</h2>
            
            <div className={styles.formGroup}>
              <label>{t("common.name")}</label>
              <input 
                type="text" 
                value={form.subject}
                onChange={(e) => setForm({...form, subject: e.target.value})}
                placeholder={t("common.name")}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t("common.description")}</label>
              <textarea
                className={`${styles.inputField} ${styles.textareaField}`}
                value={form.initial_message}
                onChange={(e) => setForm({...form, initial_message: e.target.value})}
                placeholder={t("vendor.description_placeholder")}
              />
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setShowNew(false)} className={styles.cancelBtn}>
                {t("common.cancel")}
              </button>
              <button onClick={handleSubmitNewTicket} className={styles.submitBtn}>
                {t("common.send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
