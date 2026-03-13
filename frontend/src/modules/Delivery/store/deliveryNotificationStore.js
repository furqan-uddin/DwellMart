import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../../../shared/utils/api";

const normalizePayload = (response) => {
  const root = response?.data ?? response ?? {};
  if (Array.isArray(root)) {
    return {
      notifications: root,
      unreadCount: root.filter((n) => !n?.isRead).length,
      pages: 1,
    };
  }

  const notifications = Array.isArray(root?.notifications)
    ? root.notifications
    : [];

  return {
    notifications,
    unreadCount: Number(root?.unreadCount || 0),
    pages: Number(root?.pages || 1),
  };
};

export const useDeliveryNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  page: 1,
  hasMore: true,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/delivery/notifications", {
        params: { page, limit: 10 },
      });
      const payload = normalizePayload(response);

      set((state) => ({
        notifications:
          Number(page) === 1
            ? payload.notifications
            : (() => {
                const merged = [...state.notifications, ...payload.notifications];
                const seen = new Set();
                return merged.filter((item, index) => {
                  const key = String(item?._id || `${item?.createdAt || ""}-${index}`);
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
              })(),
        unreadCount: Number(payload.unreadCount || 0),
        page: Number(page),
        hasMore: Number(page) < Number(payload.pages || 1),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch delivery notifications:", error);
      set({ isLoading: false });
      toast.error("Failed to load notifications");
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/delivery/notifications/${id}/read`);
      set((state) => {
        const changed = state.notifications.some(
          (n) => String(n?._id) === String(id) && !n?.isRead
        );
        return {
          notifications: state.notifications.map((n) =>
            String(n?._id) === String(id) ? { ...n, isRead: true } : n
          ),
          unreadCount: changed
            ? Math.max(0, Number(state.unreadCount || 0) - 1)
            : state.unreadCount,
        };
      });
    } catch (error) {
      console.error("Failed to mark delivery notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put("/delivery/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all delivery notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  },

  removeNotification: async (id) => {
    try {
      await api.delete(`/delivery/notifications/${id}`);
      set((state) => {
        const existing = state.notifications.find(
          (n) => String(n?._id) === String(id)
        );
        return {
          notifications: state.notifications.filter(
            (n) => String(n?._id) !== String(id)
          ),
          unreadCount:
            existing && !existing?.isRead
              ? Math.max(0, Number(state.unreadCount || 0) - 1)
              : state.unreadCount,
        };
      });
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete delivery notification:", error);
      toast.error("Failed to delete notification");
    }
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      page: 1,
      hasMore: true,
    });
  },
}));
