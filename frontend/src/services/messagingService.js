import api from "./api";

export async function getConversations() {
  const resp = await api.get("/chat/conversations");
  return resp.data;
}

export async function getMessages(conversationId) {
  const resp = await api.get(`/chat/${conversationId}/messages`);
  return resp.data;
}

export async function startChat(vendorId) {
  const resp = await api.post(`/chat/start/${vendorId}`);
  return resp.data;
}

export async function sendMessage(conversationId, content) {
  const resp = await api.post(`/chat/${conversationId}/messages`, { content });
  return resp.data;
}

export async function getUnreadCount() {
  const resp = await api.get("/chat/unread-count");
  return resp.data;
}
