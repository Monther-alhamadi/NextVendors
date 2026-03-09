import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getMessages, sendMessage } from "../../services/messagingService";
import { useAuth } from "../../store/authStore";
import CustomButton from "../common/CustomButton";

export default function ChatWindow({ conversationId, vendorName, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, newMessage);
      setNewMessage("");
      loadMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-window-overlay">
      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-info">
             <span className="status-dot online"></span>
             <h3>{vendorName}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="messages-list">
          {loading && messages.length === 0 ? (
             <div className="chat-loading">{t('common.loading')}</div>
          ) : messages.length === 0 ? (
             <div className="chat-empty">{t('reviews.no_reviews') || "No messages yet"}</div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message-item ${msg.sender_id === user.id ? "sent" : "received"}`}
              >
                <div className="message-content">
                  {msg.content}
                </div>
                <div className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder={t('product.write_reply') || "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? "..." : "▶"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .chat-window-overlay {
          position: fixed;
          bottom: 24px;
          inset-inline-end: 24px;
          z-index: 1000;
          width: 380px;
          max-width: calc(100vw - 48px);
        }
        .chat-window {
          background: rgba(var(--bg-card-rgb, 255, 255, 255), 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          height: 500px;
          overflow: hidden;
        }
        .chat-header {
          padding: 16px 20px;
          background: var(--primary);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-info { display: flex; align-items: center; gap: 10px; }
        .chat-info h3 { font-size: 1rem; margin: 0; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.online { background: #4ade80; }
        
        .close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-page);
        }
        
        .message-item {
          max-width: 80%;
          display: flex;
          flex-direction: column;
        }
        .message-item.sent { align-self: flex-end; }
        .message-item.received { align-self: flex-start; }

        .message-content {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .sent .message-content {
          background: var(--primary);
          color: white;
          border-bottom-inline-end: 2px;
        }
        .received .message-content {
          background: var(--bg-card);
          color: var(--text-main);
          border: 1px solid var(--border-light);
        }

        .message-time {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          margin-top: 4px;
          align-self: flex-end;
        }

        .chat-input-area {
          padding: 16px;
          border-top: 1px solid var(--border-light);
          display: flex;
          gap: 10px;
          background: var(--bg-card);
        }
        .chat-input-area input {
          flex: 1;
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 10px 16px;
          background: var(--bg-page);
          color: var(--text-main);
          outline: none;
        }
        .chat-input-area button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .chat-input-area button:hover:not(:disabled) { transform: scale(1.1); }
        .chat-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }

        .chat-loading, .chat-empty {
          text-align: center;
          padding: 40px;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}
