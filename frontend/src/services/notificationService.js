import api from "./api";

export const getNotifications = async (limit = 20) => {
  const response = await api.get(`/notifications/?limit=${limit}`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllRead = async () => {
  const response = await api.post("/notifications/mark-all-read");
  return response.data;
};
