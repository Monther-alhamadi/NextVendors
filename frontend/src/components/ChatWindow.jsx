import React, { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "../services/messagingService";
import CustomButton from "../components/common/CustomButton";

export default function ChatWindow({ conversation, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  
  // Use a ref to track polling interval to clear it on unmount
  const pollRef = useRef(null);

  useEffect(() => {
     loadMessages();
     // Simple polling for new messages every 5s
     pollRef.current = setInterval(loadMessages, 5000);
     
     return () => clearInterval(pollRef.current);
  }, [conversation.id]);

  useEffect(() => {
      // Scroll to bottom when messages update
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
      try {
          const data = await getMessages(conversation.id);
          setMessages(data);
      } catch (e) {
          console.error("Failed to load messages", e);
      }
  }

  async function handleSend(e) {
      e.preventDefault();
      if (!inputText.trim()) return;
      
      try {
          setLoading(true);
          await sendMessage(conversation.id, inputText);
          setInputText("");
          loadMessages(); // Refresh immediately
      } catch (e) {
          console.error("Failed to send", e);
      } finally {
          setLoading(false);
      }
  }

  const otherName = conversation.vendor_name || conversation.customer_name;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border shadow-xl rounded-t-lg flex flex-col z-50">
       <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
           <span className="font-bold">{otherName}</span>
           <button onClick={onClose} className="text-white hover:text-gray-200">✕</button>
       </div>
       
       <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
           {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No messages yet.</p>}
           
           {messages.map(msg => {
               // Determine alignment: if I am the sender?
               // The frontend doesn't strictly know 'my' user ID here easily without auth context context passing.
               // But we can infer. For now, let's assume if it's NOT the other person, it's me.
               // Actually, `message.sender_id` is available. We need `currentUserId` prop.
               // For simplicity, we just style neutral or rely on parent passing user.
               // Let's rely on simple left/right for now if we can match IDs.
               // We will style generic "chat bubble" for now.
               return (
                   <div key={msg.id} className="mb-2 p-2 rounded bg-white border border-gray-200 shadow-sm">
                       <div className="text-xs text-gray-500 mb-1">
                           {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </div>
                       <div className="text-sm">{msg.content}</div>
                   </div>
               );
           })}
           <div ref={bottomRef} />
       </div>

       <form onSubmit={handleSend} className="p-2 border-t flex gap-2">
           <input 
              className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
           />
           <CustomButton type="submit" size="sm" loading={loading} disabled={!inputText.trim()}>
               Send
           </CustomButton>
       </form>
    </div>
  );
}
