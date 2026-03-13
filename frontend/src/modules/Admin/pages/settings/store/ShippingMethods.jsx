import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiTruck, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../../components/ConfirmModal';
import AnimatedSelect from '../../../components/AnimatedSelect';
import { formatCurrency } from '../../../utils/adminHelpers';
import toast from 'react-hot-toast';

const ShippingMethods = () => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const [shippingMethods, setShippingMethods] = useState([
    { id: 1, name: 'Standard Shipping', cost: 5.99, estimatedDays: '3-5', enabled: true },
    { id: 2, name: 'Express Shipping', cost: 12.99, estimatedDays: '1-2', enabled: true },
    { id: 3, name: 'Overnight Shipping', cost: 24.99, estimatedDays: '1', enabled: false },
  ]);
  const [editingMethod, setEditingMethod] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const handleSave = (methodData) => {
    if (editingMethod && editingMethod.id) {
      setShippingMethods(shippingMethods.map((m) => (m.id === editingMethod.id ? { ...methodData, id: editingMethod.id } : m)));
      toast.success('Shipping method updated');
    } else {
      setShippingMethods([...shippingMethods, { ...methodData, id: shippingMethods.length + 1 }]);
      toast.success('Shipping method added');
    }
    setEditingMethod(null);
  };

  const handleDelete = () => {
    setShippingMethods(shippingMethods.filter((m) => m.id !== deleteModal.id));
    setDeleteModal({ isOpen: false, id: null });
    toast.success('Shipping method deleted');
  };

  const toggleMethod = (id) => {
    setShippingMethods(shippingMethods.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
    toast.success('Shipping method updated');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Shipping Methods</h1>
          <p className="text-sm sm:text-base text-gray-600">Configure shipping options and rates</p>
        </div>
        <button
          onClick={() => setEditingMethod({})}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold text-sm"
        >
          <FiPlus />
          <span>Add Method</span>
        </button>
      </div>

      <div className="space-y-4">
        {shippingMethods.map((method) => (
          <div key={method.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiTruck className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{method.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-600">Cost: {formatCurrency(method.cost)}</p>
                    <p className="text-sm text-gray-600">Est. Delivery: {method.estimatedDays} days</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingMethod(method)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, id: method.id })}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 />
                </button>
                <button
                  onClick={() => toggleMethod(method.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    method.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {method.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingMethod !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setEditingMethod(null)}
              className="fixed inset-0 bg-black/50 z-[10000]"
            />
            
            {/* Modal Content - Mobile: Slide up from bottom, Desktop: Center with scale */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[10000] flex ${isAppRoute ? 'items-start pt-[10px]' : 'items-end'} sm:items-center justify-center p-4 pointer-events-none`}
            >
              <motion.div
                variants={{
                  hidden: { 
                    y: isAppRoute ? '-100%' : '100%',
                    scale: 0.95,
                    opacity: 0
                  },
                  visible: { 
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    transition: { 
                      type: 'spring',
                      damping: 22,
                      stiffness: 350,
                      mass: 0.7
                    }
                  },
                  exit: { 
                    y: isAppRoute ? '-100%' : '100%',
                    scale: 0.95,
                    opacity: 0,
                    transition: { 
                      type: 'spring',
                      damping: 30,
                      stiffness: 400
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className={`bg-white ${isAppRoute ? 'rounded-b-3xl' : 'rounded-t-3xl'} sm:rounded-xl shadow-xl p-6 max-w-md w-full pointer-events-auto`}
                style={{ willChange: 'transform' }}
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {editingMethod.id ? 'Edit Shipping Method' : 'Add Shipping Method'}
                </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleSave({
                  name: formData.get('name'),
                  cost: parseFloat(formData.get('cost')),
                  estimatedDays: formData.get('estimatedDays'),
                  enabled: formData.get('enabled') === 'true',
                });
              }}
              className="space-y-4"
            >
              <input
                type="text"
                name="name"
                defaultValue={editingMethod.name || ''}
                placeholder="Method Name"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                name="cost"
                defaultValue={editingMethod.cost || ''}
                placeholder="Shipping Cost"
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                name="estimatedDays"
                defaultValue={editingMethod.estimatedDays || ''}
                placeholder="Estimated Days (e.g., 3-5)"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <AnimatedSelect
                name="enabled"
                value={editingMethod.enabled ? 'true' : 'false'}
                onChange={(e) => {
                  const form = e.target.closest('form');
                  if (form) {
                    const enabledInput = form.querySelector('[name="enabled"]');
                    if (enabledInput) enabledInput.value = e.target.value;
                  }
                }}
                options={[
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' },
                ]}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Shipping Method?"
        message="Are you sure you want to delete this shipping method? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </motion.div>
  );
};

export default ShippingMethods;

