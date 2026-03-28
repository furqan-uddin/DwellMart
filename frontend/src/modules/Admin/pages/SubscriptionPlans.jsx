import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', currency: 'AED', durationDays: '', description: '',
    features: [''], isTrial: false, isMostPopular: false, isActive: true, sortOrder: 0,
  });

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/subscription-plans');
      setPlans(res?.data || []);
    } catch { /* error toast handled */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const resetForm = () => {
    setFormData({
      name: '', price: '', currency: 'AED', durationDays: '', description: '',
      features: [''], isTrial: false, isMostPopular: false, isActive: true, sortOrder: 0,
    });
    setEditingPlan(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name, price: String(plan.price), currency: plan.currency || 'AED',
      durationDays: String(plan.durationDays), description: plan.description || '',
      features: plan.features?.length > 0 ? [...plan.features] : [''],
      isTrial: !!plan.isTrial, isMostPopular: !!plan.isMostPopular,
      isActive: plan.isActive !== false, sortOrder: plan.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays),
      sortOrder: Number(formData.sortOrder),
      features: formData.features.filter((f) => f.trim()),
    };

    try {
      if (editingPlan) {
        await api.put(`/admin/subscription-plans/${editingPlan._id}`, payload);
        toast.success('Plan updated.');
      } else {
        await api.post('/admin/subscription-plans', payload);
        toast.success('Plan created.');
      }
      setShowModal(false);
      resetForm();
      fetchPlans();
    } catch { /* error toast */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/admin/subscription-plans/${id}`);
      toast.success('Plan deleted.');
      fetchPlans();
    } catch { /* error toast */ }
  };

  const addFeature = () => setFormData((p) => ({ ...p, features: [...p.features, ''] }));
  const removeFeature = (i) => setFormData((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));
  const updateFeature = (i, val) => setFormData((p) => {
    const f = [...p.features]; f[i] = val; return { ...p, features: f };
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor membership plans</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all text-sm">
          <FiPlus /> Add Plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No plans yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan._id}
              className={`bg-white rounded-xl border-2 p-5 relative ${
                plan.isMostPopular ? 'border-primary-500' : 'border-gray-100'
              } ${!plan.isActive ? 'opacity-60' : ''}`}>
              {plan.isMostPopular && (
                <span className="absolute top-2 right-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FiStar className="text-[8px]" /> POPULAR
                </span>
              )}
              {plan.isTrial && (
                <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  TRIAL
                </span>
              )}
              <h3 className="font-bold text-gray-800 mb-1 mt-2">{plan.name}</h3>
              <p className="text-2xl font-extrabold text-gray-900 mb-1">
                {plan.price === 0 ? 'FREE' : `${plan.price} ${plan.currency}`}
              </p>
              <p className="text-xs text-gray-400 mb-3">{plan.durationDays} days</p>
              {plan.features?.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                      <FiCheck className="text-primary-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-400">+{plan.features.length - 3} more</li>
                  )}
                </ul>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex-1" />
                <button onClick={() => openEdit(plan)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                  <FiEdit2 className="text-sm" />
                </button>
                <button onClick={() => handleDelete(plan._id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">
                  {editingPlan ? 'Edit Plan' : 'Create Plan'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Plan Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Price *</label>
                    <input type="number" min="0" step="0.01" value={formData.price}
                      onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Currency</label>
                    <input type="text" value={formData.currency}
                      onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Duration (days) *</label>
                  <input type="number" min="1" value={formData.durationDays}
                    onChange={(e) => setFormData((p) => ({ ...p, durationDays: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <textarea value={formData.description} rows={2}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Features</label>
                  {formData.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" value={f} onChange={(e) => updateFeature(i, e.target.value)}
                        placeholder={`Feature ${i + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                      {formData.features.length > 1 && (
                        <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600">
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addFeature}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    + Add Feature
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.isTrial}
                      onChange={(e) => setFormData((p) => ({ ...p, isTrial: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded" />
                    Trial Plan
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.isMostPopular}
                      onChange={(e) => setFormData((p) => ({ ...p, isMostPopular: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded" />
                    Most Popular
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.isActive}
                      onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded" />
                    Active
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sort Order</label>
                  <input type="number" value={formData.sortOrder}
                    onChange={(e) => setFormData((p) => ({ ...p, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                </div>
                <button type="submit"
                  className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all text-sm">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionPlans;
