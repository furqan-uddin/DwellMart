import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { FiPackage, FiCheckCircle, FiClock, FiTrendingUp, FiMapPin, FiTruck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../../shared/components/PageTransition';
import toast from 'react-hot-toast';
import { formatPrice } from '../../../shared/utils/helpers';

const DeliveryDashboard = () => {
  const { deliveryBoy, updateStatus, fetchProfile, fetchDashboardSummary, isUpdatingStatus } = useDeliveryAuthStore();
  const navigate = useNavigate();
  const statusMenuRef = useRef(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedToday: 0,
    openOrders: 0,
    earnings: 0,
  });
  const statCards = [
    {
      icon: FiPackage,
      label: 'Total Orders',
      value: stats.totalOrders,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      icon: FiCheckCircle,
      label: 'Completed Today',
      value: stats.completedToday,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      icon: FiClock,
      label: 'Open Orders',
      value: stats.openOrders,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      icon: FiTrendingUp,
      label: 'Earnings',
      value: formatPrice(stats.earnings),
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  const loadDashboardData = async () => {
    try {
      setLoadFailed(false);
      setIsDashboardLoading(true);
      await fetchProfile();
      const summary = await fetchDashboardSummary();
      setRecentOrders(summary.recentOrders || []);
      setStats({
        totalOrders: Number(summary.totalOrders || 0),
        completedToday: Number(summary.completedToday || 0),
        openOrders: Number(summary.openOrders || 0),
        earnings: Number(summary.earnings || 0),
      });
    } catch {
      setLoadFailed(true);
      setRecentOrders([]);
      setStats({
        totalOrders: 0,
        completedToday: 0,
        openOrders: 0,
        earnings: 0,
      });
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [fetchDashboardSummary, fetchProfile]);

  useEffect(() => {
    if (!statusMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [statusMenuOpen]);

  const handleStatusChange = async (newStatus) => {
    if (isUpdatingStatus) return;
    try {
      await updateStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setStatusMenuOpen(false);
    } catch {
      // Error toast already handled by API interceptor.
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusButtonColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'busy':
        return '#f59e0b';
      case 'offline':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const displayOrders = recentOrders.length > 0 ? recentOrders : [];

  return (
    <PageTransition>
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {deliveryBoy?.name || 'Delivery Boy'}!</h1>
              <p className="text-primary-100 text-sm">
                {deliveryBoy?.status === 'available' 
                  ? 'You are available for new orders' 
                  : deliveryBoy?.status === 'busy'
                  ? 'You are currently busy'
                  : 'You are offline'}
              </p>
            </div>
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: getStatusButtonColor(deliveryBoy?.status) }}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                {deliveryBoy?.status || 'offline'}
              </button>

              <AnimatePresence>
                {statusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    <button
                      onClick={() => handleStatusChange('available')}
                      disabled={isUpdatingStatus}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleStatusChange('busy')}
                      disabled={isUpdatingStatus}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 text-yellow-700"
                    >
                      Busy
                    </button>
                    <button
                      onClick={() => handleStatusChange('offline')}
                      disabled={isUpdatingStatus}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      Offline
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiTruck className="text-lg" />
              <span className="text-sm">{deliveryBoy?.vehicleType || 'Bike'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{deliveryBoy?.vehicleNumber || 'N/A'}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bgColor} rounded-xl p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`${stat.textColor} text-xl`} />
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white text-lg" />
                  </div>
                </div>
                <p className={`${stat.textColor} text-xs font-medium mb-1`}>{stat.label}</p>
                <p className={`${stat.textColor} text-xl font-bold`}>
                  {isDashboardLoading ? <span className="inline-block h-6 w-16 rounded bg-white/60 animate-pulse" /> : stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
            <div className="flex items-center gap-3">
              {loadFailed && (
                <button
                  onClick={loadDashboardData}
                  className="text-red-500 text-xs font-semibold"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => navigate('/delivery/orders')}
                className="text-primary-600 text-sm font-semibold"
              >
                View All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {isDashboardLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border border-gray-200 rounded-xl p-4">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-40 bg-gray-100 rounded animate-pulse mb-3" />
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            )}
            {!isDashboardLoading && displayOrders.length === 0 && (
              <div className="text-sm text-gray-500 py-3 text-center">No assigned orders yet.</div>
            )}
            {!isDashboardLoading && displayOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => navigate(`/delivery/orders/${order.id}`)}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FiMapPin className="text-primary-600" />
                  <span>{order.address || 'Address unavailable'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Distance: {order.distance || '-'}</span>
                  <span className="font-bold text-primary-600">{formatPrice(order.amount)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </PageTransition>
  );
};

export default DeliveryDashboard;

