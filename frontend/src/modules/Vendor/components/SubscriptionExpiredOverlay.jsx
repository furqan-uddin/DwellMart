import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const SubscriptionExpiredOverlay = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/vendor/subscription/plans');
        setPlans((res?.data || []).filter((p) => !p.isTrial));
      } catch {
        // Silently fail
      }
    };
    fetchPlans();
  }, []);

  const handleRenew = async () => {
    if (!selectedPlanId) return;
    setIsLoading(true);
    try {
      await api.post('/vendor/subscription/renew', { planId: selectedPlanId });
      // Force a full reload to re-check subscription status
      window.location.reload();
    } catch {
      // Error toast handled by api interceptor
    } finally {
      setIsLoading(false);
    }
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

        {plans.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:border-primary-400 text-sm"
            >
              <option value="">Select a plan to renew</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} — {plan.price} {plan.currency || 'AED'} / {plan.durationDays} days
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleRenew}
          disabled={!selectedPlanId || isLoading}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {isLoading ? 'Processing...' : 'Resubscribe Now'}
        </button>
        <button
          onClick={() => {
            // Logout and redirect to login
            localStorage.removeItem('vendor-token');
            localStorage.removeItem('vendor-refresh-token');
            localStorage.removeItem('vendor-auth-storage');
            navigate('/vendor/login');
            window.location.reload();
          }}
          className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
        >
          Logout
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionExpiredOverlay;
