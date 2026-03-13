import { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiSmartphone, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Credit Card', icon: FiCreditCard, enabled: true, fee: 2.5 },
    { id: 2, name: 'Debit Card', icon: FiCreditCard, enabled: true, fee: 2.0 },
    { id: 3, name: 'Cash on Delivery', icon: FiDollarSign, enabled: true, fee: 0 },
    { id: 4, name: 'Digital Wallet', icon: FiSmartphone, enabled: false, fee: 1.5 },
    { id: 5, name: 'UPI', icon: FiSmartphone, enabled: false, fee: 0.5 },
  ]);

  const toggleMethod = (id) => {
    setPaymentMethods(paymentMethods.map((method) =>
      method.id === id ? { ...method, enabled: !method.enabled } : method
    ));
    toast.success('Payment method updated');
  };

  const updateFee = (id, fee) => {
    setPaymentMethods(paymentMethods.map((method) =>
      method.id === id ? { ...method, fee: parseFloat(fee) } : method
    ));
    toast.success('Processing fee updated');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Payment Methods</h1>
        <p className="text-sm sm:text-base text-gray-600">Configure payment options and fees</p>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div key={method.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{method.name}</h3>
                    <p className="text-sm text-gray-500">Processing fee: {method.fee}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Fee (%):</label>
                    <input
                      type="number"
                      value={method.fee}
                      onChange={(e) => updateFee(method.id, e.target.value)}
                      step="0.1"
                      min="0"
                      max="10"
                      className="w-20 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => toggleMethod(method.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      method.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {method.enabled ? <FiToggleRight className="text-xl" /> : <FiToggleLeft className="text-xl" />}
                    <span className="font-semibold">{method.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PaymentMethods;

