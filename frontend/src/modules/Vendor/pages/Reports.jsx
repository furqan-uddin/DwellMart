import { useState } from 'react';
import { FiFileText, FiTrendingUp, FiPackage, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';
import SalesReport from './reports/SalesReport';
import ProductPerformanceReport from './reports/ProductPerformanceReport';
import CustomerInsightsReport from './reports/CustomerInsightsReport';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');

  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: FiTrendingUp },
    { id: 'products', label: 'Product Performance', icon: FiPackage },
    { id: 'customers', label: 'Customer Insights', icon: FiUsers },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FiFileText className="text-primary-600" />
          Reports
        </h1>
        <p className="text-sm sm:text-base text-gray-600">View detailed analytics and reports</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}>
                <Icon className="text-sm sm:text-base" />
                <span className="text-sm sm:text-base font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'sales' && <SalesReport />}
          {activeTab === 'products' && <ProductPerformanceReport />}
          {activeTab === 'customers' && <CustomerInsightsReport />}
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;

