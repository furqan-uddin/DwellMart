import { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { useSettingsStore } from '../../../../shared/store/settingsStore';

const ShippingSettings = () => {
  const { settings, updateSettings, initialize } = useSettingsStore();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    initialize();
    if (settings && settings.shipping) {
      setFormData(settings.shipping);
    }
  }, []);

  useEffect(() => {
    if (settings && settings.shipping) {
      setFormData(settings.shipping);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings('shipping', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Free Shipping Threshold
          </label>
          <input
            type="number"
            name="freeShippingThreshold"
            value={formData.freeShippingThreshold || 100}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Free shipping for orders above this amount</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Default Shipping Rate
          </label>
          <input
            type="number"
            name="defaultShippingRate"
            value={formData.defaultShippingRate || 5}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Default shipping cost</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Shipping Methods</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.shippingMethods?.includes('standard') || false}
            onChange={(e) => {
              const methods = formData.shippingMethods || [];
              if (e.target.checked) {
                setFormData({ ...formData, shippingMethods: [...methods, 'standard'] });
              } else {
                setFormData({
                  ...formData,
                  shippingMethods: methods.filter((m) => m !== 'standard'),
                });
              }
            }}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">Standard Shipping</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.shippingMethods?.includes('express') || false}
            onChange={(e) => {
              const methods = formData.shippingMethods || [];
              if (e.target.checked) {
                setFormData({ ...formData, shippingMethods: [...methods, 'express'] });
              } else {
                setFormData({
                  ...formData,
                  shippingMethods: methods.filter((m) => m !== 'express'),
                });
              }
            }}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">Express Shipping</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold"
        >
          <FiSave />
          Save Settings
        </button>
      </div>
    </form>
  );
};

export default ShippingSettings;

