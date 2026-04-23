import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiBell, FiCheck, FiTrash2, FiInbox, FiRefreshCw } from "react-icons/fi";
import MobileLayout from "../components/Layout/MobileLayout";
import PageTransition from "../../../shared/components/PageTransition";
import { useUserNotificationStore } from "../store/userNotificationStore";
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const UserNotifications = () => {
  const { getTranslatedText: t } = usePageTranslation([
    'Notifications',
    'unread',
    'Refresh',
    'Mark all read',
    'Loading notifications...',
    'No notifications yet',
    'Order and account updates will appear here.',
    'Notification',
    'Mark as read',
    'Delete notification',
    'Load more',
    'Loading...'
  ]);
  const {
    notifications,
    unreadCount,
    isLoading,
    page,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useUserNotificationStore();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return (
    <PageTransition>
      <MobileLayout showBottomNav={true} showCartBar={true}>
        <div className="px-4 py-4 sm:py-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-3"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t('Notifications')}</h1>
              <p className="text-sm text-gray-600">{unreadCount} {t('unread')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotifications(1)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                type="button"
              >
                <span className="inline-flex items-center gap-1">
                  <FiRefreshCw />
                  {t('Refresh')}
                </span>
              </button>
              <button
                onClick={markAllAsRead}
                disabled={!notifications.length || unreadCount === 0}
                className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {t('Mark all read')}
              </button>
            </div>
          </motion.div>

          {isLoading && notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-200 text-gray-600">
              {t('Loading notifications...')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
              <FiInbox className="mx-auto mb-3 text-4xl text-gray-400" />
              <p className="text-gray-700 font-semibold">{t('No notifications yet')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t('Order and account updates will appear here.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, idx) => (
                <motion.div
                  key={notification?._id || `${idx}-${notification?.createdAt || ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`rounded-2xl p-4 shadow-sm border ${
                    notification?.isRead
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FiBell className={notification?.isRead ? "text-gray-400" : "text-primary-600"} />
                        <h3 className="font-semibold text-gray-800 truncate">
                          {notification?.title || t("Notification")}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 break-words">
                        {notification?.message || "-"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDateTime(notification?.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!notification?.isRead && (
                        <button
                          onClick={() => markAsRead(notification?._id)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-white"
                          title={t("Mark as read")}
                          type="button"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification?._id)}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        title={t("Delete notification")}
                        type="button"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {hasMore && notifications.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => fetchNotifications(Number(page || 1) + 1)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoading ? t("Loading...") : t("Load more")}
              </button>
            </div>
          )}
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default UserNotifications;

