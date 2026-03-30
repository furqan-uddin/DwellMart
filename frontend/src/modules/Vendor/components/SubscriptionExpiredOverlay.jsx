import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

const SubscriptionExpiredOverlay = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('vendor-token');
    localStorage.removeItem('vendor-refresh-token');
    localStorage.removeItem('vendor-auth-storage');
    navigate('/vendor/login');
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[99999] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertTriangle className="text-red-500 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Subscription Expired</h2>
        <p className="text-gray-500 mb-6">
          Your subscription has ended. Please resubscribe to continue managing your store.
        </p>

        <button
          onClick={() => navigate('/vendor/renew-subscription')}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all mb-3"
        >
          Resubscribe Now
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
        >
          Logout
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionExpiredOverlay;
