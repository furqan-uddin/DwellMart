import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEdit2, FiPlus, FiStar, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const emptyForm = {
  name: '',
  interval: 'month',
  price_inr: '',
  price_usd: '',
  description: '',
  featuresText: '{\n  "highlights": []\n}',
  isMostPopular: false,
  isActive: true,
  sortOrder: 0,
};

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/subscription-plans');
      setPlans(response?.data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreate = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      interval: plan.interval || 'month',
      price_inr: String(plan.pricing?.inr ?? plan.price_inr ?? 0),
      price_usd: String(plan.pricing?.usd ?? plan.price_usd ?? 0),
      description: plan.description || '',
      featuresText: JSON.stringify(plan.features || { highlights: [] }, null, 2),
      isMostPopular: Boolean(plan.isMostPopular),
      isActive: plan.isActive !== false,
      sortOrder: Number(plan.sortOrder || 0),
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let features;

    try {
      features = JSON.parse(formData.featuresText || '{}');
    } catch {
      toast.error('Features must be valid JSON.');
      return;
    }

    const payload = {
      name: formData.name,
      interval: formData.interval,
      price_inr: Number(formData.price_inr || 0),
      price_usd: Number(formData.price_usd || 0),
      description: formData.description,
      features,
      isMostPopular: formData.isMostPopular,
      isActive: formData.isActive,
      sortOrder: Number(formData.sortOrder || 0),
    };

    if (!payload.name.trim()) {
      toast.error('Plan name is required.');
      return;
    }

    try {
      if (editingPlan) {
        await api.put(`/admin/subscription-plans/${editingPlan._id}`, payload);
        toast.success('Plan updated.');
      } else {
        await api.post('/admin/subscription-plans', payload);
        toast.success('Plan created.');
      }
      setShowModal(false);
      fetchPlans();
    } catch {
      // toast handled globally
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription plan?')) return;
    try {
      await api.delete(`/admin/subscription-plans/${id}`);
      toast.success('Plan deleted.');
      fetchPlans();
    } catch {
      // toast handled globally
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Subscription Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Manage recurring vendor plans in INR and USD.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700"
        >
          <FiPlus />
          Add plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan._id} className={`rounded-[28px] border p-6 ${plan.isMostPopular ? 'border-teal-400 bg-teal-50/70' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                  <p className="text-sm text-slate-500">per {plan.interval}</p>
                </div>
                {plan.isMostPopular ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase text-amber-700">
                    <FiStar size={12} />
                    Popular
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">₹{Number(plan.pricing?.inr ?? 0).toFixed(0)}</p>
                <p className="text-lg font-bold text-slate-700">${Number(plan.pricing?.usd ?? 0).toFixed(2)}</p>
              </div>
              <p className="mt-3 text-sm text-slate-500">{plan.description || 'No description set.'}</p>
              <ul className="mt-4 space-y-2">
                {(plan.featureHighlights || []).slice(0, 4).map((feature) => (
                  <li key={`${plan._id}-${feature}`} className="text-sm text-slate-600">
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(plan)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                    <FiEdit2 />
                  </button>
                  <button type="button" onClick={() => handleDelete(plan._id)} className="rounded-full p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">{editingPlan ? 'Edit plan' : 'Create plan'}</h2>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} placeholder="Plan name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <select value={formData.interval} onChange={(event) => setFormData((prev) => ({ ...prev, interval: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500">
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                  <input value={formData.price_inr} onChange={(event) => setFormData((prev) => ({ ...prev, price_inr: event.target.value }))} type="number" min="0" step="0.01" placeholder="Price INR" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <input value={formData.price_usd} onChange={(event) => setFormData((prev) => ({ ...prev, price_usd: event.target.value }))} type="number" min="0" step="0.01" placeholder="Price USD" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                </div>
                <textarea value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} rows={2} placeholder="Description" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                <textarea value={formData.featuresText} onChange={(event) => setFormData((prev) => ({ ...prev, featuresText: event.target.value }))} rows={8} placeholder='{"highlights":[]}' className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-teal-500" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={formData.isMostPopular} onChange={(event) => setFormData((prev) => ({ ...prev, isMostPopular: event.target.checked }))} /> Most popular</label>
                  <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={formData.isActive} onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))} /> Active</label>
                  <input value={formData.sortOrder} onChange={(event) => setFormData((prev) => ({ ...prev, sortOrder: event.target.value }))} type="number" placeholder="Sort order" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                </div>
                <button type="submit" className="w-full rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700">{editingPlan ? 'Update plan' : 'Create plan'}</button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionPlans;

