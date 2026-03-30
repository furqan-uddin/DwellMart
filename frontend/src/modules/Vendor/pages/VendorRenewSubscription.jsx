import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const VendorRenewSubscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: if no vendor token, redirect to login (not register)
  useEffect(() => {
    const token =
      localStorage.getItem('vendor-token') ||
      (() => {
        try {
          const stored = localStorage.getItem('vendor-auth-storage');
          return stored ? JSON.parse(stored)?.state?.token : null;
        } catch {
          return null;
        }
      })();

    if (!token) {
      navigate('/vendor/login', { replace: true });
      return;
    }

    const fetchPlans = async () => {
      try {
        const res = await api.get('/vendor/subscription/plans');
        const data = (res?.data || []).filter((p) => !p.isTrial);
        setPlans(data);
      } catch {
        toast.error('Failed to load subscription plans. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [navigate]);

  const handleRenew = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a plan to continue.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/vendor/subscription/renew', { planId: selectedPlanId });
      toast.success('Subscription renewed successfully! Redirecting…');
      // Small delay so toast is visible, then reload to re-check subscription
      setTimeout(() => {
        window.location.href = '/vendor/dashboard';
      }, 1200);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Renewal failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-amber-500 text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Renew Your Subscription</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Your subscription has expired. Choose a plan below to continue selling on Dwell Mart.
          </p>
        </div>

        {/* Plans */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse shadow-sm border border-gray-100">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-gray-100 rounded w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No subscription plans available at the moment.</p>
            <p className="text-sm mt-1">Please contact support for assistance.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan._id;
              return (
                <motion.div
                  key={plan._id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all shadow-sm ${
                    isSelected
                      ? 'border-primary-500 shadow-primary-100 shadow-md'
                      : 'border-gray-100 hover:border-primary-200'
                  }`}
                >
                  {/* Plan Name */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
                    {isSelected && (
                      <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <FiCheck className="text-white text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-black text-gray-900">
                      {plan.currency || 'AED'} {plan.price}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">/ {plan.durationDays} days</span>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <FiCheck className="text-primary-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {!isLoading && plans.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRenew}
              disabled={!selectedPlanId || isSubmitting}
              className="px-10 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? 'Processing…' : 'Subscribe & Continue'}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('vendor-token');
                localStorage.removeItem('vendor-refresh-token');
                localStorage.removeItem('vendor-auth-storage');
                navigate('/vendor/login');
              }}
              className="px-10 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              <span className="flex items-center gap-2">
                <FiArrowLeft /> Logout
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VendorRenewSubscription;
