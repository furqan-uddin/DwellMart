import { useState } from 'react';
import { FiSend, FiBell, FiUsers, FiTarget } from 'react-icons/fi';
import { motion } from 'framer-motion';
import AnimatedSelect from '../../components/AnimatedSelect';
import toast from 'react-hot-toast';

const PushNotifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all',
    schedule: 'now',
    scheduledDate: '',
  });

  const handleSend = () => {
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Push notification sent successfully');
    setFormData({ title: '', message: '', target: 'all', schedule: 'now', scheduledDate: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Push Notifications</h1>
        <p className="text-sm sm:text-base text-gray-600">Send push notifications to users</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiBell className="inline mr-2" />
              Notification Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notification title"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter notification message"
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiTarget className="inline mr-2" />
              Target Audience
            </label>
            <AnimatedSelect
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'customers', label: 'Customers Only' },
                { value: 'vip', label: 'VIP Customers' },
                { value: 'segment', label: 'Custom Segment' },
                { value: 'delivery-boy', label: 'Delivery boy' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule
            </label>
            <AnimatedSelect
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              options={[
                { value: 'now', label: 'Send Now' },
                { value: 'scheduled', label: 'Schedule Later' },
              ]}
            />
          </div>

          {formData.schedule === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required={formData.schedule === 'scheduled'}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold"
          >
            <FiSend />
            <span>Send Notification</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default PushNotifications;

