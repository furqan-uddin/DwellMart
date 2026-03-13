import { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import { useSettingsStore } from "../../../../shared/store/settingsStore";
import AnimatedSelect from "../AnimatedSelect";

const PaymentSettings = () => {
  const { settings, updateSettings, initialize } = useSettingsStore();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    initialize();
    if (settings && settings.payment) {
      setFormData(settings.payment);
    }
  }, []);

  useEffect(() => {
    if (settings && settings.payment) {
      setFormData(settings.payment);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings("payment", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Payment Methods</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="codEnabled"
            checked={formData.codEnabled || false}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">
            Cash on Delivery (COD)
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="cardEnabled"
            checked={formData.cardEnabled || false}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">
            Credit/Debit Card
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="walletEnabled"
            checked={formData.walletEnabled || false}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">
            Digital Wallet
          </span>
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Payment Gateway</h3>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gateway Provider
          </label>
          <AnimatedSelect
            name="paymentGateway"
            value={formData.paymentGateway || "stripe"}
            onChange={handleChange}
            options={[
              { value: 'stripe', label: 'Stripe' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'razorpay', label: 'Razorpay' },
            ]}
          />
        </div>

        {formData.paymentGateway === "stripe" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stripe Public Key
              </label>
              <input
                type="text"
                name="stripePublicKey"
                value={formData.stripePublicKey || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stripe Secret Key
              </label>
              <input
                type="password"
                name="stripeSecretKey"
                value={formData.stripeSecretKey || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="sk_test_..."
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold">
          <FiSave />
          Save Settings
        </button>
      </div>
    </form>
  );
};

export default PaymentSettings;
