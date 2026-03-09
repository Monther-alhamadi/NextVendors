import React, { useState, useEffect, useRef } from "react";
import PageContainer from "../components/PageContainer";
import { getConversations, getMessages, sendMessage } from "../services/messagingService";
import { useAuth } from "../store/authStore";
import { useTranslation } from "react-i18next";
import CustomButton from "../components/common/CustomButton";

export default function Inbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    loadConvs();
    const interval = setInterval(loadConvs, 15000); // Poll list every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeId) {
      loadMessages();
      if (pollInterval.current) clearInterval(pollInterval.current);
      pollInterval.current = setInterval(loadMessages, 5000); // Poll messages every 5s
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    }
  }, [activeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConvs() {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    if (!activeId) return;
    try {
      const data = await getMessages(activeId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeId) return;

    try {
      await sendMessage(activeId, newMessage);
      setNewMessage("");
      loadMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <PageContainer>
      <div className="inbox-container animate-fade-in">
        <div className="inbox-sidebar">
          <div className="sidebar-header">
            <h2>{t('nav.messages') || "Inbox"}</h2>
          </div>
          <div className="conv-list">
            {loading ? (
              <div className="p-4 text-center">...</div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                {t('reviews.no_reviews') || "No conversations"}
              </div>
            ) : (
              conversations.map(c => {
                const otherName = user?.role === 'vendor' || user?.is_vendor ? c.customer_name : c.vendor_name;
                return (
                  <div 
                    key={c.id} 
                    className={`conv-item ${activeId === c.id ? "active" : ""}`}
                    onClick={() => setActiveId(c.id)}
                  >
                    <div className="conv-avatar">{otherName?.charAt(0) || "?"}</div>
                    <div className="conv-info">
                      <div className="conv-name">{otherName}</div>
                      <div className="conv-last">{c.last_message}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="inbox-main">
          {activeId ? (
            <>
              <div className="main-header">
                <h3>{user?.role === 'vendor' || user?.is_vendor ? activeConv?.customer_name : activeConv?.vendor_name}</h3>
              </div>
              <div className="main-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`msg-bubble ${msg.sender_id === user?.id ? "sent" : "received"}`}>
                    <div className="msg-content">{msg.content}</div>
                    <div className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="main-input" onSubmit={handleSend}>
                <input 
                  type="text" 
                  placeholder={t('product.write_reply')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">➤</button>
              </form>
            </>
          ) : (
            <div className="main-empty">
              <div className="empty-icon">✉️</div>
              <h2>{t('nav.messages')}</h2>
              <p>{t('reviews.no_reviews') || "Select a conversation to start chatting"}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .inbox-container {
          display: grid;
          grid-template-columns: 320px 1fr;
          height: calc(100vh - 160px);
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        /* Sidebar */
        .inbox-sidebar {
          border-inline-end: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          background: var(--bg-page);
        }
        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-light);
        }
        .sidebar-header h2 { font-size: 1.25rem; margin: 0; }
        
        .conv-list { flex: 1; overflow-y: auto; }
        .conv-item {
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid var(--border-light);
        }
        .conv-item:hover { background: var(--bg-card); }
        .conv-item.active { background: var(--bg-card); border-inline-start: 4px solid var(--accent); }
        
        .conv-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
        .conv-last { 
          font-size: 0.85rem; 
          color: var(--text-tertiary); 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }

        /* Main View */
        .inbox-main {
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          position: relative;
        }
        .main-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-light);
          background: var(--bg-page);
        }
        .main-header h3 { margin: 0; font-size: 1.1rem; }

        .main-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .msg-bubble {
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }
        .msg-bubble.sent { align-self: flex-end; }
        .msg-bubble.received { align-self: flex-start; }

        .msg-content {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .sent .msg-content { background: var(--primary); color: white; border-bottom-inline-end: 2px; }
        .received .msg-content { background: var(--bg-page); color: var(--text-main); border: 1px solid var(--border-light); }

        .msg-time { font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px; align-self: flex-end; }

        .main-input {
          padding: 20px 24px;
          border-top: 1px solid var(--border-light);
          display: flex;
          gap: 12px;
        }
        .main-input input {
          flex: 1;
          padding: 12px 20px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-medium);
          background: var(--bg-page);
          color: var(--text-main);
          outline: none;
        }
        .main-input input:focus { border-color: var(--accent); }
        .main-input button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          text-align: center;
        }
        .empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.3; }

        @media (max-width: 768px) {
          .inbox-container { grid-template-columns: 1fr; height: calc(100vh - 120px); }
          .inbox-sidebar { display: ${activeId ? "none" : "flex"}; }
          .inbox-main { display: ${activeId ? "flex" : "none"}; }
        }
      `}</style>
    </PageContainer>
  );
}
