import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { FiUser, FiMail, FiPhone, FiTruck, FiEdit2, FiSave, FiX, FiLogOut } from 'react-icons/fi';
import PageTransition from '../../../shared/components/PageTransition';
import toast from 'react-hot-toast';
import { formatPrice } from '../../../shared/utils/helpers';

const DeliveryProfile = () => {
  const navigate = useNavigate();
  const { deliveryBoy, updateProfile, fetchProfile, fetchProfileSummary, isLoading, logout } = useDeliveryAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [profileMetrics, setProfileMetrics] = useState({
    totalDeliveries: 0,
    completedToday: 0,
    earnings: 0,
  });
  const [formData, setFormData] = useState({
    name: deliveryBoy?.name || '',
    email: deliveryBoy?.email || '',
    phone: deliveryBoy?.phone || '',
    vehicleType: deliveryBoy?.vehicleType || '',
    vehicleNumber: deliveryBoy?.vehicleNumber || '',
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoadFailed(false);
      const profile = await fetchProfile();
      try {
        const summary = await fetchProfileSummary();
        setProfileMetrics({
          totalDeliveries: Number(summary?.totalDeliveries || 0),
          completedToday: Number(summary?.completedToday || 0),
          earnings: Number(summary?.earnings || 0),
        });
      } catch {
        setProfileMetrics({
          totalDeliveries: Number(profile?.totalDeliveries || 0),
          completedToday: 0,
          earnings: 0,
        });
      }
    } catch {
      setLoadFailed(true);
    }
  }, [fetchProfile, fetchProfileSummary]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setFormData({
      name: deliveryBoy?.name || '',
      email: deliveryBoy?.email || '',
      phone: deliveryBoy?.phone || '',
      vehicleType: deliveryBoy?.vehicleType || '',
      vehicleNumber: deliveryBoy?.vehicleNumber || '',
    });
  }, [deliveryBoy]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('Phone is required');
      return;
    }
    try {
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        vehicleType: formData.vehicleType?.trim() || '',
        vehicleNumber: formData.vehicleNumber?.trim() || '',
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch {
      // Error toast handled by API interceptor.
    }
  };

  const handleCancel = () => {
    setFormData({
      name: deliveryBoy?.name || '',
      email: deliveryBoy?.email || '',
      phone: deliveryBoy?.phone || '',
      vehicleType: deliveryBoy?.vehicleType || '',
      vehicleNumber: deliveryBoy?.vehicleNumber || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/delivery/login');
  };

  const stats = [
    { label: 'Total Deliveries', value: Number(profileMetrics.totalDeliveries || 0) },
    { label: 'Completed Today', value: Number(profileMetrics.completedToday || 0) },
    { label: 'Rating', value: Number(deliveryBoy?.rating || 0).toFixed(1) },
    { label: 'Earnings', value: formatPrice(Number(profileMetrics.earnings || 0)) },
  ];

  return (
    <PageTransition>
      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">My Profile</h1>
              {loadFailed && (
                <button
                  onClick={loadProfile}
                  className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold"
                >
                  Retry
                </button>
              )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              >
                <FiEdit2 />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
                >
                  <FiSave />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
                >
                  <FiX />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 gradient-green rounded-full flex items-center justify-center text-3xl font-bold">
              {deliveryBoy?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <p className="text-xl font-semibold">{deliveryBoy?.name || 'Delivery Boy'}</p>
              <p className="text-primary-100 text-sm">{deliveryBoy?.email || 'email@example.com'}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiUser />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formData.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiMail />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formData.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiPhone />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formData.phone}</p>
            )}
          </div>
        </motion.div>

        {/* Vehicle Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiTruck />
            Vehicle Information
          </h2>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
            {isEditing ? (
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none"
              >
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
                <option value="Scooter">Scooter</option>
                <option value="Van">Van</option>
              </select>
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formData.vehicleType}</p>
            )}
          </div>

          {/* Vehicle Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Number</label>
            {isEditing ? (
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formData.vehicleNumber}</p>
            )}
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
          >
            <FiLogOut className="text-xl" />
            <span>Logout</span>
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DeliveryProfile;

