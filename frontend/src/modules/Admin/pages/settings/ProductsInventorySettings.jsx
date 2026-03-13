import { useState, useEffect } from 'react';
import { FiSave, FiPackage, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../../../shared/store/settingsStore';
import AnimatedSelect from '../../components/AnimatedSelect';
import toast from 'react-hot-toast';

const ProductsInventorySettings = () => {
  const { settings, updateSettings, initialize } = useSettingsStore();
  const [productsData, setProductsData] = useState({});
  const [taxData, setTaxData] = useState({});
  const [activeSection, setActiveSection] = useState('products');

  useEffect(() => {
    initialize();
    if (settings) {
      if (settings.products) setProductsData(settings.products);
      if (settings.tax) setTaxData(settings.tax);
    }
  }, []);

  useEffect(() => {
    if (settings) {
      if (settings.products) setProductsData(settings.products);
      if (settings.tax) setTaxData(settings.tax);
    }
  }, [settings]);

  const handleProductsChange = (e) => {
    const { name, value } = e.target;
    setProductsData({
      ...productsData,
      [name]: value,
    });
  };

  const handleTaxChange = (e) => {
    const { name, value } = e.target;
    setTaxData({
      ...taxData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings('products', productsData);
    updateSettings('tax', taxData);
    toast.success('Settings saved successfully');
  };

  const sections = [
    { id: 'products', label: 'Product Display', icon: FiPackage },
    { id: 'tax', label: 'Tax & Pricing', icon: FiDollarSign },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-full overflow-x-hidden"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Products & Inventory</h1>
        <p className="text-sm sm:text-base text-gray-600">Configure product display and tax settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-full overflow-x-hidden">
        <div className="border-b border-gray-200 overflow-x-hidden">
          <div className="flex overflow-x-auto scrollbar-hide -mx-1 px-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm ${activeSection === section.id
                      ? 'border-primary-600 text-primary-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Icon className="text-base sm:text-lg" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
          {/* Products Section */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Items Per Page
                  </label>
                  <input
                    type="number"
                    name="itemsPerPage"
                    value={productsData.itemsPerPage || 12}
                    onChange={handleProductsChange}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of products displayed per page</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grid Columns
                  </label>
                  <AnimatedSelect
                    name="gridColumns"
                    value={productsData.gridColumns || 4}
                    onChange={handleProductsChange}
                    options={[
                      { value: 2, label: '2 Columns' },
                      { value: 3, label: '3 Columns' },
                      { value: 4, label: '4 Columns' },
                      { value: 5, label: '5 Columns' },
                      { value: 6, label: '6 Columns' },
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of columns in product grid</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Sort
                  </label>
                  <AnimatedSelect
                    name="defaultSort"
                    value={productsData.defaultSort || 'popularity'}
                    onChange={handleProductsChange}
                    options={[
                      { value: 'popularity', label: 'Popularity' },
                      { value: 'price-low', label: 'Price: Low to High' },
                      { value: 'price-high', label: 'Price: High to Low' },
                      { value: 'newest', label: 'Newest First' },
                      { value: 'rating', label: 'Highest Rated' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={productsData.lowStockThreshold || 10}
                    onChange={handleProductsChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Out of Stock Behavior
                  </label>
                  <AnimatedSelect
                    name="outOfStockBehavior"
                    value={productsData.outOfStockBehavior || 'show'}
                    onChange={handleProductsChange}
                    options={[
                      { value: 'show', label: 'Show with "Out of Stock" message' },
                      { value: 'hide', label: 'Hide from listings' },
                    ]}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800">Stock Alerts</h4>
                    <p className="text-xs text-gray-600">Send notifications when stock is low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 sm:ml-4">
                    <input
                      type="checkbox"
                      name="stockAlertsEnabled"
                      checked={productsData.stockAlertsEnabled !== false}
                      onChange={(e) => setProductsData({ ...productsData, stockAlertsEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tax & Pricing Section */}
          {activeSection === 'tax' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="defaultTaxRate"
                    value={taxData.defaultTaxRate || 18}
                    onChange={handleTaxChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default tax rate applied to all products</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tax Calculation Method
                  </label>
                  <AnimatedSelect
                    name="taxCalculationMethod"
                    value={taxData.taxCalculationMethod || 'exclusive'}
                    onChange={handleTaxChange}
                    options={[
                      { value: 'exclusive', label: 'Exclusive (Tax added on top)' },
                      { value: 'inclusive', label: 'Inclusive (Tax included in price)' },
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">How tax is calculated and displayed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Display Format
                  </label>
                  <AnimatedSelect
                    name="priceDisplayFormat"
                    value={taxData.priceDisplayFormat || 'INR'}
                    onChange={handleTaxChange}
                    options={[
                      { value: 'INR', label: 'INR (₹)' },
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 sm:px-6 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
            >
              <FiSave />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProductsInventorySettings;

