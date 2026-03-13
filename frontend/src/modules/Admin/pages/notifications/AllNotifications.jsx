import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiBell, FiCheck, FiChevronDown } from "react-icons/fi";
import { useNotificationStore } from "../../store/notificationStore";
import { formatDateTime } from "../../utils/adminHelpers";

const AllNotifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    page,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Notifications
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          View and manage all admin notifications
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiBell className="text-gray-600" />
            <span className="font-semibold text-gray-800">All Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Mark all read
            </button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <FiBell className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`border rounded-lg p-4 transition-colors ${
                  notification.isRead
                    ? "border-gray-200 bg-white"
                    : "border-blue-200 bg-blue-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Mark as read"
                    >
                      <FiCheck />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchNotifications(page + 1)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <FiChevronDown />
              {isLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AllNotifications;

