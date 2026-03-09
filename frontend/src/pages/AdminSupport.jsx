import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, MailPlus } from "lucide-react";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminSupport.module.css";

export default function AdminSupport() {
  const { t } = useTranslation();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(''); // '', 'user', 'vendor'

  useEffect(() => {
    loadTickets();
  }, [roleFilter]);

  async function loadTickets() {
    setLoading(true);
    try {
      const endpoint = roleFilter ? `/support/admin/tickets?role=${roleFilter}` : "/support/admin/tickets";
      const res = await api.get(endpoint);
      setTickets(res.data || []);
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
      // Reload ticket details
      const res = await api.get(`/support/tickets/${selectedTicket.id}`);
      setSelectedTicket(res.data);
      // Update in list
      setTickets(tickets.map(t_tick => t_tick.id === res.data.id ? res.data : t_tick));
    } catch (e) {
      toast.push({ message: t("common.error", "Failed to send reply"), type: "error" });
    }
  }

  async function updateStatus(status) {
    if (!selectedTicket) return;
    try {
      const res = await api.put(`/support/admin/tickets/${selectedTicket.id}`, { status });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t_tick => t_tick.id === res.data.id ? res.data : t_tick));
      toast.push({ message: t('common.save_success', 'Status updated successfully'), type: "success" });
    } catch (e) {
      toast.push({ message: t('common.error', 'Failed to update status'), type: "error" });
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
    <PageContainer>
      <div className={styles.pageHeader}>
         <h1 className={styles.pageTitle}>{t('admin.support_title', 'Helpdesk & Support Center')}</h1>
         <p className={styles.pageSubtitle}>{t('admin.support_subtitle', 'Resolve merchant and customer inquiries effectively')}</p>
      </div>
      
      <div className={styles.supportGrid}>
        
        {/* Ticket List */}
        <div className={styles.ticketListPanel}>
          <div className={styles.ticketListHeader}>
            <span className={styles.ticketListTitle}>{t('admin.all_tickets', 'All Tickets')}</span>
            <span className={styles.ticketCount}>{tickets.length}</span>
          </div>
          <div className={styles.roleTabs}>
            <button className={`${styles.roleTab} ${roleFilter === '' ? styles.activeTab : ''}`} onClick={() => setRoleFilter('')}>
              {t('common.all', 'الكل')}
            </button>
            <button className={`${styles.roleTab} ${roleFilter === 'user' ? styles.activeTab : ''}`} onClick={() => setRoleFilter('user')}>
              {t('admin.customers', 'العملاء')}
            </button>
            <button className={`${styles.roleTab} ${roleFilter === 'vendor' ? styles.activeTab : ''}`} onClick={() => setRoleFilter('vendor')}>
              {t('admin.vendors', 'البائعين')}
            </button>
          </div>
          <div className={styles.ticketsScroll}>
            {loading ? (
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} height="70px" />)}
              </div>
            ) : tickets.length === 0 ? (
               <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                 No tickets found.
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
                      <span>#{ticket.id} • {ticket.category} {ticket.order_id ? `• Order #${ticket.order_id}` : ''}</span>
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
                         {selectedTicket.priority}
                     </span>
                  </div>
                  <p className={styles.chatMeta}>
                    Ticket #{selectedTicket.id} | User ID: {selectedTicket.user_id}
                    {selectedTicket.order_id && ` | Order #${selectedTicket.order_id}`}
                  </p>
                </div>
                <div>
                  <select 
                    className={styles.statusSelect}
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option value="open">{t('orders.status_open', 'Open')}</option>
                    <option value="pending">{t('orders.status_pending', 'Pending')}</option>
                    <option value="closed">{t('orders.status_closed', 'Closed')}</option>
                  </select>
                </div>
              </div>

              {/* Chat Area */}
              <div className={styles.chatArea}>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map(m => (
                    <div key={m.id} className={`${styles.messageWrapper} ${m.sender_id === 1 ? styles.self : styles.other}`}>
                      <div className={styles.messageBubble}>
                          {m.content}
                      </div>
                      <span className={styles.messageTime}>
                          {m.sender_id === 1 ? "You (Admin)" : `User #${selectedTicket.user_id}`} • {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No messages yet.</p>
                )}
              </div>

              {/* Input Area */}
              <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                  <textarea 
                    className={styles.replyInput}
                    placeholder={t('admin.reply_placeholder', 'Write your reply here...')}
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
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <MailPlus size={40} color="var(--text-muted)" />
              </div>
              <p className={styles.emptyTitle}>{t('admin.select_ticket_desc', 'Select a Ticket')}</p>
              <p className={styles.emptySubtitle}>Click on any ticket in the list to view the conversation and reply.</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
